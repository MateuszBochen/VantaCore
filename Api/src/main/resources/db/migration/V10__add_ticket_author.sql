-- Nullable: existing tickets predate this column and we have no data to backfill who created them.
-- New tickets always get it set from the authenticated user at creation time.
ALTER TABLE tickets ADD COLUMN author_id uuid;
ALTER TABLE ONLY tickets ADD CONSTRAINT fk_tickets_author FOREIGN KEY (author_id) REFERENCES users(id);
