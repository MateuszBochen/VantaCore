import {createRoot} from 'react-dom/client';
import ImageLightbox from '@/components/Attachment/ImageLightbox';

// handleAttachmentDoubleClick runs from ProseMirror, outside any React tree
// - so this mounts its own root on a node appended to document.body (never
// clipped by the editor's overflow:auto container or a Popup window) and
// tears it down on close. Images only: AttachmentVideo still uses the plain
// openAttachmentLightbox, a <video> has nothing to zoom.
export const openImageLightbox = (src: string, alt: string): void => {
  // The editor keeps focus otherwise, and ZoomableImage's +/-/0 shortcuts
  // would also type into the document underneath.
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }

  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);

  const close = () => {
    root.unmount();
    host.remove();
  };

  root.render(<ImageLightbox src={src} alt={alt} onClose={close} />);
};
