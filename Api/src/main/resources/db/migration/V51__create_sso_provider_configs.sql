-- One row per configured SSO provider (MICROSOFT/GOOGLE/GITHUB/OIDC) - the provider itself is the
-- key, a provider nobody has saved yet simply has no row (GET /api/settings/sso still reports it,
-- as not configured). encrypted_client_secret is CredentialEncryptor output (AES-GCM, base64),
-- NULL until a secret has been set.
CREATE TABLE sso_provider_configs (
    provider character varying(20) NOT NULL,
    enabled boolean NOT NULL DEFAULT false,
    client_id character varying(255),
    encrypted_client_secret text,
    tenant_id character varying(255),
    issuer_url character varying(2048),
    display_name character varying(255),
    auto_provision_users boolean NOT NULL DEFAULT false,
    updated_at timestamp(6) with time zone,
    CONSTRAINT sso_provider_configs_pkey PRIMARY KEY (provider)
);
