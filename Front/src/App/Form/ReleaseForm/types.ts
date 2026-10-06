import type {ReactNode} from 'react';
import type {Flag, IssueType, Status} from '@/lib/Project/Type/types';
import type {ReleaseTicket} from '@/lib/Release/Type/types';

// Same fields as SaveReleasePayload - the form's values ARE the PUT body.
export interface ReleaseFormData {
  versionNumber: string;
  name: string;
  status: string;
  plannedReleaseDate: string;
  afterCarePeriod: string;
  ticketIds: string[];
}

export interface ReleaseFormRef {
  submit: () => void;
  setFieldErrors: (errors: {field: string; message: string}[]) => void;
}

export interface ReleaseFormProps {
  lockForm: boolean;
  initialValues: ReleaseFormData;
  onSubmit: (data: ReleaseFormData) => void;
  // Rendered at the end of the fields row (ReleaseCard's Cancel/Save) - the
  // buttons stay the card's, they submit through the ref like LoginForm's.
  actions?: ReactNode;
  projectId: string;
  // Everything the tickets section can show a ticket by - the release's own
  // tickets merged with the project's root list (see ReleaseCard).
  ticketDetailsById: Map<string, ReleaseTicket>;
  issueTypes: IssueType[];
  statuses: Status[];
  flags: Flag[];
}
