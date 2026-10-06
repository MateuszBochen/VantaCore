import type {CollectionResponse} from '@/lib/Request/Type/types';

// A file attached to some owner resource - a ticket, a sub-project's
// documentation, or a project's platform documentation (see basePath below;
// each owner type builds its own `/api/project/{projectId}/...` prefix, see
// each module's own attachment glue: Tickets/TicketEditor, Documentation/
// SubProjectDocumentationPage, Documentation/PlatformDocumentationSection).
// Not embedded on the owner itself, fetched separately via
// GET {basePath}/attachment - same lazy-load precedent as Ticket
// Comments/Worklog/Test Cases. Confirmed 2026-08-09 (for the ticket-owned
// shape, and assumed identical for sub-project/documentation since the
// backend describes all three as the same {meta, data: [{id, resource}]}
// envelope): a single flat resource shape (no authorId ambiguity like
// Comment's). Upload is POST {basePath}/attachment/{attachmentId} where
// attachmentId is a frontend-generated uuid (see Uploader/
// useUploadAttachmentHook), so unlike Comment/WorklogEntry there's no
// separate create-then-refetch step to learn the id. Every byte of a file -
// a full download or just an inline image thumbnail - goes through the
// single authenticated GET {basePath}/attachment/{id}/download endpoint
// (see useGetAttachmentBlobHook); the resource's own `url` field isn't
// parsed here since nothing can use it (a plain <img>/<a> can't attach the
// JWT this backend requires). 25MB upload limit, enforced client-side too
// (see attachmentLimits.ts).
export type Attachment = {
  id: string;
  fileName: string;
  size: number;
  // null when the upload arrived without one - e.g. attachments brought in
  // by a Jira/Azure DevOps import, whose source didn't report a MIME type.
  contentType: string | null;
  createdAt: string;
  authorId: string;
};

export type AttachmentResponseItem = {
  id: string;
  resource: {
    id: string;
    originalFilename: string;
    contentType: string | null;
    sizeBytes: number;
    uploadedByUserId: string;
    uploadedAt: string;
    url: string;
  };
};

export type ListAttachmentsResponse = CollectionResponse<AttachmentResponseItem>;

export type ListAttachmentsResult =
  | {success: true; attachments: Attachment[]}
  | {success: false};

export type AttachmentMutationResult =
  | {success: true}
  | {success: false};
