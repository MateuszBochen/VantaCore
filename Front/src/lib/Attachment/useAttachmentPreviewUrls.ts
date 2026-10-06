import {useEffect, useRef, useState} from 'react';
import useGetAttachmentBlobHook from './useGetAttachmentBlobHook';
import type {Attachment} from './Type/types';

// Lazily fetches and caches a blob object URL per image attachment id - at
// most once per id for the caller's lifetime (fetchedIdsRef), since every
// byte has to come through the authenticated download endpoint (see
// useGetAttachmentBlobHook) rather than a plain <img src>. Shared by
// AttachmentsSection's row thumbnails and the MarkdownEditor image picker's
// browse grid - both need the exact same "one blob per id, revoke on
// unmount" handling.
const useAttachmentPreviewUrls = (basePath: string, attachments: Attachment[]): Record<string, string> => {
  const {getAttachmentBlob} = useGetAttachmentBlobHook();
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const previewUrlsRef = useRef(previewUrls);
  const fetchedIdsRef = useRef(new Set<string>());

  useEffect(() => {
    previewUrlsRef.current = previewUrls;
  }, [previewUrls]);

  // Revokes every object URL on unmount - reads the ref rather than
  // `previewUrls` so this only needs to run once.
  useEffect(() => {
    return () => {
      Object.values(previewUrlsRef.current).forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  useEffect(() => {
    attachments
      // contentType can be null (e.g. imported attachments) - no type, no thumbnail.
      .filter((attachment) => (attachment.contentType ?? '').startsWith('image/') && !fetchedIdsRef.current.has(attachment.id))
      .forEach((attachment) => {
        fetchedIdsRef.current.add(attachment.id);

        getAttachmentBlob(basePath, attachment.id).then((result) => {
          if (result.success) {
            setPreviewUrls((current) => ({...current, [attachment.id]: URL.createObjectURL(result.blob)}));
          }
        });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getAttachmentBlob is a thin useRequestHook wrapper recreated every render
  }, [attachments, basePath]);

  return previewUrls;
};

export default useAttachmentPreviewUrls;
