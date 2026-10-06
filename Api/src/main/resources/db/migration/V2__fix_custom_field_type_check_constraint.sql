-- Hibernate generated this CHECK constraint when the table was first created (ddl-auto: update),
-- listing only the CustomFieldType enum constants that existed at that time. It never gets rewritten
-- by ddl-auto: update when new enum constants (TIME, DATETIME) are added later, so it must be fixed here.
ALTER TABLE project_custom_field_definitions
    DROP CONSTRAINT project_custom_field_definitions_type_check;

ALTER TABLE project_custom_field_definitions
    ADD CONSTRAINT project_custom_field_definitions_type_check
    CHECK (type IN ('SELECT', 'TEXT', 'NUMBER', 'DATE', 'TIME', 'DATETIME', 'CHECKBOX', 'USER'));