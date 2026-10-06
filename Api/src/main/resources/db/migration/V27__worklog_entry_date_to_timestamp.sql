-- entry_date was date-only; existing rows have no time component, so casting to timestamp
-- naturally lands them at 00:00:00, matching how the API now reports entries with no known time.
ALTER TABLE worklog_entries ALTER COLUMN entry_date TYPE timestamp USING entry_date::timestamp;
