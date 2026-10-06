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
import java.nio.charset.StandardCharsets;
import java.time.Instant;
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

/** `POST /rest/api/3/search/jql` - Atlassian removed the older `/rest/api/2/search` and
 `/rest/api/3/search` endpoints (410 Gone, "migrate to /rest/api/3/search/jql" - see
 https://developer.atlassian.com/changelog/#CHANGE-2046), so this is the only endpoint left, v3
 only. Pagination changed with it: no more startAt/total, just an opaque nextPageToken the response
 hands back - which happens to already match this app's own ImportSourcePage.nextPageToken()
 contract almost exactly, so it's passed straight through rather than reimplemented.

 Source fields are NOT a hand-picked subset - `fields: ["*all"]` on the search request pulls every
 system AND custom field this Jira instance has, and `GET /rest/api/3/field` (fetchFieldCatalog)
 supplies the human-readable name for each field id (issues themselves are keyed by id, e.g.
 "customfield_10032", not by name). Custom field names aren't guaranteed unique across a Jira
 instance, so a custom field's display name is suffixed with its own id (e.g. "Story Points
 [customfield_10032]") to keep every entry unmistakably distinct; system fields keep their plain
 name. "Key" (the issue's own PROJ-123 identifier) is injected separately since it's a top-level
 issue property, not one of `fields` at all.

 "Description" and "Attachment" are the two fields NOT passed through the generic stringifier -
 description gets its own inline-image-aware rendering (see renderDescription), and attachment
 becomes the record's own attachments() list rather than a text field (a stringified attachment
 array would just be redundant filename noise).

 Description comes from `renderedFields.description` (requested via `expand: "renderedFields"`),
 not the raw `fields.description` ADF tree - ADF's inline images reference a Media Services id that
 doesn't reliably match `fields.attachment[].id`, so there's no reliable way to turn an ADF media
 node back into one of this ticket's own attachments. The RENDERED HTML's `<img src>` is the actual
 attachment content URL (or a prefix of it, possibly with extra query params), which IS directly
 matchable against `fields.attachment[].content` - see findAttachmentIndex. Everything else in the
 HTML is reduced to plain text (renderDescription strips remaining tags) - not a full HTML->Markdown
 conversion, just enough to keep paragraphs readable; only inline images get special handling, since
 that's the one thing that was actually silently dropped before. Comments' renderedBody goes through
 the same rendering (see renderHtml), resolved against the same issue attachments.

 An `<img>` that resolves to a known attachment becomes a `{{ATTACHMENT_IMAGE:<index>:<alt>}}`
 marker, `<index>` being its position in this record's own attachments() list - ImportJobRunner
 resolves these into real `![alt](.../attachment/{id}/download)` markdown links once it knows the
 ticket id and has pre-assigned each attachment's own id (see
 ImportJobRunner.resolveAttachmentImageMarkers). An unresolvable `<img>` (external/emoji image, not
 one of this issue's attachments) is dropped, same as before.

 Auth branches on whether the connection has an email: Atlassian Cloud authenticates with Basic
 email:apiToken (no bearer-PAT support at all); a self-hosted Jira Server/Data Center instance (if
 one is ever pointed here) has no such endpoint at all - v3's search/jql API is Cloud-only - so the
 Bearer branch is kept only for a hypothetical case where a self-hosted Jira turns out to have its
 own reverse-proxied equivalent. */
@Component
public class JiraImportSource implements ExternalImportSourceInterface {

    private static final int PAGE_SIZE = 50;
    private static final Logger log = LoggerFactory.getLogger(JiraImportSource.class);
    private static final int PREVIEW_SIZE = 5;
    private static final int MAX_COMMENTS = 100;
    private static final String DESCRIPTION_FIELD_ID = "description";
    private static final String ATTACHMENT_FIELD_ID = "attachment";
    private static final String ISSUE_TYPE_FIELD_ID = "issuetype";
    private static final String STATUS_FIELD_ID = "status";

