-- Per-issue-type title/description templates, used by the frontend to pre-fill a new ticket's
-- title/description when its issue type is selected - plain nullable text, no placeholder syntax
-- enforced/parsed server-side (same "opaque to the backend" stance as ticket.description itself).
ALTER TABLE project_issue_types ADD COLUMN title_template text;
ALTER TABLE project_issue_types ADD COLUMN description_template text;
