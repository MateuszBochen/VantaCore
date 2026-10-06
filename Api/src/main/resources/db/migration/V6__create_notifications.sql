CREATE TABLE notifications (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    type character varying(255) NOT NULL,
    payload jsonb NOT NULL DEFAULT '{}'::jsonb,
    read boolean NOT NULL DEFAULT false,
    created_at timestamp(6) with time zone NOT NULL
);

ALTER TABLE ONLY notifications ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);
ALTER TABLE ONLY notifications ADD CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id);

-- backs "list my notifications, newest first"
CREATE INDEX idx_notifications_user_id_created_at ON notifications (user_id, created_at DESC);
