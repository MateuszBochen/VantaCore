package vantaCore.application.importExport.domain.source;

/** Provider-neutral link kinds an import source can report, from the owning record's point of view
 ("this record {type} target"). PARENT sets the ticket's parentId, everything else becomes a ticket
 relation of the same name - ImportJobRunner maps these onto the ticket module's own types, so this
 module never depends on them here. Child links aren't represented: the child's own PARENT link
 already says the same thing. */
public enum ImportLinkType {
    PARENT,
    RELATES_TO,
    BLOCKS,
    IS_BLOCKED_BY,
    DUPLICATES,
    IS_DUPLICATED_BY,
    IMPACTS,
    IS_IMPACTED_BY
}
