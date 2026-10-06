package vantaCore.application.auditLog.infrastructure.middleware;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import vantaCore.application.auditLog.domain.AuditAction;
import vantaCore.application.auditLog.domain.AuditLogEntry;
import vantaCore.application.auditLog.domain.AuditLogEntry.FieldDiff;
import vantaCore.application.auditLog.domain.repository.AuditLogEntryRepositoryInterface;
import vantaCore.application.messageBus.Envelope;
import vantaCore.application.messageBus.middleware.middlewareStack.MiddlewareStackInterface;
import vantaCore.application.shared.domain.audit.AuditResourceType;
import vantaCore.application.shared.domain.audit.AuditSnapshotProviderInterface;
import vantaCore.application.shared.domain.audit.Audited;
import vantaCore.application.shared.domain.audit.AuditableCommand;
import vantaCore.application.shared.domain.bus.middleware.CommandMiddlewareInterface;
import vantaCore.application.user.domain.UserAggregate;
import vantaCore.application.user.domain.repository.UserAggregateRepositoryInterface;
import vantaCore.application.user.domain.vo.UserId;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

/** Cross-cutting capture point for every @Audited command, wrapping the command bus rather than
 requiring an explicit logging call per handler - see the "Audit capture via a cross-cutting
 interceptor" ADR on the Audit Log sub-project for why. Runs regardless of its position relative to
 ValidationMiddleware/ResourceAuthorizationMiddleware in the injected middleware list: an audit entry
 is only ever persisted after stack.next() returns without throwing, which only happens once the
 whole downstream chain - including the actual handler, since HandlerMiddleware is always last -
 completed successfully. Deliberately best-effort: a bug in snapshot loading/diffing/persisting must
 never fail the real mutation it's observing, so everything after the "before" snapshot is wrapped
 and only logged on failure. */
@Service
public class AuditLoggingMiddleware implements CommandMiddlewareInterface {

    private static final Logger log = LoggerFactory.getLogger(AuditLoggingMiddleware.class);

    private final Map<AuditResourceType, AuditSnapshotProviderInterface> providers;
    private final AuditLogEntryRepositoryInterface repository;
    private final UserAggregateRepositoryInterface userRepository;

    public AuditLoggingMiddleware(
        List<AuditSnapshotProviderInterface> providers,
        AuditLogEntryRepositoryInterface repository,
        UserAggregateRepositoryInterface userRepository
    ) {
        this.providers = new HashMap<>();
        for (AuditSnapshotProviderInterface provider : providers) {
            this.providers.put(provider.resourceType(), provider);
        }
        this.repository = repository;
        this.userRepository = userRepository;
    }

    @Override
    public Envelope<Object, Object> handle(Envelope<Object, Object> envelope, MiddlewareStackInterface stack) throws Exception {
        Object message = envelope.getMessage();
        Audited annotation = message.getClass().getAnnotation(Audited.class);

        if (annotation == null || !(message instanceof AuditableCommand auditable)) {
            return stack.next(envelope);
        }

        AuditResourceType resourceType = annotation.value();
        AuditSnapshotProviderInterface provider = this.providers.get(resourceType);
        UUID resourceId = auditable.getAuditResourceId();
        UUID projectId = auditable.getAuditProjectId();

        if (provider == null || resourceId == null || projectId == null) {
            return stack.next(envelope);
        }

        Map<String, Object> before = loadSnapshotSafely(provider, projectId, resourceId);

        Envelope<Object, Object> result = stack.next(envelope);

        try {
            Map<String, Object> after = loadSnapshotSafely(provider, projectId, resourceId);
            recordEntry(resourceType, projectId, resourceId, before, after);
        } catch (RuntimeException exception) {
            log.error("Failed to record audit log entry for {} {}", resourceType, resourceId, exception);
        }

        return result;
    }

    private Map<String, Object> loadSnapshotSafely(AuditSnapshotProviderInterface provider, UUID projectId, UUID resourceId) {
        try {
            return provider.loadSnapshot(projectId, resourceId).orElse(null);
        } catch (RuntimeException exception) {
            log.error("Failed to load audit snapshot for {} {}", provider.resourceType(), resourceId, exception);
            return null;
        }
    }

    private void recordEntry(
        AuditResourceType resourceType,
        UUID projectId,
        UUID resourceId,
        Map<String, Object> before,
        Map<String, Object> after
    ) {
        AuditAction action;
        Map<String, FieldDiff> diff;

        if (before == null && after != null) {
            action = AuditAction.CREATE;
            diff = toFieldDiffs(after, true);
        } else if (before != null && after == null) {
            action = AuditAction.DELETE;
            diff = toFieldDiffs(before, false);
        } else if (before != null) {
            diff = diffFields(before, after);
            if (diff.isEmpty()) {
                return;
            }
            action = AuditAction.UPDATE;
        } else {
            return;
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UUID actorId = resolveActorId(authentication);
        String actorEmail = resolveActorEmail(actorId);

        this.repository.save(new AuditLogEntry(
            UUID.randomUUID(), projectId, resourceType, resourceId, action, actorId, actorEmail, Instant.now(), diff
        ));
    }

    private Map<String, FieldDiff> toFieldDiffs(Map<String, Object> fields, boolean isAfter) {
        Map<String, FieldDiff> diffs = new HashMap<>();
        fields.forEach((key, value) -> diffs.put(key, isAfter ? new FieldDiff(null, value) : new FieldDiff(value, null)));
        return diffs;
    }

    private Map<String, FieldDiff> diffFields(Map<String, Object> before, Map<String, Object> after) {
        Map<String, FieldDiff> diffs = new HashMap<>();

        for (String key : after.keySet()) {
            Object beforeValue = before.get(key);
            Object afterValue = after.get(key);
            if (!Objects.equals(beforeValue, afterValue)) {
                diffs.put(key, new FieldDiff(beforeValue, afterValue));
            }
        }

        return diffs;
    }

    private UUID resolveActorId(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return null;
        }

        try {
            return UUID.fromString(authentication.getName());
        } catch (IllegalArgumentException exception) {
            return null;
        }
    }

    private String resolveActorEmail(UUID actorId) {
        if (actorId == null) {
            return null;
        }

        return Optional.ofNullable(this.userRepository.findById(new UserId(actorId)))
            .map(UserAggregate::getCredentials)
            .map(credentials -> credentials.email().value())
            .orElse(null);
    }
}
