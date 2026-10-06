import {useEffect} from 'react';
import type {ReactNode} from 'react';
import useAppTheme from '../../lib/Theme/useAppTheme';

export interface BackgroundProps {
  children: ReactNode;
}

// Neon Blaster's radial glow + line grid is exclusive to that theme - Light/
// Dark get a flat --page-background instead (see index.css's own
// [data-theme='...'] blocks).
const Background = ({children}: BackgroundProps) => {
  const {theme} = useAppTheme();

  // Also mirrored onto document.body (not just this component's own root
  // div below) - Popup/TicketPopup render via createPortal straight to
  // document.body, which makes them DOM-tree SIBLINGS of this div, not
  // descendants. CSS custom properties only inherit down the real DOM tree,
  // so without this, every portaled popup silently fell back to the
  // unrelated shadcn :root defaults (found live: a Popup's "Submit" button
  // and its outline "History" button both rendered white-on-white). Scoped
  // to this component's own mount lifecycle (matching Panel's, since
  // Background wraps everything in it) - App.tsx unmounts the whole Panel
  // tree on logout, so the attribute (and thus this theme) never reaches
  // the separate, sibling Login router.
  useEffect(() => {
    document.body.dataset.theme = theme;

    return () => {
      delete document.body.dataset.theme;
    };
  }, [theme]);

  return (
    <div data-theme={theme} className="fixed inset-0 overflow-hidden bg-[var(--page-background)] text-foreground">
      {theme === 'neon-blaster' && (
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,var(--glow-a),transparent_55%),radial-gradient(circle_at_70%_70%,var(--glow-b),transparent_55%)]" />
          <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(90deg,var(--grid-a)_1px,transparent_1px),linear-gradient(0deg,var(--grid-b)_1px,transparent_1px)] [background-size:72px_72px]" />
        </div>
      )}

      {children}
    </div>
  );
};

export default Background;
