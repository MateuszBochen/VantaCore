package vantaCore.application.automationEngine.infrastructure.security;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.util.List;
import java.util.UUID;

/** Establishes a synthetic authenticated identity for the automation engine's own worker thread -
 ResourceAuthorizationMiddleware (like every other part of the app) reads
 SecurityContextHolder.getContext().getAuthentication(), which is thread-bound and empty on a
 background executor thread by default; without this, every @RequiresResource-gated command the
 action executor dispatches (UpsertTicketCommand, AddCommentCommand) would throw ForbiddenException,
 and CurrentUserProviderInterface.getCurrentUserId() (used for ticket-history "changed by",
 comment authorship, ...) would throw AuthenticationFailedException.

 Grants only the specific resources the action executor actually needs (least privilege), not every
 resource - see AutomationActionExecutor for the exact commands dispatched. SYSTEM_USER_ID must
 match the row seeded by V33__seed_automation_system_user.sql. */
public final class AutomationSecurityContext {

    public static final UUID SYSTEM_USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    private static final List<GrantedAuthority> AUTHORITIES = List.of(
        new SimpleGrantedAuthority("RESOURCE_" + Resource.TICKET_MANAGE.getCode()),
        new SimpleGrantedAuthority("RESOURCE_" + Resource.COMMENT_CREATE.getCode())
    );

    private AutomationSecurityContext() {
    }

    /** Sets up the system SecurityContext for the calling (pooled) thread, runs action, then clears
     it - only call this once per top-level automation task, never from a recursive re-trigger
     already running inside one (see AutomationExecutionContext.isActive()), or the inner clear()
     would tear down the outer call's still-in-use context. */
    public static void runAsSystem(Runnable action) {
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(new UsernamePasswordAuthenticationToken(
            SYSTEM_USER_ID.toString(), null, AUTHORITIES
        ));

        SecurityContextHolder.setContext(context);
        try {
            action.run();
        } finally {
            SecurityContextHolder.clearContext();
        }
    }
}
