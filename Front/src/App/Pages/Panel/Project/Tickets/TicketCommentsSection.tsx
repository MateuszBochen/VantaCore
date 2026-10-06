import {useEffect, useState} from 'react';
import {Check, Pencil, Send, Trash2} from 'lucide-react';
import {cn} from '@/lib/utils';
import {Button} from '@/components/ui/button';
import {UserChip} from '@/components/ui/user-chip';
import {Surface} from '@/components/ui/surface';
import {MarkdownEditor, MarkdownPreview} from '@/components/MarkdownEditor';
import {AttachmentMediaPicker} from '@/components/Attachment';
import useListCommentsHook from '@/lib/Ticket/useListCommentsHook';
import useAddCommentHook from '@/lib/Ticket/useAddCommentHook';
import useUpdateCommentHook from '@/lib/Ticket/useUpdateCommentHook';
import useDeleteCommentHook from '@/lib/Ticket/useDeleteCommentHook';
import {eventBus} from '@/lib/EventBus/EventBus';
import {CommentWasAddedRemoteEvent} from '@/lib/WebSocket/Event/CommentWasAddedRemoteEvent';
import {CommentWasChangedRemoteEvent} from '@/lib/WebSocket/Event/CommentWasChangedRemoteEvent';
import {CommentWasDeletedRemoteEvent} from '@/lib/WebSocket/Event/CommentWasDeletedRemoteEvent';
import type {Comment} from '@/lib/Ticket/Type/types';

type TicketCommentsSectionProps = {
  projectId: string;
  ticketId: string;
  // Set by a MENTIONED_IN_COMMENT notification's link (see
  // useResolveNotificationLinkHook/TicketPage) - scrolls to and briefly
  // highlights this one comment once the list has loaded.
  highlightCommentId?: string | null;
};

type FetchState = {
  id: string;
  comments: Comment[];
};

const formatTimestamp = (isoString: string): string => {
  const date = new Date(isoString);
  return Number.isNaN(date.getTime()) ? isoString : date.toLocaleString();
};

