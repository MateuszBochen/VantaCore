package vantaCore.application.importExport.domain.vo;

public record ImportRowResult(
    int rowNumber,
    ImportRowOutcome outcome,
    String ticketKey,
    String message
) {
}
