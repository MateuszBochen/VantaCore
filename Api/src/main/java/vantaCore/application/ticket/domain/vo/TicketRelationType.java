package vantaCore.application.ticket.domain.vo;

public enum TicketRelationType {
    BLOCKS,
    IS_BLOCKED_BY,
    RELATES_TO,
    DUPLICATES,
    IS_DUPLICATED_BY,
    IMPACTS,
    IS_IMPACTED_BY;

    /** What the OTHER ticket in the pair sees, looking back - e.g. if A is BLOCKS B, B sees
     IS_BLOCKED_BY A. RELATES_TO is its own inverse (symmetric). */
    public TicketRelationType inverse() {
        return switch (this) {
            case BLOCKS -> IS_BLOCKED_BY;
            case IS_BLOCKED_BY -> BLOCKS;
            case RELATES_TO -> RELATES_TO;
            case DUPLICATES -> IS_DUPLICATED_BY;
            case IS_DUPLICATED_BY -> DUPLICATES;
            case IMPACTS -> IS_IMPACTED_BY;
            case IS_IMPACTED_BY -> IMPACTS;
        };
    }
}
