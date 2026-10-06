import { cva } from "class-variance-authority";

// Kept out of button.tsx so that file only exports the Button component
// (react-refresh/only-export-components) - button.tsx and types.ts both
// import this.
export const buttonVariants = cva(
  [
    "relative inline-flex items-center justify-center gap-2",
    "whitespace-nowrap rounded-2xl text-sm font-medium",
    "outline-none select-none overflow-hidden cursor-pointer",
    "disabled:pointer-events-none disabled:opacity-40",
    "focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
    // No movement on hover — only shadow/glow react. Only clicking gives a
    // small press-down feedback, nothing shifts position while idle.
    "transition-[box-shadow,filter,transform] duration-200 ease-out",
    "active:scale-[0.98] active:duration-100",
    "motion-reduce:transition-none motion-reduce:!scale-100",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-br from-(--brand-gradient-from) via-(--brand-gradient-via) to-(--brand-gradient-to) text-white shadow-lg hover:shadow-xl hover:shadow-violet-500/30",
        outline:
          "border border-border bg-background text-foreground hover:bg-muted",
        ghost: "text-foreground hover:bg-muted",
        glass:
          "border backdrop-blur-md backdrop-saturate-150 text-white/90 " +
          "[background:linear-gradient(135deg,rgba(255,255,255,0.18)_0%,var(--btn-bg)_100%)] " +
          "[border-color:var(--btn-border)] " +
          "shadow-[0_4px_24px_-4px_var(--btn-shadow),0_1px_0_0_rgba(255,255,255,0.45)_inset,0_-1px_0_0_rgba(0,0,0,0.08)_inset]",
        // "liquid" keeps the same glass look but WITHOUT the feTurbulence
        // distortion filter — that's the part that tanked perf. The shimmer
        // sweep on hover gives 95% of the visual payoff for ~5% of the cost.
        liquidGlass:
          "border backdrop-blur-md backdrop-saturate-150 text-white/90 " +
          "[background:radial-gradient(ellipse_at_30%_0%,var(--btn-shimmer)_0%,transparent_60%),linear-gradient(135deg,rgba(255,255,255,0.22)_0%,var(--btn-bg)_50%,rgba(0,0,0,0.04)_100%)] " +
          "[border-color:var(--btn-border)] " +
          "shadow-[0_4px_24px_-4px_var(--btn-shadow),0_1px_0_0_rgba(255,255,255,0.45)_inset,0_-1px_0_0_rgba(0,0,0,0.08)_inset]",
        destructive:
          "bg-destructive text-white shadow-md hover:bg-red-600 hover:shadow-red-500/30",
      },
      size: {
        sm: "h-8 px-3.5 text-xs",
        default: "h-10 px-5",
        lg: "h-12 px-7 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
