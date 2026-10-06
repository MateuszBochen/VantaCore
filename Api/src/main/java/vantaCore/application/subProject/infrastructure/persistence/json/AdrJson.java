package vantaCore.application.subProject.infrastructure.persistence.json;

import vantaCore.application.subProject.domain.vo.Adr;

import java.util.UUID;

public record AdrJson(
    UUID id,
    String title,
    String content
) {

    public static AdrJson fromDomain(Adr adr) {
        return new AdrJson(adr.id(), adr.title(), adr.content());
    }

    public Adr toDomain() {
        return new Adr(this.id, this.title, this.content);
    }
}
