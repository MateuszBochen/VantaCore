package vantaCore.application.importExport.infrastructure.security;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import vantaCore.application.shared.domain.accessControl.Resource;

import java.util.List;
import java.util.UUID;

/** Establishes an authenticated identity for the import job's own worker thread, same reasoning as
 AutomationSecurityContext but parameterized by the REAL user who started the job (captured on the
 request thread by StartImportCommandHandler before dispatch) rather than a fixed system user - an
 imported ticket's authorId/an imported attachment's uploadedByUserId should read as "created by
 whoever ran the import", not a synthetic identity. Grants only what the job's own command
 dispatches need (UpsertTicketCommand, UploadTicketAttachmentCommand both require TICKET_MANAGE) -
 least privilege, same as AutomationSecurityContext, not a replay of the user's full original grant
 set. COMMENT_CREATE was added alongside TICKET_MANAGE once imported comments (AddCommentCommand)
 became part of what a job dispatches - same "created by whoever ran the import" attribution as
 everything else here, see ImportSourceComment. */
public final class ImportJobSecurityContext {

    private static final List<GrantedAuthority> AUTHORITIES = List.of(
        new SimpleGrantedAuthority("RESOURCE_" + Resource.TICKET_MANAGE.getCode()),
        new SimpleGrantedAuthority("RESOURCE_" + Resource.COMMENT_CREATE.getCode())
    );

    private ImportJobSecurityContext() {
    }

    public static void runAs(UUID userId, Runnable action) {
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(new UsernamePasswordAuthenticationToken(userId.toString(), null, AUTHORITIES));

        SecurityContextHolder.setContext(context);
        try {
            action.run();
        } finally {
            SecurityContextHolder.clearContext();
        }
    }
}
