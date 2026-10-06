import {getAttachmentBlob} from './getAttachmentBlob';

export type {GetAttachmentBlobResult} from './getAttachmentBlob';

// Thin hook wrapper around getAttachmentBlob (see there for why the actual
// logic lives in a plain function instead of here) - the app-wide
// convention every other React-component call site expects.
const useGetAttachmentBlobHook = () => {
  return {getAttachmentBlob};
};

export default useGetAttachmentBlobHook;
