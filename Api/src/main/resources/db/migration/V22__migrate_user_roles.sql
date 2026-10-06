CREATE TABLE user_role_assignments (
    user_id uuid NOT NULL,
    role_id uuid NOT NULL,
    PRIMARY KEY (user_id, role_id)
);
ALTER TABLE ONLY user_role_assignments ADD CONSTRAINT fk_user_role_assignments_user FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE ONLY user_role_assignments ADD CONSTRAINT fk_user_role_assignments_role FOREIGN KEY (role_id) REFERENCES roles(id);

-- Carry every existing ADMIN over to the seeded system role. The old ADMIN/USER enum is gone -
-- USER was never backed by real permissions (no create-regular-user flow existed before this
-- migration), so rows with role = 'USER' are dropped along with the table, not migrated.
INSERT INTO user_role_assignments (user_id, role_id)
SELECT user_id, '00000000-0000-0000-0000-000000000001'
FROM user_roles
WHERE role = 'ADMIN';

DROP TABLE user_roles;
