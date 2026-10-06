-- Hibernate persists an indexed bidirectional one-to-many (BoardEntity.columns / ColumnEntity.board)
-- in two steps: INSERT the child row first (board_id set, column_order not yet known), then UPDATE it
-- with the position once the collection is flushed. column_order must allow NULL for that brief window
-- even though it's always populated by the time the transaction commits.
ALTER TABLE board_columns ALTER COLUMN column_order DROP NOT NULL;
