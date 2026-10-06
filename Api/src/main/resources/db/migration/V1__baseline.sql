-- Baseline schema, snapshotted from the dev DB as it stood after being schema-managed by
-- Hibernate ddl-auto:update (pre-Flyway). Only runs on a genuinely empty database (fresh install);
-- any DB that already has these tables gets baselined at this version instead (see
-- spring.flyway.baseline-version in application.yml) and skips straight to V2+.

CREATE TABLE platform_documentation_versions (
    version_id uuid NOT NULL,
    api text,
    architecture_overview text,
    changed_at timestamp(6) with time zone,
    changed_by_email character varying(255),
    changed_by_user_id uuid,
    graph jsonb NOT NULL,
    project_id uuid
);

CREATE TABLE platform_documentations (
    project_id uuid NOT NULL,
    api text,
    architecture_overview text,
    graph jsonb NOT NULL
);

CREATE TABLE project_automation_rules (
    id uuid NOT NULL,
    parent_type_id uuid,
    set_parent_status_id uuid,
    project_id uuid
);

CREATE TABLE project_custom_field_definitions (
    id uuid NOT NULL,
    name character varying(255),
    type character varying(255),
    project_id uuid,
    CONSTRAINT project_custom_field_definitions_type_check CHECK (((type)::text = ANY ((ARRAY['SELECT'::character varying, 'TEXT'::character varying, 'NUMBER'::character varying, 'DATE'::character varying, 'TIME'::character varying, 'DATETIME'::character varying, 'CHECKBOX'::character varying, 'USER'::character varying])::text[])))
);

CREATE TABLE project_custom_field_options (
    custom_field_definition_id uuid NOT NULL,
    option_value character varying(255),
    option_order integer NOT NULL
);

CREATE TABLE project_flags (
    id uuid NOT NULL,
    color character varying(255),
    name character varying(255),
    project_id uuid
);

CREATE TABLE project_issue_type_child_types (
    issue_type_id uuid NOT NULL,
    child_type_id uuid
);

CREATE TABLE project_issue_type_statuses (
    id uuid NOT NULL,
    color character varying(255),
    is_done boolean NOT NULL,
    name character varying(255),
    issue_type_id uuid
);

CREATE TABLE project_issue_types (
    id uuid NOT NULL,
    color character varying(255),
    estimable boolean NOT NULL,
    initial_status_id uuid,
    name character varying(255),
    project_id uuid
);

CREATE TABLE project_status_transitions (
    status_id uuid NOT NULL,
    target_status_id uuid
);

CREATE TABLE projects (
    id uuid NOT NULL,
    name character varying(255),
    prefix character varying(255),
    starting_number integer
);

CREATE TABLE sub_project_versions (
    version_id uuid NOT NULL,
    adrs jsonb NOT NULL,
    changed_at timestamp(6) with time zone,
    changed_by_email character varying(255),
    changed_by_user_id uuid,
    impact_analysis text,
    name character varying(255),
    project_id uuid,
    scope text,
    solution_design text,
    status character varying(255),
    sub_project_id uuid,
    CONSTRAINT sub_project_versions_status_check CHECK (((status)::text = ANY ((ARRAY['NOT_DEPLOYED'::character varying, 'DEPLOYED'::character varying])::text[])))
);

CREATE TABLE user_roles (
    user_id uuid NOT NULL,
    role character varying(255),
    CONSTRAINT user_roles_role_check CHECK (((role)::text = ANY ((ARRAY['ADMIN'::character varying, 'USER'::character varying])::text[])))
);

CREATE TABLE users (
    id uuid NOT NULL,
    email character varying(255) NOT NULL,
    first_name character varying(255) NOT NULL,
    last_name character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    avatar_url character varying(255)
);

ALTER TABLE ONLY platform_documentation_versions
    ADD CONSTRAINT platform_documentation_versions_pkey PRIMARY KEY (version_id);

ALTER TABLE ONLY platform_documentations
    ADD CONSTRAINT platform_documentations_pkey PRIMARY KEY (project_id);

ALTER TABLE ONLY project_automation_rules
    ADD CONSTRAINT project_automation_rules_pkey PRIMARY KEY (id);

ALTER TABLE ONLY project_custom_field_definitions
    ADD CONSTRAINT project_custom_field_definitions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY project_custom_field_options
    ADD CONSTRAINT project_custom_field_options_pkey PRIMARY KEY (custom_field_definition_id, option_order);

ALTER TABLE ONLY project_flags
    ADD CONSTRAINT project_flags_pkey PRIMARY KEY (id);

ALTER TABLE ONLY project_issue_type_statuses
    ADD CONSTRAINT project_issue_type_statuses_pkey PRIMARY KEY (id);

ALTER TABLE ONLY project_issue_types
    ADD CONSTRAINT project_issue_types_pkey PRIMARY KEY (id);

ALTER TABLE ONLY projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);

ALTER TABLE ONLY sub_project_versions
    ADD CONSTRAINT sub_project_versions_pkey PRIMARY KEY (version_id);

ALTER TABLE ONLY users
    ADD CONSTRAINT uk6dotkott2kjsp8vw4d0m25fb7 UNIQUE (email);

ALTER TABLE ONLY users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);

ALTER TABLE ONLY project_custom_field_definitions
    ADD CONSTRAINT fk3tge5wug4y53mwo30doy15ktq FOREIGN KEY (project_id) REFERENCES projects(id);

ALTER TABLE ONLY project_status_transitions
    ADD CONSTRAINT fk6an170u95b8wf3xyi2j6995uj FOREIGN KEY (status_id) REFERENCES project_issue_type_statuses(id);

ALTER TABLE ONLY project_issue_types
    ADD CONSTRAINT fke9iw48g2mn43csuwytexpdacj FOREIGN KEY (project_id) REFERENCES projects(id);

ALTER TABLE ONLY project_custom_field_options
    ADD CONSTRAINT fkelo9mih08y33a605htt67249j FOREIGN KEY (custom_field_definition_id) REFERENCES project_custom_field_definitions(id);

ALTER TABLE ONLY user_roles
    ADD CONSTRAINT fkhfh9dx7w3ubf1co1vdev94g3f FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE ONLY project_flags
    ADD CONSTRAINT fkhlft4iijfxcx63y5ichqf9k2g FOREIGN KEY (project_id) REFERENCES projects(id);

ALTER TABLE ONLY project_issue_type_statuses
    ADD CONSTRAINT fkht1vhdumiqjp4t3nx146pu8xb FOREIGN KEY (issue_type_id) REFERENCES project_issue_types(id);

ALTER TABLE ONLY project_automation_rules
    ADD CONSTRAINT fkojg2oiyb17enqh86rfgpas9gq FOREIGN KEY (project_id) REFERENCES projects(id);

ALTER TABLE ONLY project_issue_type_child_types
    ADD CONSTRAINT fks26ungrlr6w2rh9jmjnkjwpwb FOREIGN KEY (issue_type_id) REFERENCES project_issue_types(id);