// Button.tsx
"use client";

import { type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { buttonVariants } from "./buttonVariants";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children">,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
  tint?: "none" | "blue" | "purple" | "rose" | "emerald" | "amber";
  /** Render as the passed child element instead of a <button> (Radix Slot). */
  asChild?: boolean;
  /** Disable the click ripple, e.g. inside dense tables/lists. */
  disableRipple?: boolean;
}

// ─── Tint map ─────────────────────────────────────────────────────────────────
// Exposed as CSS custom properties so consumers can override per-theme
// without touching the component (dark mode, white-label, etc.)

// csstype's Properties (what React.CSSProperties resolves to) has no index
// signature for custom properties, so `--*` keys need this intersection.
type CssVars = React.CSSProperties & Record<`--${string}`, string>;

const TINT_VARS: Record<NonNullable<ButtonProps["tint"]>, CssVars> = {
  none: {
    "--btn-bg":"rgba(255,255,255,0.12)",
    "--btn-border":"rgba(255,255,255,0.35)",
    "--btn-shadow":"rgba(255,255,255,0.08)",
    "--btn-shimmer":"rgba(255,255,255,0.6)",
  },
  blue: {
    "--btn-bg":"rgba(96,165,250,0.15)",
    "--btn-border":"rgba(147,197,253,0.40)",
    "--btn-shadow":"rgba(59,130,246,0.25)",
    "--btn-shimmer":"rgba(186,230,255,0.7)",
  },
  purple: {
    "--btn-bg":"rgba(167,139,250,0.15)",
    "--btn-border":"rgba(196,181,253,0.40)",
    "--btn-shadow":"rgba(139,92,246,0.25)",
    "--btn-shimmer":"rgba(233,213,255,0.7)",
  },
  rose: {
    "--btn-bg":"rgba(251,113,133,0.15)",
    "--btn-border":"rgba(253,164,175,0.40)",
    "--btn-shadow":"rgba(244,63,94,0.22)",
    "--btn-shimmer":"rgba(255,228,230,0.7)",
  },
  emerald: {
    "--btn-bg":"rgba(52,211,153,0.13)",
    "--btn-border":"rgba(110,231,183,0.38)",
    "--btn-shadow":"rgba(16,185,129,0.22)",
    "--btn-shimmer":"rgba(209,250,229,0.7)",
  },
  amber: {
    "--btn-bg":"rgba(251,191,36,0.13)",
    "--btn-border":"rgba(253,211,77,0.38)",
    "--btn-shadow":"rgba(245,158,11,0.22)",
    "--btn-shimmer":"rgba(254,243,199,0.7)",
  },
};

// ─── Cursor-tracked spotlight ──────────────────────────────────────────────
// Sets CSS custom properties directly on the DOM node instead of React state,
// so mousemove never triggers a re-render — the browser only has to repaint
// the background-position, which is GPU-accelerated. The element comes from
// `e.currentTarget` (always the button/Slot the handler is bound to), so no
// ref into the DOM node is needed - the forwarded ref goes straight through.

function usePointerGlow(enabled: boolean) {
  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (!enabled) return;
      const el = e.currentTarget;
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width; // 0..1
      const py = (e.clientY - rect.top) / rect.height; // 0..1
      el.style.setProperty("--mx", `${px * 100}%`);
      el.style.setProperty("--my", `${py * 100}%`);
    },
    [enabled]
  );

  const onMouseLeave = useCallback((e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.setProperty("--mx", `50%`);
    e.currentTarget.style.setProperty("--my", `50%`);
  }, []);

  return { onMouseMove, onMouseLeave };
}

// ─── Ripple ───────────────────────────────────────────────────────────────────
// Pure CSS keyframe ripple instead of a spring-animated motion.span per click:
// no JS animation loop running on the main thread, GC pressure only for the
// small array of {x,y,id}. Timeouts are tracked and cleared on unmount.

interface Ripple {
  x: number;
  y: number;
  id: number;
}

function useRipples(enabled: boolean) {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const timers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  useEffect(() => {
    const set = timers.current;
    return () => {
      set.forEach(clearTimeout);
      set.clear();
    };
  }, []);

  const addRipple = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (!enabled) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const id = Date.now() + Math.random();
      const ripple: Ripple = { x: e.clientX - rect.left, y: e.clientY - rect.top, id };
      setRipples((prev) => [...prev, ripple]);
      const t = setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
        timers.current.delete(t);
      }, 650);
      timers.current.add(t);
    },
    [enabled]
  );

  return { ripples, addRipple };
}

