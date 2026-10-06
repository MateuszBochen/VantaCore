import type {AxiosPromise, AxiosProgressEvent} from 'axios';

export enum RequestMethod {
  POST = 'post',
  GET = 'get',
  PUT = 'put',
  PATCH = 'patch',
  DELETE = 'delete',
}

export interface TypeRequestType<T> {
  type: RequestMethod;
  endpoint: string;
  query?: string[][] | Record<string, string> | string | URLSearchParams;
  data?:T;
  // Forwarded straight to axios - only meaningful for requests with a body
  // (uploads), lets callers like Uploader report per-file bytes-loaded
  // progress instead of just a pending/settled boolean.
  onUploadProgress?: (progressEvent: AxiosProgressEvent) => void;
  // Forwarded straight to axios - 'blob' is what useDownloadAttachmentHook
  // needs to pull down a file's bytes through an authenticated endpoint
  // (plain <a href> can't attach the Authorization header).
  responseType?: 'json' | 'blob' | 'text' | 'arraybuffer';
}

// The envelope every list/get endpoint in this app answers with (`data`
// items are raw resources, or {id, resource} - never wrapped in any other
// shell). This is what List*Response/`*ErrorResponse` types across the app
// were each redeclaring by hand before this existed - see
// getApiErrorMessage's own ApiErrorResponse for the same shape used for a
// 422 validation-error payload instead of a resource list.
export type CollectionResponse<T> = {
  meta: {
    page: number;
    limit: number;
    total: number;
  };
  data: T[];
};


export interface TypeUseRequestHook {
  request: <RequestDataObject, ResponseDataObject>(request: TypeRequestType<RequestDataObject>) => AxiosPromise<ResponseDataObject>;
}
