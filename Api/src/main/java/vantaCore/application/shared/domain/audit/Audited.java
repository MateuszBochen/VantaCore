package vantaCore.application.shared.domain.audit;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Declares which {@link AuditResourceType} this command mutates, so AuditLoggingMiddleware can
 * capture a before/after diff around it automatically - no explicit logging call needed in the
 * handler (see the "Audit capture via a cross-cutting interceptor" ADR on the Audit Log sub-project).
 * Only takes effect when the command also implements {@link AuditableCommand}; read by
 * AuditLoggingMiddleware the same way RequiresResource is read by ResourceAuthorizationMiddleware.
 */
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
public @interface Audited {
    AuditResourceType value();
}
