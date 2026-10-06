-- In-flight SSO logins between GET /web-api/auth/sso/{provider}/authorize and the matching
-- POST .../callback (see SsoLoginState) - a row lives ~10 minutes at most and is deleted the moment
-- its callback consumes it (DELETE ... RETURNING, so a replayed state can never be used twice).
-- Kept in the database rather than in memory so a login survives an API restart and works across
-- several API instances. Expired rows are purged opportunistically on each new authorize.
CREATE TABLE sso_login_states (
    state character varying(128) NOT NULL,
    provider character varying(20) NOT NULL,
    redirect_uri character varying(2048) NOT NULL,
    code_verifier character varying(128) NOT NULL,
    nonce character varying(128) NOT NULL,
    expires_at timestamp(6) with time zone NOT NULL,
    CONSTRAINT sso_login_states_pkey PRIMARY KEY (state)
);

CREATE INDEX idx_sso_login_states_expires_at ON sso_login_states (expires_at);
