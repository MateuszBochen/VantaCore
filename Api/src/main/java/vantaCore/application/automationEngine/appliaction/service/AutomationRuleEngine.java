package vantaCore.application.automationEngine.appliaction.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import vantaCore.application.automationEngine.domain.AutomationRuleExecutionAggregate;
import vantaCore.application.automationEngine.domain.AutomationEngineRuleAggregate;
import vantaCore.application.automationEngine.domain.AutomationEngineRuleSnapshot;
import vantaCore.application.automationEngine.domain.repository.AutomationEngineRuleRepositoryInterface;
import vantaCore.application.automationEngine.domain.repository.AutomationRuleExecutionRepositoryInterface;
import vantaCore.application.automationEngine.domain.vo.AutomationAction;
import vantaCore.application.automationEngine.domain.vo.AutomationTrigger;
import vantaCore.application.automationEngine.domain.vo.ExecutedActionResult;
import vantaCore.application.automationEngine.domain.vo.ExecutionStatus;
import vantaCore.application.automationEngine.domain.vo.TriggerType;
import vantaCore.application.automationEngine.infrastructure.security.AutomationSecurityContext;
import vantaCore.application.ticket.domain.TicketSnapshot;
import vantaCore.application.ticket.domain.repository.TicketAggregateRepositoryInterface;
import vantaCore.application.ticket.domain.vo.TicketId;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Executor;

/** Entry point for all 4 trigger types (see the appliaction.eventHandler classes) - reacts to a
 domain event by finding this project's enabled rules for that trigger type, evaluating each one's
 conditions against the ticket's CURRENT state, and running its actions if they match.

 Async, per the Automation Engine ADR: the very first call for a given HTTP request hands off to
 automationEngineExecutor and returns immediately, so a rule's actions never add latency to (or can
 fail) the request that triggered them. Everything AFTER that hand-off - including a rule's action
 itself triggering another rule, arbitrarily deep - runs synchronously on that one worker thread;
 see AutomationExecutionContext for why that's what makes its ThreadLocal-based loop-protection
 depth counter safe, and why the ticket-mutation events this class reacts to are deliberately NOT
 marked AsyncEvent (that would route each recursive re-trigger through the executor again, moving
 it to a different pooled thread and losing the depth ThreadLocal). */
@Component
public class AutomationRuleEngine {

    private static final Logger log = LoggerFactory.getLogger(AutomationRuleEngine.class);

    // Per the ADR: "execution stops once a max depth (e.g. 5) is hit".
    private static final int MAX_DEPTH = 5;

    private final AutomationEngineRuleRepositoryInterface ruleRepository;
    private final AutomationRuleExecutionRepositoryInterface executionRepository;
    private final TicketAggregateRepositoryInterface ticketRepository;
    private final AutomationConditionEvaluator conditionEvaluator;
    private final AutomationActionExecutor actionExecutor;
    private final Executor automationEngineExecutor;

    public AutomationRuleEngine(
        AutomationEngineRuleRepositoryInterface ruleRepository,
        AutomationRuleExecutionRepositoryInterface executionRepository,
        TicketAggregateRepositoryInterface ticketRepository,
        AutomationConditionEvaluator conditionEvaluator,
        AutomationActionExecutor actionExecutor,
        @Qualifier("automationEngineExecutor") Executor automationEngineExecutor
    ) {
        this.ruleRepository = ruleRepository;
        this.executionRepository = executionRepository;
        this.ticketRepository = ticketRepository;
        this.conditionEvaluator = conditionEvaluator;
        this.actionExecutor = actionExecutor;
        this.automationEngineExecutor = automationEngineExecutor;
    }

    public void onTicketCreated(TicketSnapshot ticket) {
        handleTrigger(new TriggerContext(TriggerType.TICKET_CREATED, ticket.projectId(), ticket.id().value(), null, null));
    }

    public void onTicketStatusChanged(TicketSnapshot ticket) {
        handleTrigger(new TriggerContext(TriggerType.TICKET_STATUS_CHANGED, ticket.projectId(), ticket.id().value(), ticket.statusId(), null));
    }

    public void onTicketFieldChanged(TicketSnapshot ticket, String fieldId) {
        handleTrigger(new TriggerContext(TriggerType.TICKET_FIELD_CHANGED, ticket.projectId(), ticket.id().value(), null, fieldId));
    }

    public void onCommentAdded(TicketSnapshot ticket) {
        handleTrigger(new TriggerContext(TriggerType.COMMENT_ADDED, ticket.projectId(), ticket.id().value(), null, null));
    }

    // Git/VCS triggers - the referenced ticket id is resolved upstream (DevelopmentActivityLinker),
    // so unlike the ticket-mutation entry points these take a bare projectId/ticketId pair. Their
    // trigger params are always {} (see triggerParamsMatch).
    public void onCommitPushed(UUID projectId, UUID ticketId) {
        handleTrigger(new TriggerContext(TriggerType.COMMIT_PUSHED, projectId, ticketId, null, null));
    }

    public void onBranchCreated(UUID projectId, UUID ticketId) {
        handleTrigger(new TriggerContext(TriggerType.BRANCH_CREATED, projectId, ticketId, null, null));
    }

    public void onPullRequestOpened(UUID projectId, UUID ticketId) {
        handleTrigger(new TriggerContext(TriggerType.PULL_REQUEST_OPENED, projectId, ticketId, null, null));
    }

