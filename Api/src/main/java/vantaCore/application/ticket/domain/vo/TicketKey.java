package vantaCore.application.ticket.domain.vo;

public record TicketKey(String value) {

    private static final String FALLBACK_PREFIX = "TICKET";

    public TicketKey {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("TicketKey cannot be blank");
        }
    }

    /** {prefix}-{number}, e.g. "VC-1000" - falls back to a generic prefix for a project that hasn't set one yet. */
    public static TicketKey generate(String prefix, int number) {
        String usedPrefix = (prefix == null || prefix.isBlank()) ? FALLBACK_PREFIX : prefix;

        return new TicketKey(usedPrefix + "-" + number);
    }

    @Override
    public String toString() {
        return this.value;
    }
}
