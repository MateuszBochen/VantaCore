import {useEffect, useId, useRef} from 'react';
import mermaid from 'mermaid';
import useAppTheme from '@/lib/Theme/useAppTheme';

type MermaidBlockProps = {
  code: string;
  // Reports whether the latest render produced a diagram - MermaidCodeBlockView
  // uses it to fall back to showing the source when there's nothing to see.
  onRenderResult?: (ok: boolean) => void;
};

// Mermaid bakes colors into the rendered SVG at render time (presentation
// attributes, not live CSS custom properties), so there's no way to just let
// the app's [data-theme='...'] cascade handle this the way every other
// component does - the current theme's resolved colors have to be read and
// handed to mermaid.initialize() before every render.
const readCssVar = (name: string): string => getComputedStyle(document.body).getPropertyValue(name).trim();

// react-markdown re-renders this on every keystroke in the source editor, but
// mermaid.render is async and keyed by a DOM id - a stale render landing after
// a newer one starts would flash outdated/broken output, so track "am I still
// the latest effect" and drop the result otherwise.
const MermaidBlock = ({code, onRenderResult}: MermaidBlockProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  // Ref, not an effect dependency - a parent's inline callback must not
  // re-run the (async, costly) mermaid render on every parent render.
  const onRenderResultRef = useRef(onRenderResult);

  useEffect(() => {
    onRenderResultRef.current = onRenderResult;
  }, [onRenderResult]);
  const renderId = useId().replace(/[^a-zA-Z0-9]/g, '');
  const {theme} = useAppTheme();

  useEffect(() => {
    let cancelled = false;

    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      theme: 'base',
      themeVariables: {
        background: readCssVar('--page-background'),
        primaryColor: readCssVar('--card'),
        primaryTextColor: readCssVar('--foreground'),
        primaryBorderColor: readCssVar('--border'),
        lineColor: readCssVar('--muted-foreground'),
        secondaryColor: readCssVar('--muted'),
        tertiaryColor: readCssVar('--muted'),
        textColor: readCssVar('--foreground'),
        mainBkg: readCssVar('--card'),
        nodeBorder: readCssVar('--border'),
        clusterBkg: readCssVar('--muted'),
        clusterBorder: readCssVar('--border'),
        edgeLabelBackground: readCssVar('--popover'),
      },
    });

    mermaid
      .render(`mermaid-${renderId}`, code)
      .then(({svg}) => {
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
          onRenderResultRef.current?.(true);
        }
      })
      .catch((error) => {
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = '';
          console.error('Mermaid render failed:', error);
          onRenderResultRef.current?.(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // theme is a real dependency here (unlike everywhere else CSS handles
    // it) - a picker switch needs to re-render every diagram with the newly
    // resolved colors, not just leave the old theme's SVG on screen.
  }, [code, renderId, theme]);

  return <div ref={containerRef} className="mermaid-block" />;
};

export default MermaidBlock;
