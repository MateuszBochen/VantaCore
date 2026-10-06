CREATE TABLE roles (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    is_system boolean NOT NULL DEFAULT false
);

ALTER TABLE ONLY roles ADD CONSTRAINT roles_pkey PRIMARY KEY (id);
ALTER TABLE ONLY roles ADD CONSTRAINT roles_name_key UNIQUE (name);

-- No CHECK constraint on resource - same reasoning as V19's sprints.status: the Resource enum
-- gains new values over time and Hibernate never updates a hand-written CHECK to match (see
-- V2__fix_custom_field_type_check_constraint.sql for the original incident).
CREATE TABLE role_resources (
    role_id uuid NOT NULL,
    resource character varying(255) NOT NULL,
    PRIMARY KEY (role_id, resource)
);
ALTER TABLE ONLY role_resources ADD CONSTRAINT fk_role_resources_role FOREIGN KEY (role_id) REFERENCES roles(id);

-- Seed the one built-in system role with a fixed id so application code
-- (RoleAggregateRepositoryInterface.findSystemRole()) can rely on it always existing, and so
-- V22's migration of existing ADMIN users can reference it deterministically.
INSERT INTO roles (id, name, is_system)
VALUES ('00000000-0000-0000-0000-000000000001', 'Administrator', true);
