package vantaCore.application.file.domain.vo;

public enum FileOwnerType {
    /** ownerId = the ticket it's attached to. Served only via the authenticated /api/** endpoint. */
    TICKET_ATTACHMENT,
    /** ownerId = the sub-project it's attached to (stable across versions - not a specific version
     id). Served only via the authenticated /api/** endpoint. */
    SUB_PROJECT_ATTACHMENT,
    /** ownerId = the project it's attached to - platform documentation is 1:1 with a project (no
     separate id of its own), so the project's own id is the owner. Served only via the authenticated
     /api/** endpoint. */
    PLATFORM_DOCUMENTATION_ATTACHMENT,
    /** ownerId = the user it belongs to. Served publicly (see PublicFileController) since avatars
     render in plain <img> tags, which can't carry an Authorization header. */
    USER_AVATAR,
    /** ownerId is always null - a standalone image embedded in some markdown content (e.g. a ticket
     description) by URL, not tied to a specific owning entity. Served publicly for the same <img>
     reason as USER_AVATAR. */
    EDITOR_IMAGE
}
