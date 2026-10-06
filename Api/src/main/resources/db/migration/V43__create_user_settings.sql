-- GET/PUT /api/user-settings - one opaque JSON blob per user (pageTheme, ticketLayout, and
-- whatever future keys the frontend adds), self-scoped via the caller's own JWT. PUT is always a
-- full overwrite (see UserSettingsAggregate) - the frontend itself is responsible for merging its
-- one changed key against the latest known blob before saving, the backend has no opinion on what
-- keys exist or their shape (deliberately not validated/typed here, same reasoning as
-- customFields on a ticket).
CREATE TABLE user_settings (
    user_id uuid NOT NULL,
    settings jsonb NOT NULL DEFAULT '{}',
    updated_at timestamp(6) with time zone NOT NULL
);

ALTER TABLE ONLY user_settings ADD CONSTRAINT user_settings_pkey PRIMARY KEY (user_id);
ALTER TABLE ONLY user_settings ADD CONSTRAINT fk_user_settings_user FOREIGN KEY (user_id) REFERENCES users(id);
