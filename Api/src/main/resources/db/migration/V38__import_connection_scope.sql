-- The frontend's connection form actually collects two more fields than the original contract had:
-- sourceProject (scopes Jira JQL / Azure DevOps WIQL to one project instead of the whole instance -
-- resolves the "no project scoping" gap noted when this feature was first built) and email (Jira
-- Cloud's REST API authenticates with Basic email:apiToken, not a bearer PAT - this feature was
-- originally built against Jira Server/Data Center's bearer-PAT scheme, which doesn't apply to Cloud).
ALTER TABLE import_connections ADD COLUMN source_project character varying(255);
ALTER TABLE import_connections ADD COLUMN email character varying(255);
