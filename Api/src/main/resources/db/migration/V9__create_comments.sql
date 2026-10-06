CREATE TABLE comments (
    id uuid NOT NULL,
    ticket_id uuid NOT NULL,
    author_id uuid NOT NULL,
    body text NOT NULL,
    created_at timestamp(6) with time zone NOT NULL,
    changed_at timestamp(6) with time zone NOT NULL
);

ALTER TABLE ONLY comments ADD CONSTRAINT comments_pkey PRIMARY KEY (id);
ALTER TABLE ONLY comments ADD CONSTRAINT fk_comments_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id);
ALTER TABLE ONLY comments ADD CONSTRAINT fk_comments_author FOREIGN KEY (author_id) REFERENCES users(id);

CREATE INDEX idx_comments_ticket_id ON comments (ticket_id);