    private static final Pattern IMG_TAG = Pattern.compile("<img\\b[^>]*>", Pattern.CASE_INSENSITIVE);
    private static final Pattern ATTR_SRC = Pattern.compile("\\bsrc=\"([^\"]*)\"", Pattern.CASE_INSENSITIVE);
    private static final Pattern ATTR_ALT = Pattern.compile("\\balt=\"([^\"]*)\"", Pattern.CASE_INSENSITIVE);
    private static final Pattern BLOCK_BREAK = Pattern.compile("(?i)</p>|<br\\s*/?>|</li>|</h[1-6]>");
    private static final Pattern TAG = Pattern.compile("<[^>]+>");

    @Override
    public ImportProvider provider() {
        return ImportProvider.JIRA;
    }

    @Override
    public ImportPreview preview(ImportConnectionSnapshot connection) {
        FieldCatalog catalog = fetchFieldCatalog(connection);
        JsonNode response = search(connection, PREVIEW_SIZE, null);

        List<Map<String, String>> rows = new ArrayList<>();
        for (JsonNode issue : response.path("issues")) {
            rows.add(toFieldMap(issue, catalog));
        }

        return new ImportPreview(catalog.sourceFieldNames(), rows, fetchKnownValues(connection, catalog));
    }

    @Override
    public ImportSourcePage fetchPage(ImportConnectionSnapshot connection, String pageToken) {
        FieldCatalog catalog = fetchFieldCatalog(connection);
        JsonNode response = search(connection, PAGE_SIZE, pageToken);

        List<ImportSourceRecord> records = new ArrayList<>();
        for (JsonNode issue : response.path("issues")) {
            String key = issue.path("key").asText();

            // Best effort, same as AzureDevOpsImportSource - one issue's comments failing must not
            // abort the whole import job.
            List<String> warnings = new ArrayList<>();
            List<ImportSourceComment> comments;
            try {
                comments = fetchComments(connection, key, issue.path("fields").path(ATTACHMENT_FIELD_ID));
            } catch (RuntimeException exception) {
                log.warn("Comments of issue {} could not be fetched: {}", key, exception.getMessage());
                String message = exception.getMessage() != null ? exception.getMessage() : exception.getClass().getSimpleName();
                warnings.add("comments not imported: " + (message.length() > 200 ? message.substring(0, 200) + "..." : message));
                comments = List.of();
            }

            records.add(new ImportSourceRecord(key, toFieldMap(issue, catalog), toAttachments(issue), comments, toLinks(issue), warnings));
        }

        boolean isLast = response.path("isLast").asBoolean(!response.hasNonNull("nextPageToken"));
        String nextPageToken = isLast ? null : textOrNull(response.path("nextPageToken"));

        return new ImportSourcePage(records, nextPageToken, null);
    }

    @Override
    public byte[] downloadAttachment(ImportConnectionSnapshot connection, String downloadUrl) {
        return client(connection).get()
            .uri(downloadUrl)
            .retrieve()
            .onStatus(status -> status.value() >= 400, (request, response) -> {
                throw connectionFailed(response);
            })
            .body(byte[].class);
    }

    // {id -> display name} for every field (system + custom) this Jira instance has - issues
    // themselves are keyed by id ("customfield_10032"), search's response never carries a
    // human-readable name for one, hence this separate lookup. Re-fetched on every preview/fetchPage
    // call rather than cached - a few dozen/hundred fields is a lightweight GET, and an import job's
    // total call count (pages of ~50 issues each) doesn't make this a meaningful cost.
    private FieldCatalog fetchFieldCatalog(ImportConnectionSnapshot connection) {
        JsonNode response = client(connection).get()
            .uri("/rest/api/3/field")
            .retrieve()
            .onStatus(status -> status.value() >= 400, (request, resp) -> {
                throw connectionFailed(resp);
            })
            .body(JsonNode.class);

        Map<String, String> idToDisplayName = new LinkedHashMap<>();
        for (JsonNode field : response) {
            String id = textOrNull(field.path("id"));
            String name = textOrNull(field.path("name"));
            if (id == null || name == null) {
                continue;
            }

            boolean isCustom = field.path("custom").asBoolean(false);
            idToDisplayName.put(id, isCustom ? name + " [" + id + "]" : name);
        }

        return new FieldCatalog(idToDisplayName);
    }

