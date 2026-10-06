import {useEffect, useRef} from 'react';

export const useFaceWidth = <T extends HTMLElement>() => {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) {
        element.style.setProperty('--face-width', `${width}px`);
      }
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return ref;
};
