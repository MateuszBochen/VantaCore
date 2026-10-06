import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

type AuthCardState = 'idle' | 'scanning' | 'error' | 'success';

type AuthCardProps = {
  children: ReactNode;
  state?: AuthCardState;
  // false = render already in place (see AuthLoadingScreen, which takes over
  // from a card that's already on screen).
  animateIn?: boolean;
};

export default function AuthCard({ children, state, animateIn = true }: AuthCardProps) {
  return (<>
      <motion.div
        initial={animateIn ? { opacity: 0, scale: 0.8 } : false}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className={`relative w-full max-w-md rounded-2xl border bg-white/10 backdrop-blur-2xl p-10 shadow-[0_0_160px_rgba(0,255,255,0.35)] ${
          state === "error" ? "border-red-500 animate-[shake_0.4s]" : "border-white/20"
        }`}
      >
        <div className="pointer-events-none absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-400/40 via-fuchsia-500/40 to-cyan-400/40 blur-xl" />
        <div className="relative">{children}</div>
      </motion.div>
      {/* GLITCH ANIMATION */}
      <style>{`
        @keyframes shake {
          0% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          50% { transform: translateX(6px); }
          75% { transform: translateX(-6px); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}