    // Every issue type/status name the import can run into, not just those in the PREVIEW_SIZE
    // sample rows - value mapping built from the sample alone misses anything that only shows up
    // later. Project-scoped connections use `/project/{key}/statuses` (issue types with their
    // statuses inlined, exactly what that project uses); unscoped ones fall back to the
    // instance-wide `/issuetype` + `/status` lists. Best effort - a failure here must not break the
    // preview itself, the name fallback in ImportMappingApplier still covers unmapped values.
    private Map<String, List<String>> fetchKnownValues(ImportConnectionSnapshot connection, FieldCatalog catalog) {
        try {
            Set<String> types = new LinkedHashSet<>();
            Set<String> statuses = new LinkedHashSet<>();

            if (connection.sourceProject() != null) {
                for (JsonNode issueType : getJson(connection, "/rest/api/3/project/{key}/statuses", connection.sourceProject())) {
                    addName(types, issueType);
                    for (JsonNode status : issueType.path("statuses")) {
                        addName(statuses, status);
                    }
                }
            } else {
                for (JsonNode issueType : getJson(connection, "/rest/api/3/issuetype")) {
                    addName(types, issueType);
                }
                for (JsonNode status : getJson(connection, "/rest/api/3/status")) {
                    addName(statuses, status);
                }
            }

            Map<String, List<String>> values = new LinkedHashMap<>();
            values.put(catalog.nameOf(ISSUE_TYPE_FIELD_ID), List.copyOf(types));
            values.put(catalog.nameOf(STATUS_FIELD_ID), List.copyOf(statuses));
            return values;
        } catch (RuntimeException exception) {
            log.warn("Could not enumerate Jira issue types/statuses: {}", exception.getMessage());
            return Map.of();
        }
    }

    private JsonNode getJson(ImportConnectionSnapshot connection, String path, Object... uriVariables) {
        return client(connection).get()
            .uri(path, uriVariables)
            .retrieve()
            .onStatus(status -> status.value() >= 400, (request, resp) -> {
                throw connectionFailed(resp);
            })
            .body(JsonNode.class);
    }

    private void addName(Set<String> names, JsonNode node) {
        String name = textOrNull(node.path("name"));
        if (name != null) {
            names.add(name);
        }
    }

    // First MAX_COMMENTS only, newest-last (Jira's default order) - a single GET per issue, not
    // paginated further; a genuinely comment-heavy issue losing its oldest overflow comments is an
    // accepted scope limit here, same spirit as PAGE_SIZE/PREVIEW_SIZE elsewhere in this class.
    // expand=renderedBody gets the HTML rendering (same reasoning as the issue description) instead
    // of the raw ADF body, which the same stripTags/unescapeHtml/BLOCK_BREAK helpers already handle.
    // attachments = the issue's own fields.attachment array - an image pasted into a Jira comment is
    // stored as an attachment of the issue itself, so comment <img>s resolve against the same list
    // (and the same attachments() indexes) as the description's.
    private List<ImportSourceComment> fetchComments(ImportConnectionSnapshot connection, String issueKey, JsonNode attachments) {
        JsonNode response = client(connection).get()
            .uri(uriBuilder -> uriBuilder
                .path("/rest/api/3/issue/{key}/comment")
                .queryParam("expand", "renderedBody")
                .queryParam("maxResults", MAX_COMMENTS)
                .build(issueKey))
            .retrieve()
            .onStatus(status -> status.value() >= 400, (request, resp) -> {
                throw connectionFailed(resp);
            })
            .body(JsonNode.class);

        List<ImportSourceComment> comments = new ArrayList<>();
        for (JsonNode comment : response.path("comments")) {
            String body = renderCommentBody(comment, attachments);
            if (body == null) {
                continue;
            }

            comments.add(new ImportSourceComment(
                textOrNull(comment.path("author").path("displayName")),
                body,
                parseInstant(textOrNull(comment.path("created")))
            ));
        }

        return comments;
    }

