// Shared by AttachmentImage.tsx and AttachmentVideo.tsx's dblclick handlers -
// builds a fullscreen backdrop appended straight to document.body (so it's
// never clipped by an overflow:auto ancestor - the editor's own scroll
// container, a Popup window, ...) with whatever element `buildContent`
// returns inside it. Closes on Escape or a click that lands on the backdrop
// itself - checking `event.target === overlay` (not just any click bubbling
// up) matters for video, whose native <video controls> play/scrub buttons
// live INSIDE the overlay and must stay clickable without closing it.
export const openAttachmentLightbox = (buildContent: () => HTMLElement): void => {
  const overlay = document.createElement('div');
  overlay.className = 'attachment-image-lightbox';
  overlay.appendChild(buildContent());

  const close = () => {
    overlay.remove();
    window.removeEventListener('keydown', handleKeyDown);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      close();
    }
  };

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      close();
    }
  });

  window.addEventListener('keydown', handleKeyDown);
  document.body.appendChild(overlay);
};
