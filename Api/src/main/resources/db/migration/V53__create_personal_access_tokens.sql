-- Personal access tokens (Authorization: Bearer vc_pat_...) - long-lived credentials for non-browser
-- clients such as MCP clients. Only a SHA-256 hash of the token is stored (token_hash, looked up on
-- every token-authenticated request - hence the unique index); token_prefix is the first few
-- characters, kept only so a user can tell their tokens apart. resources: JSON array of resource
-- codes the token is narrowed to - empty = everything its user can do.
CREATE TABLE personal_access_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    token_hash character varying(64) NOT NULL,
    token_prefix character varying(16) NOT NULL,
    resources jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at timestamp(6) with time zone NOT NULL,
    expires_at timestamp(6) with time zone,
    last_used_at timestamp(6) with time zone,
    CONSTRAINT personal_access_tokens_pkey PRIMARY KEY (id),
    CONSTRAINT fk_personal_access_tokens_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE UNIQUE INDEX idx_personal_access_tokens_token_hash ON personal_access_tokens (token_hash);
CREATE INDEX idx_personal_access_tokens_user_id ON personal_access_tokens (user_id);