    private String renderCommentBody(JsonNode comment, JsonNode attachments) {
        String html = textOrNull(comment.path("renderedBody"));
        if (html == null) {
            return extractPlainText(comment.path("body"));
        }

        return renderHtml(html, attachments);
    }

    private Instant parseInstant(String value) {
        if (value == null) {
            return null;
        }
        try {
            return java.time.OffsetDateTime.parse(value).toInstant();
        } catch (Exception exception) {
            return null;
        }
    }

    private JsonNode search(ImportConnectionSnapshot connection, int maxResults, String pageToken) {
        ObjectNode body = JsonNodeFactory.instance.objectNode();
        if (connection.sourceProject() != null) {
            body.put("jql", "project = \"" + connection.sourceProject() + "\"");
        }
        body.put("maxResults", maxResults);
        ArrayNode fieldsNode = body.putArray("fields");
        fieldsNode.add("*all");
        body.put("expand", "renderedFields");
        if (pageToken != null) {
            body.put("nextPageToken", pageToken);
        }

        return client(connection).post()
            .uri("/rest/api/3/search/jql")
            .body(body)
            .retrieve()
            .onStatus(status -> status.value() >= 400, (request, response) -> {
                throw connectionFailed(response);
            })
            .body(JsonNode.class);
    }

    private Map<String, String> toFieldMap(JsonNode issue, FieldCatalog catalog) {
        JsonNode fields = issue.path("fields");

        Map<String, String> map = new LinkedHashMap<>();
        map.put("Key", textOrNull(issue.path("key")));

        Iterator<Map.Entry<String, JsonNode>> fieldIterator = fields.fields();
        while (fieldIterator.hasNext()) {
            Map.Entry<String, JsonNode> entry = fieldIterator.next();
            String fieldId = entry.getKey();

            if (fieldId.equals(ATTACHMENT_FIELD_ID)) {
                continue;
            }

            String displayName = catalog.nameOf(fieldId);

            if (fieldId.equals(DESCRIPTION_FIELD_ID)) {
                map.put(displayName, renderDescription(issue));
            } else {
                map.put(displayName, stringifyFieldValue(entry.getValue()));
            }
        }

        return map;
    }

    // Custom field values come back in every shape Jira's own field types use: plain
    // string/number/boolean, a single {value:...}/{name:...}/{displayName:...} option-or-user
    // object, or an array of any of those (multi-select, multi-user, labels). Arrays join with "; ";
    // an object shape this doesn't recognize falls back to its raw JSON rather than silently
    // dropping the value.
    private String stringifyFieldValue(JsonNode value) {
        if (value == null || value.isMissingNode() || value.isNull()) {
            return null;
        }

        if (value.isArray()) {
            List<String> parts = new ArrayList<>();
            for (JsonNode item : value) {
                String part = stringifyScalar(item);
                if (part != null) {
                    parts.add(part);
                }
            }
            return parts.isEmpty() ? null : String.join("; ", parts);
        }

        return stringifyScalar(value);
    }

    private String stringifyScalar(JsonNode node) {
        if (node.isTextual() || node.isNumber() || node.isBoolean()) {
            return node.asText();
        }

        if (node.isObject()) {
            if (node.has("value")) {
                return textOrNull(node.path("value"));
            }
            if (node.has("displayName")) {
                return textOrNull(node.path("displayName"));
            }
            if (node.has("emailAddress")) {
                return textOrNull(node.path("emailAddress"));
            }
            if (node.has("name")) {
                return textOrNull(node.path("name"));
            }
            return node.toString();
        }

        return textOrNull(node);
    }

    private List<ImportSourceAttachment> toAttachments(JsonNode issue) {
        List<ImportSourceAttachment> attachments = new ArrayList<>();

        for (JsonNode attachment : issue.path("fields").path(ATTACHMENT_FIELD_ID)) {
            attachments.add(new ImportSourceAttachment(
                textOrNull(attachment.path("filename")),
                textOrNull(attachment.path("mimeType")),
                attachment.hasNonNull("size") ? attachment.path("size").asLong() : null,
                textOrNull(attachment.path("content"))
            ));
        }

        return attachments;
    }

