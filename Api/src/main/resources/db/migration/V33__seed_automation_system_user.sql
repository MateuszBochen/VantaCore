-- The automation engine acts as this user (ticket history "changed by", comment authorship, etc.)
-- when a rule's action mutates something - see AutomationSystemUser/AutomationSecurityContext.
-- Fixed, well-known id so Java code can reference it as a constant rather than looking it up by
-- email. The password hash is intentionally not a valid bcrypt hash - this account can never
-- authenticate via the normal login flow (BCryptPasswordEncoder.matches() just returns false
-- against a malformed hash rather than throwing), it only needs to exist as a real users row so
-- UserAggregateRepositoryInterface.findById(...) succeeds when handlers look up "the current user".
INSERT INTO users (id, email, first_name, last_name, password, avatar_url)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'automation-engine@system.internal',
    'Automation',
    'Engine',
    '!automation-system-user-cannot-log-in!',
    NULL
);