// ─── Component ────────────────────────────────────────────────────────────────

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "default",
      size = "default",
      className,
      loading,
      disabled,
      leftIcon,
      rightIcon,
      children,
      tint = "none",
      asChild = false,
      disableRipple = false,
      onClick,
      style,
      ...rest
    },
    ref
  ) => {
    const isGlass = variant === "glass" || variant === "liquidGlass";
    const { ripples, addRipple } = useRipples(!disableRipple);
    const { onMouseMove, onMouseLeave } = usePointerGlow(!disabled && !loading);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      addRipple(e);
      onClick?.(e);
    };

    // Slot (asChild) clones its props onto whatever single element the
    // caller passed in - it throws if given more than one child. Every
    // decorative extra below (spotlight, glass shine, ripple) is a sibling
    // span, and the icon/children/rightIcon composition is itself another
    // wrapping span, so none of that can coexist with Slot. asChild mode
    // skips all of it and passes `children` straight through untouched -
    // same convention as shadcn/Radix: compose icon + label yourself inside
    // the single child you hand to asChild (e.g.
    // `<Button asChild><Link to="...">…</Link></Button>`).
    if (asChild) {
      return (
        <Slot
          ref={ref as React.Ref<HTMLElement>}
          className={cn(buttonVariants({ variant, size }), "group/btn", className)}
          style={isGlass ? { ...TINT_VARS[tint], ...style } : style}
          onClick={handleClick}
          onMouseMove={onMouseMove}
          onMouseLeave={onMouseLeave}
          aria-busy={loading || undefined}
          {...(rest as React.HTMLAttributes<HTMLElement>)}
        >
          {children}
        </Slot>
      );
    }

    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), "group/btn", className)}
        style={isGlass ? { ...TINT_VARS[tint], ...style } : style}
        onClick={handleClick}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        disabled={loading || disabled}
        aria-busy={loading || undefined}
        {...rest}
      >
        {/* Cursor-tracked spotlight — the signature "ahead of its time" touch.
            Opacity-only transition on hover, position via CSS vars set in JS. */}
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0 rounded-[inherit] opacity-0",
            "transition-opacity duration-300 group-hover/btn:opacity-100",
            "motion-reduce:hidden",
            "[background:radial-gradient(180px_circle_at_var(--mx,50%)_var(--my,50%),rgba(255,255,255,0.25),transparent_70%)]"
          )}
        />

        {isGlass && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-[10%] top-0 h-px bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.8)_40%,rgba(255,255,255,0.9)_50%,rgba(255,255,255,0.8)_60%,transparent_100%)]"
          />
        )}

        {isGlass && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[linear-gradient(180deg,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0.04)_45%,transparent_100%)]"
          />
        )}

        {variant === "liquidGlass" && (
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute -top-1/5 -left-[40%] h-[140%] w-[60%]",
              "-skew-x-[15deg] bg-[linear-gradient(105deg,transparent_20%,rgba(255,255,255,0.22)_50%,transparent_80%)]",
              "opacity-0 transition-[opacity,transform] duration-500 ease-out translate-x-[-30%]",
              "group-hover/btn:opacity-100 group-hover/btn:translate-x-[100%]",
              "motion-reduce:hidden"
            )}
          />
        )}

        {!disableRipple && (
          <span aria-hidden="true" className="absolute inset-0 overflow-hidden rounded-[inherit]">
            {ripples.map((r) => (
              <span
                key={r.id}
                className="btn-ripple pointer-events-none absolute rounded-full"
                style={
                  {
                    //left: r.x,
                    //top: r.y,
                    background: isGlass ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.2)",
                  } as React.CSSProperties
                }
              />
            ))}
          </span>
        )}

        <span className="relative z-10 flex items-center gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : leftIcon}
          {children}
          {!loading && rightIcon}
        </span>
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };

/*
 * Dodaj raz, globalnie (np. w globals.css) — keyframe dla rippli.
 * `group/btn` jest już dodawany automatycznie do samego przycisku, więc
 * spotlight i sweep dla liquidGlass działają "out of the box".
 *
 * @keyframes btn-ripple {
 *   from { width: 0; height: 0; opacity: 0.5; transform: translate(-50%, -50%); }
 *   to   { width: 320px; height: 320px; opacity: 0; transform: translate(-50%, -50%); }
 * }
 * .btn-ripple {
 *   animation: btn-ripple 650ms ease-out forwards;
 * }
 * @media (prefers-reduced-motion: reduce) {
 *   .btn-ripple { animation-duration: 1ms; }
 * }
 */