    private String renderDescription(JsonNode issue) {
        String html = textOrNull(issue.path("renderedFields").path(DESCRIPTION_FIELD_ID));
        if (html == null) {
            return extractPlainText(issue.path("fields").path(DESCRIPTION_FIELD_ID));
        }

        return renderHtml(html, issue.path("fields").path(ATTACHMENT_FIELD_ID));
    }

    // Shared by the description and comments: block-level breaks become newlines, an <img> matching
    // one of the issue's attachments becomes an ATTACHMENT_IMAGE marker (see the class javadoc),
    // every other tag is stripped.
    private String renderHtml(String html, JsonNode attachments) {
        String withBreaks = BLOCK_BREAK.matcher(html).replaceAll("\n");

        Matcher imgMatcher = IMG_TAG.matcher(withBreaks);
        StringBuilder result = new StringBuilder();
        int last = 0;

        while (imgMatcher.find()) {
            result.append(stripTags(withBreaks.substring(last, imgMatcher.start())));

            String tag = imgMatcher.group();
            String src = firstGroup(ATTR_SRC, tag);
            String alt = firstGroup(ATTR_ALT, tag);
            int attachmentIndex = src != null ? findAttachmentIndex(attachments, src) : -1;

            if (attachmentIndex >= 0) {
                result.append("{{ATTACHMENT_IMAGE:").append(attachmentIndex).append(":").append(markerAlt(alt)).append("}}");
            }

            last = imgMatcher.end();
        }
        result.append(stripTags(withBreaks.substring(last)));

        String text = unescapeHtml(result.toString()).trim();
        return text.isEmpty() ? null : text;
    }

    // Matches by content-URL prefix (ignoring query strings) rather than assuming any particular
    // id format in the rendered <img src> - Jira's rendered HTML img src is the same content URL
    // fields.attachment[].content has, possibly with extra query params appended.
    private int findAttachmentIndex(JsonNode attachments, String imgSrc) {
        String normalizedSrc = stripQuery(imgSrc);
        int index = 0;

        for (JsonNode attachment : attachments) {
            String content = textOrNull(attachment.path("content"));
            if (content != null && normalizedSrc.startsWith(stripQuery(content))) {
                return index;
            }
            index++;
        }

        return -1;
    }

    // "}" would end the marker early and "[]" would break the markdown image it becomes - dropped.
    private String markerAlt(String alt) {
        return alt == null ? "" : alt.replaceAll("[\\[\\]{}]", "");
    }

    private String stripQuery(String url) {
        int questionMark = url.indexOf('?');
        return questionMark >= 0 ? url.substring(0, questionMark) : url;
    }

    private String stripTags(String html) {
        return TAG.matcher(html).replaceAll("");
    }

    private String unescapeHtml(String text) {
        return text
            .replace("&nbsp;", " ")
            .replace("&amp;", "&")
            .replace("&lt;", "<")
            .replace("&gt;", ">")
            .replace("&quot;", "\"")
            .replace("&#39;", "'");
    }

    private String firstGroup(Pattern pattern, String input) {
        Matcher matcher = pattern.matcher(input);
        return matcher.find() ? matcher.group(1) : null;
    }

    // Fallback for the (unexpected) case renderedFields didn't come back - ADF is a tree of
    // {type, content: [...], text: "..."} nodes, every "text" leaf gets joined. No image handling
    // here (see class javadoc for why ADF media nodes aren't reliably resolvable to an attachment).
    private String extractPlainText(JsonNode node) {
        if (node == null || node.isMissingNode() || node.isNull()) {
            return null;
        }
        if (node.isTextual()) {
            return node.asText();
        }

        StringBuilder text = new StringBuilder();
        collectText(node, text, true);

        String result = text.toString().trim();
        return result.isEmpty() ? null : result;
    }

