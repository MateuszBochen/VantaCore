CREATE TABLE files (
    id uuid NOT NULL,
    original_filename character varying(255) NOT NULL,
    content_type character varying(255),
    size_bytes bigint NOT NULL,
    storage_key character varying(255) NOT NULL,
    -- No CHECK constraint on owner_type - same lesson as sprints.status
    -- (V2__fix_custom_field_type_check_constraint.sql).
    owner_type character varying(255) NOT NULL,
    -- Nullable: EDITOR_IMAGE files have no owner until (if ever) referenced from within some content.
    owner_id uuid,
    uploaded_by_user_id uuid NOT NULL,
    uploaded_at timestamp(6) with time zone NOT NULL
);

ALTER TABLE ONLY files ADD CONSTRAINT files_pkey PRIMARY KEY (id);
ALTER TABLE ONLY files ADD CONSTRAINT fk_files_uploaded_by FOREIGN KEY (uploaded_by_user_id) REFERENCES users(id);

CREATE INDEX idx_files_owner ON files (owner_type, owner_id);
