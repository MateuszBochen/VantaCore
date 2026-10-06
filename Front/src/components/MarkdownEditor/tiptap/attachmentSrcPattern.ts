// Matches exactly what attachmentDownloadPath builds, for any owner type
// (ticket, sub-project, project-level documentation - see attachmentPath.ts)
// - the media picker (see MarkdownEditorProps.imagePicker, which covers both
// image and video attachments - AttachmentMediaPicker) stores THIS path as
// the node's src instead of some opaque id, so the markdown stays self-
// describing (the full owner path is right there in the text) and rendering
// it back doesn't need that threaded through every MarkdownEditor/
// MarkdownPreview call site as extra props - the matched src is fetched
// as-is, no need to even pull the owner path back out of it. Shared between
// AttachmentImage.tsx and AttachmentVideo.tsx - both need to tell "one of
// our own attachments (needs an authenticated blob fetch)" apart from "an
// external URL pasted via the toolbar's URL fallback (set as src directly)".
export const ATTACHMENT_SRC_PATTERN = /^\/api\/project\/[^/]+\/(?:(?:ticket|sub-project)\/[^/]+|documentation)\/attachment\/[^/]+\/download$/;
