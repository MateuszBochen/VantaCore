import type {CollectionResponse} from '@/lib/Request/Type/types';

// One (or several, via the `userIds` filter) users' logged sessions,
// spanning every project - unlike Ticket/Type/types.ts's WorklogEntry (one
// ticket's own entries), this carries the owning ticket+project so a
// cross-project calendar can group/link/log against any of them.
// `actorId` matters once `userIds` selects more than the current user -
// MyWorklogPage uses it to label whose entry is whose and to only allow
// deleting your own (same "actorId" flattening convention as WorklogEntry).
export type MyWorklogEntry = {
  id: string;
  minutes: number;
  // Zoneless local datetime string ("yyyy-MM-ddTHH:mm:ss", was date-only) -
  // the entry's actual start time, now that the backend tracks it. Wire key
  // is still `date` (see MyWorklogEntryResponseItem below / the hook that
  // maps it) - only renamed here, at the parsed app-model level, since it no
  // longer holds just a date. See dateRange.ts's local-time helpers for
  // deriving a calendar day / minutes-since-midnight / etc. from this.
  dateTime: string;
  note: string;
  actorId: string;
  ticket: {id: string; key: string; title: string};
  project: {id: string; name: string};
};

export type MyWorklogEntryResponseItem = {
  id: string;
  resource: {
    id: string;
    minutes: number;
    // Wire field name confirmed against the Api project's MyWorklogResult
    // record - stayed `date` even though the Java type moved from LocalDate
    // to LocalDateTime.
    date: string;
    note: string;
    actor: {id: string};
    ticket: {id: string; key: string; title: string};
    project: {id: string; name: string};
  };
};

export type ListMyWorklogResponse = CollectionResponse<MyWorklogEntryResponseItem>;

export type ListMyWorklogResult =
  | {success: true; entries: MyWorklogEntry[]}
  | {success: false};