// Best-effort - matches Comment plus the ticketId a websocket message needs
// to carry (see CommentWasAddedRemoteEvent).
const parseRemoteComment = (payload: unknown): (Comment & {ticketId: string}) | null => {
  if (typeof payload !== 'object' || payload === null) {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const {id, ticketId, body, createdAt, changedAt, authorId} = record;

  if (
    typeof id !== 'string' ||
    typeof ticketId !== 'string' ||
    typeof body !== 'string' ||
    typeof createdAt !== 'string' ||
    typeof authorId !== 'string'
  ) {
    return null;
  }

  return {id, ticketId, body, createdAt, changedAt: typeof changedAt === 'string' ? changedAt : createdAt, authorId};
};

// COMMENT_DELETED's payload is just {ticketId, commentId} - no full comment
// resource to reuse parseRemoteComment for.
const parseRemoteDeletion = (payload: unknown): {ticketId: string; commentId: string} | null => {
  if (typeof payload !== 'object' || payload === null) {
    return null;
  }

  const {ticketId, commentId} = payload as Record<string, unknown>;

  if (typeof ticketId !== 'string' || typeof commentId !== 'string') {
    return null;
  }

  return {ticketId, commentId};
};

// Its own Stepper step (see TicketPage), fetched lazily from its own
// endpoint rather than embedded on Ticket - same precedent as SubProject
// docs/Worklog. Edit/delete are always shown rather than gated to the
// comment's own author - the backend enforces that ownership check anyway,
// and there isn't a reliable way to resolve "am I this comment's author"
// client-side (JwtManager only carries the JWT's own claims, not a user id
// matching the directory's).
const TicketCommentsSection = ({projectId, ticketId, highlightCommentId = null}: TicketCommentsSectionProps) => {
  const attachmentBasePath = `/api/project/${projectId}/ticket/${ticketId}`;
  const {listComments} = useListCommentsHook();
  const {addComment} = useAddCommentHook();
  const {updateComment} = useUpdateCommentHook();
  const {deleteComment} = useDeleteCommentHook();

  const [fetched, setFetched] = useState<FetchState | null>(null);
  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);
  // Initialized once from the prop (not kept in sync afterward - it's set
  // once from the URL a notification linked to, not something that changes
  // mid-session) and cleared after the flash below fades.
  const [highlightedCommentId, setHighlightedCommentId] = useState(highlightCommentId);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const refetch = () => {
    listComments(projectId, ticketId).then((result) => {
      setFetched({id: ticketId, comments: result.success ? result.comments : []});
    });
  };

  useEffect(() => {
    let cancelled = false;

    listComments(projectId, ticketId).then((result) => {
      if (!cancelled) {
        setFetched({id: ticketId, comments: result.success ? result.comments : []});
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- listComments is a thin useRequestHook wrapper recreated every render
  }, [projectId, ticketId]);

  // Live-tracks new comments (this tab's own post, another tab, or another
  // user) - appended in place rather than a refetch, deduped by id since
  // this tab's own post already lands via handlePost's refetch below and
  // would otherwise show up twice once the websocket echo arrives too.
  useEffect(() => {
    const handleCommentAddedRemotely = (remoteEvent: CommentWasAddedRemoteEvent) => {
      const comment = parseRemoteComment(remoteEvent.payload);

      if (!comment || comment.ticketId !== ticketId) {
        return;
      }

      setFetched((current) => {
        if (!current || current.id !== ticketId || current.comments.some((existing) => existing.id === comment.id)) {
          return current;
        }

        // Newest first, same ordering as useListCommentsHook - a
        // brand-new comment is always the newest, so it always belongs at
        // the front rather than needing a re-sort.
        return {id: ticketId, comments: [comment, ...current.comments]};
      });
    };

    eventBus.subscribe<CommentWasAddedRemoteEvent>(CommentWasAddedRemoteEvent.name, handleCommentAddedRemotely);

    return () => {
      eventBus.unsubscribe<CommentWasAddedRemoteEvent>(CommentWasAddedRemoteEvent.name, handleCommentAddedRemotely);
    };
  }, [ticketId]);

  // Live-tracks edits - patches the matching entry in place (same position,
  // sorting is by createdAt which an edit doesn't change) rather than a
  // refetch, same reasoning as the "added" handler above.
  useEffect(() => {
    const handleCommentChangedRemotely = (remoteEvent: CommentWasChangedRemoteEvent) => {
      const comment = parseRemoteComment(remoteEvent.payload);

      if (!comment || comment.ticketId !== ticketId) {
        return;
      }

      setFetched((current) => {
        if (!current || current.id !== ticketId) {
          return current;
        }

        return {
          id: ticketId,
          comments: current.comments.map((existing) => (existing.id === comment.id ? comment : existing)),
        };
      });
    };

    eventBus.subscribe<CommentWasChangedRemoteEvent>(CommentWasChangedRemoteEvent.name, handleCommentChangedRemotely);

    return () => {
      eventBus.unsubscribe<CommentWasChangedRemoteEvent>(CommentWasChangedRemoteEvent.name, handleCommentChangedRemotely);
    };
  }, [ticketId]);

  // Live-tracks deletions - removing an id that's already gone (e.g. this
  // tab's own delete, already removed by handleDelete's refetch below) is a
  // harmless no-op, so no dedup guard is needed here unlike add/change.
  useEffect(() => {
    const handleCommentDeletedRemotely = (remoteEvent: CommentWasDeletedRemoteEvent) => {
      const deletion = parseRemoteDeletion(remoteEvent.payload);

      if (!deletion || deletion.ticketId !== ticketId) {
        return;
      }

      setFetched((current) => {
        if (!current || current.id !== ticketId) {
          return current;
        }

        return {id: ticketId, comments: current.comments.filter((existing) => existing.id !== deletion.commentId)};
      });
    };

    eventBus.subscribe<CommentWasDeletedRemoteEvent>(CommentWasDeletedRemoteEvent.name, handleCommentDeletedRemotely);

    return () => {
      eventBus.unsubscribe<CommentWasDeletedRemoteEvent>(CommentWasDeletedRemoteEvent.name, handleCommentDeletedRemotely);
    };
  }, [ticketId]);

  const loading = fetched?.id !== ticketId;
  const comments = loading ? [] : fetched!.comments;

  // Runs once the real comment list has rendered (not on every `loading`
  // flip - see the id in the deps below) - best-effort: if the target
  // comment isn't actually in this ticket's list (deleted, or some future
  // pagination limit), getElementById just returns null and this quietly
  // does nothing rather than erroring.
  useEffect(() => {
    if (!highlightCommentId || loading) {
      return;
    }

    document.getElementById(`comment-${highlightCommentId}`)?.scrollIntoView({behavior: 'smooth', block: 'center'});

    const timer = setTimeout(() => setHighlightedCommentId(null), 3000);
    return () => clearTimeout(timer);
  }, [highlightCommentId, loading]);

  const handlePost = () => {
    const trimmed = body.trim();

    if (!trimmed) {
      return;
    }

    setPosting(true);

    addComment(projectId, ticketId, {body: trimmed})
      .then((result) => {
        if (result.success) {
          setBody('');
          refetch();
        }
      })
      .finally(() => setPosting(false));
  };

  const startEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditBody(comment.body);
  };

  const handleSaveEdit = (comment: Comment) => {
    const trimmed = editBody.trim();

    if (!trimmed) {
      return;
    }

    setEditSaving(true);

    updateComment(projectId, ticketId, comment.id, {body: trimmed})
      .then((result) => {
        if (result.success) {
          setEditingId(null);
          refetch();
        }
      })
      .finally(() => setEditSaving(false));
  };

  const handleDelete = (comment: Comment) => {
    setDeletingId(comment.id);

    deleteComment(projectId, ticketId, comment.id)
      .then((result) => {
        if (result.success) {
          refetch();
        }
      })
      .finally(() => setDeletingId(null));
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-foreground">Comments</p>

      <Surface className="flex flex-col gap-2 p-3">
        <MarkdownEditor
          value={body}
          onChange={setBody}
          placeholder="Write a comment…"
          className="h-48"
          imagePicker={(onSelect) => (
            <AttachmentMediaPicker basePath={attachmentBasePath} label="Ticket attachments" onSelect={onSelect} />
          )}
        />

        <div className="flex justify-end">
          <Button size="sm" leftIcon={<Send className="h-4 w-4" />} onClick={handlePost} loading={posting} disabled={!body.trim()}>
            Post
          </Button>
        </div>
      </Surface>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {comments.map((comment) =>
            editingId === comment.id ? (
              <Surface key={comment.id} accent className="flex flex-col gap-2 px-3 py-2">
                <MarkdownEditor
                  value={editBody}
                  onChange={setEditBody}
                  className="h-40"
                  imagePicker={(onSelect) => (
                    <AttachmentMediaPicker basePath={attachmentBasePath} label="Ticket attachments" onSelect={onSelect} />
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                  <Button size="sm" leftIcon={<Check className="h-4 w-4" />} onClick={() => handleSaveEdit(comment)} loading={editSaving}>
                    Save
                  </Button>
                </div>
              </Surface>
            ) : (
              <Surface
                key={comment.id}
                id={`comment-${comment.id}`}
                className={cn(
                  'flex flex-col gap-1.5 px-3 py-2 text-sm transition-colors duration-500',
                  comment.id === highlightedCommentId && 'border-accent bg-accent/10',
                )}
              >
                <MarkdownPreview source={comment.body} />

                <div className="flex items-center gap-2">
                  <UserChip userId={comment.authorId} />
                  <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{formatTimestamp(comment.createdAt)}</span>

                  <Button
                    variant="ghost"
                    size="icon"
                    disableRipple
                    onClick={() => startEdit(comment)}
                    className="h-6 w-6 min-w-0 shrink-0 rounded-md text-muted-foreground hover:bg-muted hover:text-accent"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    disableRipple
                    leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                    onClick={() => handleDelete(comment)}
                    loading={deletingId === comment.id}
                    className="h-6 w-6 min-w-0 shrink-0 rounded-md text-muted-foreground hover:bg-muted hover:text-red-400"
                  />
                </div>
              </Surface>
            ),
          )}
        </div>
      )}
    </div>
  );
};

export default TicketCommentsSection;
