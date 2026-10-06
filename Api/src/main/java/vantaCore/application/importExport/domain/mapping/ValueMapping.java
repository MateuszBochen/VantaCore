package vantaCore.application.importExport.domain.mapping;

import java.util.UUID;

/** sourceValue -> targetId, where targetId is either an IssueType.id or a Status.id depending on
 which target field (issueType/status) the sourceValue was seen under - the wire contract doesn't
 carry that association explicitly, so ImportMappingApplier resolves it by looking up sourceValue in
 this flat map at the point it already knows which target field it's mapping (see its javadoc). */
public record ValueMapping(String sourceValue, UUID targetId) {
}
