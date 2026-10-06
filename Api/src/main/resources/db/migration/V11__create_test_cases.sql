CREATE TABLE test_cases (
    id uuid NOT NULL,
    ticket_id uuid NOT NULL,
    author_id uuid NOT NULL,
    title character varying(255),
    expected_result text,
    -- No CHECK constraint (unlike the CustomFieldType incident) - Hibernate is ddl-auto:validate now,
    -- so it never generates one from @Enumerated either; adding new TestCaseStatus values later just
    -- needs the Java enum updated, no migration required.
    status character varying(255) NOT NULL,
    created_at timestamp(6) with time zone NOT NULL
);

ALTER TABLE ONLY test_cases ADD CONSTRAINT test_cases_pkey PRIMARY KEY (id);
ALTER TABLE ONLY test_cases ADD CONSTRAINT fk_test_cases_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id);
ALTER TABLE ONLY test_cases ADD CONSTRAINT fk_test_cases_author FOREIGN KEY (author_id) REFERENCES users(id);

CREATE INDEX idx_test_cases_ticket_id ON test_cases (ticket_id);

CREATE TABLE test_case_steps (
    test_case_id uuid NOT NULL,
    step character varying(1000),
    step_order integer NOT NULL
);

ALTER TABLE ONLY test_case_steps ADD CONSTRAINT fk_test_case_steps_test_case FOREIGN KEY (test_case_id) REFERENCES test_cases(id);
