import {useEffect, useRef} from 'react';

// Same pointerdown-outside + Escape convention UserBadge's own notification/
// account dropdowns already used - extracted here so every small hand-rolled
// popover (MarkdownEditor's Toolbar Link/Image/Table buttons, and whatever
// comes after) gets "click anywhere else closes it" for free, instead of
// only ever closing via the same toggle button that opened it.
const useClickOutside = <T extends HTMLElement>(open: boolean, onClose: () => void) => {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  return ref;
};

export default useClickOutside;
