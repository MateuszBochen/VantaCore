import type {Ref} from 'react';
import {ArrowLeft, ChevronRight} from 'lucide-react';
import useAppTheme from '@/lib/Theme/useAppTheme';
import type {MenuLevel} from './types';

const FACE_ANGLES = [0, 90, 180, 270];

type Props = {
  level: MenuLevel | null;
  physicalIndex: number;
  isCurrent: boolean;
  showBack: boolean;
  onSelect: (index: number) => void;
  onBack: () => void;
  backButtonRef?: Ref<HTMLButtonElement>;
};

const PrismFace = ({level, physicalIndex, isCurrent, showBack, onSelect, onBack, backButtonRef}: Props) => {
  // The neon glow/gradient treatment below is Neon Blaster's own visual
  // identity (same reasoning as Background.tsx's radial glow) - Light/Dark
  // get a flat, token-driven equivalent instead of a toned-down glow, same
  // as everywhere else in the theme system.
  const {theme} = useAppTheme();
  const isNeon = theme === 'neon-blaster';

  return (
    <div
      className={`absolute inset-0 flex flex-col [backface-visibility:hidden] ${
        isNeon ? 'bg-gradient-to-b from-cyan-500/[0.04] via-transparent to-fuchsia-500/[0.04]' : ''
      } ${!isCurrent ? 'pointer-events-none' : ''}`}
      style={{
        transform: `rotateY(${FACE_ANGLES[physicalIndex]}deg) translateZ(calc(var(--face-width, 260px) / 2))`,
      }}
      aria-hidden={!isCurrent}
      inert={!isCurrent || undefined}
    >
      {level && (
        <>
          <ul className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-3">
            {level.items.map((item, index) => (
              <li key={item.label}>
                <button
                  type="button"
                  tabIndex={isCurrent ? 0 : -1}
                  onClick={() => onSelect(index)}
                  className={`group flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm backdrop-blur-sm transition-all duration-200 ${
                    item.active
                      ? isNeon
                        ? 'border-cyan-400/40 bg-gradient-to-r from-cyan-400/15 via-cyan-400/5 to-fuchsia-500/10 text-cyan-300 shadow-[0_0_20px_-6px_rgba(34,211,238,0.5)]'
                        : 'border-accent/40 bg-accent/10 text-accent'
                      : isNeon
                        ? 'border-white/5 bg-white/[0.02] text-zinc-300 hover:border-cyan-400/20 hover:bg-white/[0.06] hover:text-zinc-100 hover:shadow-[0_0_16px_-8px_rgba(34,211,238,0.4)]'
                        : 'border-border bg-card text-muted-foreground hover:border-accent/30 hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className={`h-1.5 w-1.5 flex-shrink-0 rounded-full transition-colors ${
                        item.active
                          ? isNeon
                            ? 'bg-cyan-300 shadow-[0_0_8px_1px_rgba(34,211,238,0.8)]'
                            : 'bg-accent'
                          : isNeon
                            ? 'bg-zinc-600 group-hover:bg-cyan-400/60'
                            : 'bg-muted-foreground/40 group-hover:bg-accent/60'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.subMenu && (
                    <ChevronRight
                      className={`h-4 w-4 flex-shrink-0 transition-transform group-hover:translate-x-0.5 ${
                        item.active
                          ? isNeon
                            ? 'text-cyan-300'
                            : 'text-accent'
                          : isNeon
                            ? 'text-zinc-600 group-hover:text-cyan-400/70'
                            : 'text-muted-foreground group-hover:text-accent/70'
                      }`}
                    />
                  )}
                </button>
              </li>
            ))}
            {showBack && (
              <li className="mt-2 border-t border-border pt-2">
                <button
                  ref={isCurrent ? backButtonRef : undefined}
                  type="button"
                  tabIndex={isCurrent ? 0 : -1}
                  onClick={onBack}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:text-accent"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Wstecz
                </button>
              </li>
            )}
          </ul>
          {level.content && <div className="flex-none px-3">{level.content}</div>}
          {level.footer && <div className="flex-none border-t border-border p-3">{level.footer}</div>}
        </>
      )}
    </div>
  );
};

export default PrismFace;
