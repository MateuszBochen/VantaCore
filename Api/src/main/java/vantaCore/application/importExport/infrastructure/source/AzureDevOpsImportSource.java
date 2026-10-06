package vantaCore.application.importExport.infrastructure.source;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import vantaCore.application.importExport.domain.ImportConnectionSnapshot;
import vantaCore.application.importExport.domain.source.ExternalImportSourceInterface;
import vantaCore.application.importExport.domain.source.ImportLinkType;
import vantaCore.application.importExport.domain.source.ImportPreview;
import vantaCore.application.importExport.domain.source.ImportSourceAttachment;
import vantaCore.application.importExport.domain.source.ImportSourceComment;
import vantaCore.application.importExport.domain.source.ImportSourceLink;
import vantaCore.application.importExport.domain.source.ImportSourcePage;
import vantaCore.application.importExport.domain.source.ImportSourceRecord;
import vantaCore.application.importExport.domain.vo.ImportProvider;
import vantaCore.application.shared.application.dto.Notification;
import vantaCore.application.shared.application.exception.UnprocessableEntityException;

import java.io.IOException;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Azure DevOps REST API (organization-scoped baseUrl, e.g. https://dev.azure.com/{org}), PAT auth
 via HTTP Basic with an empty username - the scheme Azure DevOps' REST API actually requires for a
 PAT (a Bearer header is only valid for OAuth app tokens, not PATs).

 WIQL (`_apis/wit/wiql`) has no server-side cursor of its own - it returns every matching work item
 id in one response (capped at 20000 by the API itself). To keep fetchPage's own paging contract
 (bounded per-call work, matching ExternalImportSourceInterface's memory-safety goal) without a
 second storage mechanism for "the id list so far", the id list is deterministically re-queried
 (ORDER BY [System.Id]) on every call and only the current page's ids are then detail-fetched - a
 handful of extra cheap WIQL calls on a large import, not a per-item cost.

 sourceProject (when set) scopes the WIQL query to one Team Project via `[System.TeamProject] = 'X'`
 - unscoped (whole organization) when absent.

 Source fields are NOT a hand-picked subset - `GET /_apis/wit/fields` (fetchFieldCatalog) supplies
 every field (system + custom process fields) this organization has, and work item detail fetches
 go through `POST /_apis/wit/workitemsbatch` (fetchWorkItems) with no `fields` restriction at all,
 which returns every field a GET-with-explicit-fields-list would also risk exceeding URL length
 limits on for a process template with many custom fields - the batch endpoint sidesteps that
 entirely. A field's referenceName not starting with "System." or "Microsoft.VSTS." is treated as a
 custom process field and its display name gets suffixed with the reference name (e.g. "Story Points
 [Custom.StoryPoints]") for the same reason as JiraImportSource's custom-field suffixing:
 uniqueness isn't guaranteed across a large process template.

 NOTE: unlike JiraImportSource (tested end-to-end against a live Cloud instance), this dynamic-field
 rewrite hasn't been exercised against a real Azure DevOps organization yet - the request/response
 shape of `workitemsbatch` without an explicit `fields` array is based on documented API behavior,
 not a live-verified response. */
@Component
public class AzureDevOpsImportSource implements ExternalImportSourceInterface {

    private static final Logger log = LoggerFactory.getLogger(AzureDevOpsImportSource.class);
    private static final int PAGE_SIZE = 200;
    private static final int PREVIEW_SIZE = 5;
    private static final int MAX_COMMENTS = 100;
    private static final String API_VERSION = "7.0";
    private static final String COMMENTS_API_VERSION = "7.0-preview.3";
    private static final String DESCRIPTION_FIELD_ID = "System.Description";
    private static final String TEAM_PROJECT_FIELD_ID = "System.TeamProject";
    private static final String WORK_ITEM_TYPE_FIELD_ID = "System.WorkItemType";
    private static final String STATE_FIELD_ID = "System.State";
    private static final int MAX_PROJECTS = 500;
    private static final Pattern BLOCK_BREAK = Pattern.compile("(?i)</p>|<br\\s*/?>|</li>|</div>|</h[1-6]>");
    private static final Pattern TAG = Pattern.compile("<[^>]+>");
    private static final Pattern MULTIPLE_BLANK_LINES = Pattern.compile("\\n{3,}");
    private static final Pattern IMG_TAG = Pattern.compile("<img\\b[^>]*>", Pattern.CASE_INSENSITIVE);
    private static final Pattern ATTR_SRC = Pattern.compile("\\bsrc\\s*=\\s*[\"']([^\"']*)[\"']", Pattern.CASE_INSENSITIVE);
    private static final Pattern ATTR_ALT = Pattern.compile("\\balt\\s*=\\s*[\"']([^\"']*)[\"']", Pattern.CASE_INSENSITIVE);
    private static final Pattern ATTACHMENT_GUID = Pattern.compile("/_apis/wit/attachments/([0-9a-fA-F-]{36})", Pattern.CASE_INSENSITIVE);
    private static final Pattern FILE_NAME_PARAM = Pattern.compile("[?&]fileName=([^&#]+)", Pattern.CASE_INSENSITIVE);
    private static final Pattern WORK_ITEM_URL_ID = Pattern.compile("/workItems/(\\d+)$", Pattern.CASE_INSENSITIVE);

    // Work item relation "rel" names -> link kind, from the owning work item's side. Only the
    // "-Reverse" end of the hierarchy (= "my parent") is kept, see ImportLinkType. Dependency links
    // are Predecessor/Successor: Forward points at my successor (I block it), Reverse at my
    // predecessor. Duplicate-Forward is "Duplicate" (the target duplicates me), Reverse is
    // "Duplicate Of". Affects is the CMMI process' own link type. Anything else (Tested By, Child,
    // artifact/hyper links, ...) is ignored.
    private static final Map<String, ImportLinkType> LINK_TYPES = Map.of(
        "System.LinkTypes.Hierarchy-Reverse", ImportLinkType.PARENT,
        "System.LinkTypes.Related", ImportLinkType.RELATES_TO,
        "System.LinkTypes.Dependency-Forward", ImportLinkType.BLOCKS,
        "System.LinkTypes.Dependency-Reverse", ImportLinkType.IS_BLOCKED_BY,
        "System.LinkTypes.Duplicate-Forward", ImportLinkType.IS_DUPLICATED_BY,
        "System.LinkTypes.Duplicate-Reverse", ImportLinkType.DUPLICATES,
        "Microsoft.VSTS.Common.Affects-Forward", ImportLinkType.IMPACTS,
        "Microsoft.VSTS.Common.Affects-Reverse", ImportLinkType.IS_IMPACTED_BY
    );

    @Override
    public ImportProvider provider() {
        return ImportProvider.AZURE_DEVOPS;
    }

    @Override
    public ImportPreview preview(ImportConnectionSnapshot connection) {
        FieldCatalog catalog = fetchFieldCatalog(connection);
        List<Integer> ids = queryIds(connection);
        List<Integer> firstFive = ids.subList(0, Math.min(PREVIEW_SIZE, ids.size()));

        List<Map<String, String>> rows = new ArrayList<>();
        if (!firstFive.isEmpty()) {
            for (JsonNode workItem : fetchWorkItems(connection, firstFive)) {
                rows.add(toFieldMap(workItem, catalog, new InlineImages(connection, toAttachments(workItem))));
            }
        }

        return new ImportPreview(catalog.sourceFieldNames(), rows, fetchKnownValues(connection, catalog));
    }

    @Override
    public ImportSourcePage fetchPage(ImportConnectionSnapshot connection, String pageToken) {
        int offset = pageToken == null ? 0 : Integer.parseInt(pageToken);

        FieldCatalog catalog = fetchFieldCatalog(connection);
        List<Integer> ids = queryIds(connection);
        int end = Math.min(offset + PAGE_SIZE, ids.size());

        if (offset >= ids.size()) {
            return new ImportSourcePage(List.of(), null, ids.size());
        }

        List<Integer> pageIds = ids.subList(offset, end);
        List<ImportSourceRecord> records = new ArrayList<>();

        for (JsonNode workItem : fetchWorkItems(connection, pageIds)) {
            // Description first, then comments - both may append inline images to `attachments`
            // (see InlineImages), so the list is only handed to the record once both are rendered.
            List<ImportSourceAttachment> attachments = toAttachments(workItem);
            InlineImages images = new InlineImages(connection, attachments);
            Map<String, String> fields = toFieldMap(workItem, catalog, images);

            // Best effort: one work item's comments failing (even after retries - see
            // TransientFailureRetryInterceptor) must not abort the whole import job.
            List<String> warnings = new ArrayList<>();
            List<ImportSourceComment> comments;
            try {
                comments = fetchComments(connection, workItem, images);
            } catch (RuntimeException exception) {
                log.warn("Comments of work item {} could not be fetched: {}", workItem.path("id").asText(), exception.getMessage());
                warnings.add("comments not imported: " + shortMessage(exception));
                comments = List.of();
            }

            records.add(new ImportSourceRecord(workItem.path("id").asText(), fields, attachments, comments, toLinks(workItem), warnings));
        }

        String nextPageToken = end < ids.size() ? String.valueOf(end) : null;

        return new ImportSourcePage(records, nextPageToken, ids.size());
    }

    @Override
    public byte[] downloadAttachment(ImportConnectionSnapshot connection, String downloadUrl) {
        // Every request here carries the PAT - never send it anywhere but Azure DevOps itself, even
        // if some URL from a work item's HTML slipped past InlineImages' own check.
        if (!isAzureDevOpsUrl(connection, downloadUrl)) {
            throw new IllegalArgumentException("Refusing to download from a non-Azure DevOps host");
        }

        return client(connection).get()
            .uri(downloadUrl)
            .retrieve()
            .onStatus(status -> status.value() >= 400, (request, response) -> {
                throw connectionFailed(response);
            })
            .body(byte[].class);
    }

    // {referenceName -> display name} for every field (system + custom) this organization's
    // process templates define - work items are keyed by referenceName ("Custom.StoryPoints"), the
    // list endpoint is the only place that maps one to a human name. Re-fetched on every preview/
    // fetchPage call, same reasoning as JiraImportSource.fetchFieldCatalog.
    private FieldCatalog fetchFieldCatalog(ImportConnectionSnapshot connection) {
        JsonNode response = client(connection).get()
            .uri(uriBuilder -> uriBuilder.path("/_apis/wit/fields").queryParam("api-version", API_VERSION).build())
            .retrieve()
            .onStatus(status -> status.value() >= 400, (request, resp) -> {
                throw connectionFailed(resp);
            })
            .body(JsonNode.class);

        Map<String, String> referenceNameToDisplayName = new LinkedHashMap<>();
        for (JsonNode field : response.path("value")) {
            String referenceName = textOrNull(field.path("referenceName"));
            String name = textOrNull(field.path("name"));
            if (referenceName == null || name == null) {
                continue;
            }

            boolean isSystemField = referenceName.startsWith("System.") || referenceName.startsWith("Microsoft.VSTS.");
            referenceNameToDisplayName.put(referenceName, isSystemField ? name : name + " [" + referenceName + "]");
        }

        return new FieldCatalog(referenceNameToDisplayName);
    }

    // Every work item type/state name the import can run into - the preview rows are only the
    // first PREVIEW_SIZE items (ordered by id, so typically all Epics/Features), which is why value
    // mapping can't be built from them alone. Types and their states come from one project-scoped
    // call per Team Project (`{project}/_apis/wit/workitemtypes`, states are inlined per type);
    // an unscoped connection enumerates every project in the organization first. Best effort - a
    // failure here must not break the preview itself, the name fallback in ImportMappingApplier
    // still covers unmapped values.
    // NOTE: same caveat as the class javadoc - not verified against a live organization yet.
    private Map<String, List<String>> fetchKnownValues(ImportConnectionSnapshot connection, FieldCatalog catalog) {
        try {
            List<String> projects = connection.sourceProject() != null ? List.of(connection.sourceProject()) : listProjects(connection);

            Set<String> types = new LinkedHashSet<>();
            Set<String> states = new LinkedHashSet<>();

            for (String project : projects) {
                JsonNode response = client(connection).get()
                    .uri(uriBuilder -> uriBuilder
                        .path("/{project}/_apis/wit/workitemtypes")
                        .queryParam("api-version", API_VERSION)
                        .build(project))
                    .retrieve()
                    .onStatus(status -> status.value() >= 400, (request, resp) -> {
                        throw connectionFailed(resp);
                    })
                    .body(JsonNode.class);

                for (JsonNode type : response.path("value")) {
                    String typeName = textOrNull(type.path("name"));
                    if (typeName == null || type.path("isDisabled").asBoolean(false)) {
                        continue;
                    }
                    types.add(typeName);

                    for (JsonNode state : type.path("states")) {
                        String stateName = textOrNull(state.path("name"));
                        if (stateName != null) {
                            states.add(stateName);
                        }
                    }
                }
            }

            Map<String, List<String>> values = new LinkedHashMap<>();
            values.put(catalog.nameOf(WORK_ITEM_TYPE_FIELD_ID), List.copyOf(types));
            values.put(catalog.nameOf(STATE_FIELD_ID), List.copyOf(states));
            return values;
        } catch (RuntimeException exception) {
            log.warn("Could not enumerate Azure DevOps work item types/states: {}", exception.getMessage());
            return Map.of();
        }
    }

    private List<String> listProjects(ImportConnectionSnapshot connection) {
        JsonNode response = client(connection).get()
            .uri(uriBuilder -> uriBuilder
                .path("/_apis/projects")
                .queryParam("api-version", API_VERSION)
                .queryParam("$top", MAX_PROJECTS)
                .build())
            .retrieve()
            .onStatus(status -> status.value() >= 400, (request, resp) -> {
                throw connectionFailed(resp);
            })
            .body(JsonNode.class);

        List<String> projects = new ArrayList<>();
        for (JsonNode project : response.path("value")) {
            String name = textOrNull(project.path("name"));
            if (name != null) {
                projects.add(name);
            }
        }
        return projects;
    }

    private List<Integer> queryIds(ImportConnectionSnapshot connection) {
        String wiql = "Select [System.Id] From WorkItems"
            + (connection.sourceProject() != null ? " Where [System.TeamProject] = '" + connection.sourceProject() + "'" : "")
            + " Order By [System.Id]";

        ObjectNode body = JsonNodeFactory.instance.objectNode();
        body.put("query", wiql);

        JsonNode response = client(connection).post()
            .uri(uriBuilder -> uriBuilder.path("/_apis/wit/wiql").queryParam("api-version", API_VERSION).build())
            .body(body)
            .retrieve()
            .onStatus(status -> status.value() >= 400, (request, response2) -> {
                throw connectionFailed(response2);
            })
            .body(JsonNode.class);

        List<Integer> ids = new ArrayList<>();
        for (JsonNode item : response.path("workItems")) {
            ids.add(item.path("id").asInt());
        }

        return ids;
    }

    // POST .../wit/workitemsbatch, not GET .../wit/workitems - a GET with an explicit
    // comma-joined field list risks exceeding URL length limits once "every field this org has" is
    // in play; the batch endpoint takes ids/expand in a JSON body instead, and returns every field
    // by default when `fields` is omitted.
    private List<JsonNode> fetchWorkItems(ImportConnectionSnapshot connection, List<Integer> ids) {
        ObjectNode body = JsonNodeFactory.instance.objectNode();
        ArrayNode idsNode = body.putArray("ids");
        ids.forEach(idsNode::add);
        body.put("$expand", "relations");

        JsonNode response = client(connection).post()
            .uri(uriBuilder -> uriBuilder.path("/_apis/wit/workitemsbatch").queryParam("api-version", API_VERSION).build())
            .body(body)
            .retrieve()
            .onStatus(status -> status.value() >= 400, (request, response2) -> {
                throw connectionFailed(response2);
            })
            .body(JsonNode.class);

        List<JsonNode> result = new ArrayList<>();
        for (JsonNode workItem : response.path("value")) {
            result.add(workItem);
        }

        return result;
    }

    private Map<String, String> toFieldMap(JsonNode workItem, FieldCatalog catalog, InlineImages images) {
        JsonNode fields = workItem.path("fields");

        Map<String, String> map = new LinkedHashMap<>();
        map.put("Id", textOrNull(workItem.path("id")));

        Iterator<Map.Entry<String, JsonNode>> fieldIterator = fields.fields();
        while (fieldIterator.hasNext()) {
            Map.Entry<String, JsonNode> entry = fieldIterator.next();
            String referenceName = entry.getKey();
            String displayName = catalog.nameOf(referenceName);

            if (referenceName.equals(DESCRIPTION_FIELD_ID)) {
                // System.Description is HTML (Azure DevOps' rich-text editor) - reduced to plain
                // text, except inline images, which become ATTACHMENT_IMAGE markers (see InlineImages).
                map.put(displayName, images.render(textOrNull(entry.getValue())));
            } else {
                map.put(displayName, stringifyFieldValue(entry.getValue()));
            }
        }

        return map;
    }

    // System.AssignedTo and similar identity fields come back as {displayName, uniqueName, ...}
    // objects - uniqueName (their email/UPN) matches what ImportMappingApplier's assignee matching
    // expects, everything else falls back to a readable string rather than silently dropping it.
    // First MAX_COMMENTS only, single call, same accepted scope limit as JiraImportSource.
    // The comments endpoint is still preview at COMMENTS_API_VERSION (7.0-preview.3) - Azure DevOps
    // has never promoted it to a stable api-version, unlike wit/fields and workitemsbatch above.
    // Unlike those org-level endpoints, the comments route only exists project-scoped
    // ({org}/{project}/_apis/...) - the org-level path is a plain HTML 404, not an API error. The
    // project comes from the work item's own System.TeamProject (always present, since
    // workitemsbatch returns every field), so this also works for an unscoped, org-wide import
    // where connection.sourceProject() is null.
    private List<ImportSourceComment> fetchComments(ImportConnectionSnapshot connection, JsonNode workItem, InlineImages images) {
        int workItemId = workItem.path("id").asInt();
        String teamProject = textOrNull(workItem.path("fields").path(TEAM_PROJECT_FIELD_ID));
        String project = teamProject != null ? teamProject : connection.sourceProject();

        if (project == null) {
            return List.of();
        }

        JsonNode response = client(connection).get()
            .uri(uriBuilder -> uriBuilder
                .path("/{project}/_apis/wit/workItems/{id}/comments")
                .queryParam("api-version", COMMENTS_API_VERSION)
                .queryParam("$top", MAX_COMMENTS)
                .build(project, workItemId))
            .retrieve()
            .onStatus(status -> status.value() >= 400, (request, resp) -> {
                throw connectionFailed(resp);
            })
            .body(JsonNode.class);

        List<ImportSourceComment> comments = new ArrayList<>();
        for (JsonNode comment : response.path("comments")) {
            String body = images.render(textOrNull(comment.path("text")));
            if (body == null) {
                continue;
            }

            String authorName = textOrNull(comment.path("createdBy").path("displayName"));
            comments.add(new ImportSourceComment(authorName, body, parseInstant(textOrNull(comment.path("createdDate")))));
        }

        return comments;
    }

    private Instant parseInstant(String value) {
        if (value == null) {
            return null;
        }
        try {
            return DateTimeFormatter.ISO_DATE_TIME.parse(value, Instant::from);
        } catch (Exception exception) {
            return null;
        }
    }

    private String stringifyFieldValue(JsonNode value) {
        if (value == null || value.isMissingNode() || value.isNull()) {
            return null;
        }
        if (value.isTextual() || value.isNumber() || value.isBoolean()) {
            return value.asText();
        }
        if (value.isObject()) {
            if (value.has("uniqueName")) {
                return textOrNull(value.path("uniqueName"));
            }
            if (value.has("displayName")) {
                return textOrNull(value.path("displayName"));
            }
            return value.toString();
        }
        if (value.isArray()) {
            List<String> parts = new ArrayList<>();
            for (JsonNode item : value) {
                String part = stringifyFieldValue(item);
                if (part != null) {
                    parts.add(part);
                }
            }
            return parts.isEmpty() ? null : String.join("; ", parts);
        }
        return textOrNull(value);
    }

    private String toPlainText(String html) {
        String text = TAG.matcher(html).replaceAll("");
        return text.replace("&nbsp;", " ").replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">").replace("&quot;", "\"").replace("&#39;", "'");
    }

    // https only, and only Azure DevOps' own hosts: the connection's own host (whatever form its
    // baseUrl uses), dev.azure.com, or a legacy {org}.visualstudio.com host.
    private boolean isAzureDevOpsUrl(ImportConnectionSnapshot connection, String url) {
        try {
            URI uri = URI.create(url);
            String host = uri.getHost();
            if (!"https".equalsIgnoreCase(uri.getScheme()) || host == null) {
                return false;
            }
            host = host.toLowerCase();
            String connectionHost = URI.create(connection.baseUrl()).getHost();

            return host.equals("dev.azure.com")
                || host.endsWith(".visualstudio.com")
                || (connectionHost != null && host.equals(connectionHost.toLowerCase()));
        } catch (IllegalArgumentException exception) {
            return false;
        }
    }

    /** Turns one work item's rich-text HTML (description, comments) into plain text, keeping inline
     images: each <img> becomes a `{{ATTACHMENT_IMAGE:<index>:<alt>}}` marker - same contract as
     JiraImportSource, resolved by ImportJobRunner.resolveAttachmentImageMarkers into a markdown image
     of the uploaded attachment. An image pasted into Azure DevOps rich text is stored at
     .../_apis/wit/attachments/{guid} but usually NOT added to the work item as an AttachedFile
     relation - so an <img> is matched to an existing attachment by that guid first, and otherwise
     appended to the record's own attachments list, to be downloaded/uploaded like any other.
     Only Azure DevOps-hosted images are ever downloaded (the download carries the PAT); an external
     image stays a plain markdown image of its original URL, and anything else is dropped. One
     instance per work item, shared by its description and all its comments, so the same pasted
     image used twice is only imported once. */
    private final class InlineImages {

        private final ImportConnectionSnapshot connection;
        private final List<ImportSourceAttachment> attachments;

        InlineImages(ImportConnectionSnapshot connection, List<ImportSourceAttachment> attachments) {
            this.connection = connection;
            this.attachments = attachments;
        }

        String render(String html) {
            if (html == null) {
                return null;
            }

            String withBreaks = BLOCK_BREAK.matcher(html).replaceAll("\n");
            Matcher imgMatcher = IMG_TAG.matcher(withBreaks);
            StringBuilder result = new StringBuilder();
            int last = 0;

            while (imgMatcher.find()) {
                result.append(toPlainText(withBreaks.substring(last, imgMatcher.start())));
                result.append(renderImage(imgMatcher.group()));
                last = imgMatcher.end();
            }
            result.append(toPlainText(withBreaks.substring(last)));

            String text = MULTIPLE_BLANK_LINES.matcher(result.toString()).replaceAll("\n\n").trim();
            return text.isEmpty() ? null : text;
        }

        private String renderImage(String tag) {
            String src = unescapeAttribute(firstGroup(ATTR_SRC, tag));
            String alt = sanitizeAlt(unescapeAttribute(firstGroup(ATTR_ALT, tag)));
            if (src == null) {
                return "";
            }

            String guid = firstGroup(ATTACHMENT_GUID, src);
            if (guid != null && isAzureDevOpsUrl(this.connection, src)) {
                return "{{ATTACHMENT_IMAGE:" + indexOf(guid, src, alt) + ":" + alt + "}}";
            }

            // Not an Azure DevOps attachment - never downloaded (see class javadoc), only linked.
            // Own paragraph, same reason as ImportJobRunner.resolveAttachmentImageMarkers.
            if (src.startsWith("https://") || src.startsWith("http://")) {
                return "\n\n![" + alt + "](" + src + ")\n\n";
            }
            return "";
        }

        private int indexOf(String guid, String src, String alt) {
            for (int i = 0; i < this.attachments.size(); i++) {
                String url = this.attachments.get(i).downloadUrl();
                if (url != null && guid.equalsIgnoreCase(firstGroup(ATTACHMENT_GUID, url))) {
                    return i;
                }
            }

            String fileName = firstGroup(FILE_NAME_PARAM, src);
            this.attachments.add(new ImportSourceAttachment(
                fileName != null ? URLDecoder.decode(fileName, StandardCharsets.UTF_8) : (alt.isEmpty() ? "image" : alt),
                null,
                null,
                src
            ));
            return this.attachments.size() - 1;
        }

        private String unescapeAttribute(String value) {
            return value == null ? null : value.replace("&amp;", "&").replace("&quot;", "\"").replace("&#39;", "'");
        }

        // "}" would end the marker early and "[]" would break the markdown image it becomes.
        private String sanitizeAlt(String alt) {
            return alt == null ? "" : alt.replaceAll("[\\[\\]{}]", "");
        }
    }

    private String firstGroup(Pattern pattern, String input) {
        if (input == null) {
            return null;
        }
        Matcher matcher = pattern.matcher(input);
        return matcher.find() ? matcher.group(1) : null;
    }
    // Attachments are relations with rel == "AttachedFile", not a plain field - the name lives
    // under attributes.name, the content url is the relation's own url (already a full download
    // endpoint, same auth as everything else here).
    private List<ImportSourceAttachment> toAttachments(JsonNode workItem) {
        List<ImportSourceAttachment> attachments = new ArrayList<>();

        for (JsonNode relation : workItem.path("relations")) {
            if (!"AttachedFile".equals(textOrNull(relation.path("rel")))) {
                continue;
            }

            JsonNode attributes = relation.path("attributes");
            attachments.add(new ImportSourceAttachment(
                textOrNull(attributes.path("name")),
                textOrNull(attributes.path("resourceType")),
                null,
                textOrNull(relation.path("url"))
            ));
        }

        return attachments;
    }

    // Work-item-to-work-item links live in the same "relations" array as attachments (already
    // fetched via $expand=relations), the target identified only by its REST url - the id is its
    // last path segment.
    private List<ImportSourceLink> toLinks(JsonNode workItem) {
        List<ImportSourceLink> links = new ArrayList<>();

        for (JsonNode relation : workItem.path("relations")) {
            ImportLinkType type = LINK_TYPES.get(textOrNull(relation.path("rel")));
            String url = textOrNull(relation.path("url"));
            if (type == null || url == null) {
                continue;
            }

            Matcher matcher = WORK_ITEM_URL_ID.matcher(url);
            if (matcher.find()) {
                links.add(new ImportSourceLink(matcher.group(1), type));
            }
        }

        return links;
    }

    private String shortMessage(Exception exception) {
        String message = exception.getMessage() != null ? exception.getMessage() : exception.getClass().getSimpleName();
        return message.length() > 200 ? message.substring(0, 200) + "..." : message;
    }

    private String textOrNull(JsonNode node) {
        return node == null || node.isMissingNode() || node.isNull() ? null : node.asText();
    }

    private RestClient client(ImportConnectionSnapshot connection) {
        String basicAuth = Base64.getEncoder().encodeToString((":" + connection.decryptedToken()).getBytes(StandardCharsets.UTF_8));

        return RestClient.builder()
            .baseUrl(connection.baseUrl())
            .defaultHeader("Authorization", "Basic " + basicAuth)
            .requestFactory(RedirectFollowingRequestFactory.create())
            .requestInterceptor(TransientFailureRetryInterceptor.INSTANCE)
            .build();
    }

    // Surfaces Azure DevOps' own error body instead of one generic message for every possible
    // cause - see JiraImportSource.connectionFailed for the same reasoning.
    private UnprocessableEntityException connectionFailed(ClientHttpResponse response) {
        return new UnprocessableEntityException(List.of(new Notification(
            "import-connection-failed",
            "Azure DevOps returned " + statusOf(response) + ": " + bodyOf(response),
            true
        )));
    }

    private int statusOf(ClientHttpResponse response) {
        try {
            return response.getStatusCode().value();
        } catch (IOException exception) {
            return 0;
        }
    }

    private String bodyOf(ClientHttpResponse response) {
        try {
            return new String(response.getBody().readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException exception) {
            return "(could not read response body)";
        }
    }

    private record FieldCatalog(Map<String, String> referenceNameToDisplayName) {
        String nameOf(String referenceName) {
            return referenceNameToDisplayName.getOrDefault(referenceName, referenceName);
        }

        List<String> sourceFieldNames() {
            List<String> names = new ArrayList<>();
            names.add("Id");
            names.addAll(referenceNameToDisplayName.values());
            return names;
        }
    }
}
