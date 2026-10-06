package vantaCore.application.shared.domain.accessControl;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Declares the {@link Resource} the current user must have been granted (through any of
 * their roles) to dispatch this command/query. Read by ResourceAuthorizationMiddleware.
 * Messages without this annotation are not checked.
 */
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
public @interface RequiresResource {
    Resource value();
}
