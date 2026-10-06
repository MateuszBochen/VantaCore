// Confirmed 2026-08-09 with the backend for tickets; assumed identical for
// sub-project/documentation attachments since they're described as the same
// endpoint shape. Shared by every AttachmentsSection/AttachmentMediaPicker's
// Uploader - all upload through useUploadAttachmentHook, which enforces the
// same limit server-side.
export const MAX_ATTACHMENT_SIZE_BYTES = 25 * 1024 * 1024;
