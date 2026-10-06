import {isAxiosError} from 'axios';
import type {CollectionResponse} from './Type/types';

type ApiErrorItem = {
  id: string;
  resource: {
    code: string;
    message: string;
    isBlocked: boolean;
  };
};

// Same CollectionResponse envelope every list/get endpoint uses, just
// carrying a validation/business-rule notification per item instead of a
// real resource - confirmed live on Sprint start/close, and again on
// Release save (2026-08-16).
export type ApiErrorResponse = CollectionResponse<ApiErrorItem>;

// Every mutation endpoint that rejects a request for a business-rule reason
// (not a generic 500/network failure) answers 422 with this same envelope,
// carrying the actual reason in data[0].resource.message (e.g. "A release
// with this version number already exists for this project"). This used to
// be re-derived ad hoc per hook - only useStartSprintHook/useCloseSprintHook
// actually surfaced it, every other *SaveFailedEvent dispatch across the
// app hardcoded a generic "please try again" regardless of what the backend
// said, and it kept coming back every time a new hook was added the same
// way. One place now: every hook's catch block should read
// `getApiErrorMessage(error, "<its own generic fallback>")` instead of
// inlining the 422/body-shape check itself.
export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (!isAxiosError(error) || error.response?.status !== 422) {
    return fallback;
  }

  const body = error.response.data as Partial<ApiErrorResponse> | undefined;
  return body?.data?.[0]?.resource?.message || fallback;
};