    private void collectText(JsonNode node, StringBuilder out, boolean topLevel) {
        if (node.has("text")) {
            out.append(node.path("text").asText());
        }

        for (JsonNode child : node.path("content")) {
            collectText(child, out, false);
        }

        if (topLevel && !out.isEmpty()) {
            out.append("\n\n");
        }
    }

    // fields.parent covers both sub-task parents and epic/child hierarchy on current Jira Cloud.
    // Issue links are keyed by the link type's stable `name` (not its localizable inward/outward
    // labels); which side the other issue sits on (outwardIssue vs inwardIssue) gives direction -
    // e.g. "Blocks" with outwardIssue = "this blocks X". Unknown/custom link types (Cloners, ...)
    // fall back to RELATES_TO rather than being dropped.
    private List<ImportSourceLink> toLinks(JsonNode issue) {
        List<ImportSourceLink> links = new ArrayList<>();
        JsonNode fields = issue.path("fields");

        String parentKey = textOrNull(fields.path("parent").path("key"));
        if (parentKey != null) {
            links.add(new ImportSourceLink(parentKey, ImportLinkType.PARENT));
        }

        for (JsonNode link : fields.path("issuelinks")) {
            String typeName = textOrNull(link.path("type").path("name"));
            String outwardKey = textOrNull(link.path("outwardIssue").path("key"));
            String inwardKey = textOrNull(link.path("inwardIssue").path("key"));

            if (outwardKey != null) {
                links.add(new ImportSourceLink(outwardKey, linkType(typeName, true)));
            } else if (inwardKey != null) {
                links.add(new ImportSourceLink(inwardKey, linkType(typeName, false)));
            }
        }

        return links;
    }

    private ImportLinkType linkType(String typeName, boolean outward) {
        if (typeName == null) {
            return ImportLinkType.RELATES_TO;
        }
        return switch (typeName) {
            case "Blocks" -> outward ? ImportLinkType.BLOCKS : ImportLinkType.IS_BLOCKED_BY;
            case "Duplicate" -> outward ? ImportLinkType.DUPLICATES : ImportLinkType.IS_DUPLICATED_BY;
            case "Problem/Incident" -> outward ? ImportLinkType.IMPACTS : ImportLinkType.IS_IMPACTED_BY;
            default -> ImportLinkType.RELATES_TO;
        };
    }

    private String textOrNull(JsonNode node) {
        return node == null || node.isMissingNode() || node.isNull() ? null : node.asText();
    }

    private RestClient client(ImportConnectionSnapshot connection) {
        String authorization = connection.email() != null
            ? "Basic " + Base64.getEncoder().encodeToString((connection.email() + ":" + connection.decryptedToken()).getBytes(StandardCharsets.UTF_8))
            : "Bearer " + connection.decryptedToken();

        return RestClient.builder()
            .baseUrl(connection.baseUrl())
            .defaultHeader("Authorization", authorization)
            .requestFactory(RedirectFollowingRequestFactory.create())
            .requestInterceptor(TransientFailureRetryInterceptor.INSTANCE)
            .build();
    }

    // Surfaces Jira's own error body (e.g. "The value 'X' does not exist for the field 'project'"
    // for a bad sourceProject, or an auth failure message) instead of one generic message for every
    // possible cause - a wrong base URL/token and a bad JQL project key look identical otherwise.
    private UnprocessableEntityException connectionFailed(ClientHttpResponse response) {
        return new UnprocessableEntityException(List.of(new Notification(
            "import-connection-failed",
            "Jira returned " + statusOf(response) + ": " + bodyOf(response),
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

    private record FieldCatalog(Map<String, String> idToDisplayName) {
        String nameOf(String fieldId) {
            return idToDisplayName.getOrDefault(fieldId, fieldId);
        }

        List<String> sourceFieldNames() {
            List<String> names = new ArrayList<>();
            names.add("Key");
            for (Map.Entry<String, String> entry : idToDisplayName.entrySet()) {
                if (!entry.getKey().equals(ATTACHMENT_FIELD_ID)) {
                    names.add(entry.getValue());
                }
            }
            return names;
        }
    }
}
