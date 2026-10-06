package vantaCore.application.automationEngine.domain.vo;

public enum ActionType {
    SET_STATUS,
    ASSIGN_USER,
    ADD_COMMENT,
    SET_FIELD_VALUE,
    SEND_NOTIFICATION,
    // No params - "next" is resolved fresh at execution time (see AssignTicketToReleaseVersionCommand),
    // not cached at rule-authoring time, since it changes as releases actually ship.
    ASSIGN_NEXT_VERSION
}
