-- Roadmap turned out not to need its own write model at all - it's just a cross-project read view
-- over the existing Version Tracker (releases + their assigned tickets), not a separate set of
-- planned ticket placements. V45's table is dropped rather than that migration being rewritten -
-- some environments may already have applied it, and rewriting/deleting an already-applied
-- migration breaks Flyway checksum validation (see the V42 incident).
DROP TABLE IF EXISTS roadmap_entries;
