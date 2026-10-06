package vantaCore.application.ticket.appliaction.dto;

import jakarta.validation.constraints.NotNull;

import java.util.Map;

// Params shape depends on type, same "free-form Record<string,string>" contract as the Automation
// Engine's actions - SET_STATUS -> {statusId}, ASSIGN -> {userId}, SET_FIELD -> {fieldId, value},
// ADD_FLAG/REMOVE_FLAG -> {flagId}, MOVE_SUB_PROJECT -> {subProjectId}, DELETE -> {} (no params).
final public class BulkActionRequest {

    @NotNull
    private final BulkActionType type;

    private final Map<String, String> params;

    public BulkActionRequest(BulkActionType type, Map<String, String> params) {
        this.type = type;
        this.params = params;
    }

    public BulkActionType getType() {
        return type;
    }

    public Map<String, String> getParams() {
        return params;
    }
}