    public void onPullRequestMerged(UUID projectId, UUID ticketId) {
        handleTrigger(new TriggerContext(TriggerType.PULL_REQUEST_MERGED, projectId, ticketId, null, null));
    }

    public void onPullRequestDeclined(UUID projectId, UUID ticketId) {
        handleTrigger(new TriggerContext(TriggerType.PULL_REQUEST_DECLINED, projectId, ticketId, null, null));
    }

    private void handleTrigger(TriggerContext context) {
        if (AutomationExecutionContext.isActive()) {
            // Recursive re-trigger from within automation's own action execution, still on the
            // same thread - process inline, don't hop to the executor (would move to a different
            // pooled thread and break depth tracking) and don't re-establish the system security
            // context (the outer call's is still in effect on this thread).
            process(context);
            return;
        }

        this.automationEngineExecutor.execute(() -> {
            AutomationExecutionContext.enter();
            try {
                AutomationSecurityContext.runAsSystem(() -> process(context));
            } finally {
                AutomationExecutionContext.clear();
            }
        });
    }

    private void process(TriggerContext context) {
        List<AutomationEngineRuleAggregate> rules = this.ruleRepository.findAllEnabledByProjectIdAndTriggerType(context.projectId(), context.type());

        for (AutomationEngineRuleAggregate rule : rules) {
            AutomationEngineRuleSnapshot snapshot = rule.toSnapshot();

            if (!triggerParamsMatch(snapshot.trigger(), context)) {
                continue;
            }

            evaluateAndExecute(snapshot, context);
        }
    }

    private boolean triggerParamsMatch(AutomationTrigger trigger, TriggerContext context) {
        return switch (trigger.type()) {
            // Absent param = "any" - see AutomationTrigger's javadoc.
            case TICKET_STATUS_CHANGED -> {
                String toStatusId = trigger.params().get("toStatusId");
                yield isBlank(toStatusId) || toStatusId.equals(idOrNull(context.statusId()));
            }
            case TICKET_FIELD_CHANGED -> {
                String fieldId = trigger.params().get("fieldId");
                yield isBlank(fieldId) || fieldId.equals(context.fieldId());
            }
            case TICKET_CREATED, COMMENT_ADDED,
                 COMMIT_PUSHED, BRANCH_CREATED,
                 PULL_REQUEST_OPENED, PULL_REQUEST_MERGED, PULL_REQUEST_DECLINED -> true;
        };
    }

    private void evaluateAndExecute(AutomationEngineRuleSnapshot rule, TriggerContext context) {
        int depth = AutomationExecutionContext.currentDepth();

        if (depth >= MAX_DEPTH) {
            recordExecution(rule, context, ExecutionStatus.MAX_DEPTH_EXCEEDED, List.of(), null, depth);
            return;
        }

        TicketSnapshot ticket;
        try {
            ticket = loadTicket(context.ticketId());
        } catch (Exception exception) {
            recordExecution(rule, context, ExecutionStatus.FAILED, List.of(), exception.getMessage(), depth);
            return;
        }

        boolean matches;
        try {
            matches = this.conditionEvaluator.matches(rule.conditions(), ticket);
        } catch (Exception exception) {
            recordExecution(rule, context, ExecutionStatus.FAILED, List.of(), exception.getMessage(), depth);
            return;
        }

        if (!matches) {
            recordExecution(rule, context, ExecutionStatus.SKIPPED, List.of(), null, depth);
            return;
        }

        List<ExecutedActionResult> results = AutomationExecutionContext.runAtIncrementedDepth(
            () -> runActions(rule, context)
        );

        recordExecution(rule, context, ExecutionStatus.MATCHED, results, null, depth);
    }

    private List<ExecutedActionResult> runActions(AutomationEngineRuleSnapshot rule, TriggerContext context) {
        List<ExecutedActionResult> results = new ArrayList<>(rule.actions().size());

        for (AutomationAction action : rule.actions()) {
            try {
                this.actionExecutor.execute(action, context.projectId(), context.ticketId());
                results.add(new ExecutedActionResult(action.id(), action.type(), true, null));
            } catch (Exception exception) {
                results.add(new ExecutedActionResult(action.id(), action.type(), false, exception.getMessage()));
            }
        }

        return results;
    }

    private TicketSnapshot loadTicket(UUID ticketId) {
        return this.ticketRepository.findById(new TicketId(ticketId))
            .orElseThrow(() -> new IllegalStateException("Ticket " + ticketId + " not found"))
            .toSnapshot();
    }

    // A failure to WRITE the execution log must not crash rule processing itself - best-effort,
    // logged rather than propagated.
    private void recordExecution(
        AutomationEngineRuleSnapshot rule,
        TriggerContext context,
        ExecutionStatus status,
        List<ExecutedActionResult> executedActions,
        String errorMessage,
        int depth
    ) {
        try {
            this.executionRepository.save(AutomationRuleExecutionAggregate.newEntry(
                UUID.randomUUID(),
                rule.id().value(),
                context.projectId(),
                context.ticketId(),
                context.type(),
                status,
                executedActions,
                errorMessage,
                depth,
                Instant.now()
            ));
        } catch (Exception exception) {
            log.error("Failed to record automation rule execution for rule {}", rule.id().value(), exception);
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private String idOrNull(UUID id) {
        return id == null ? null : id.toString();
    }

    private record TriggerContext(TriggerType type, UUID projectId, UUID ticketId, UUID statusId, String fieldId) {
    }
}
