import { Cpu } from 'lucide-react';

export default function AuthHeader({ subtitle }: { subtitle: string }) {
  return (
    <div className="mb-10 text-center">
      <Cpu className="mx-auto mb-4 h-10 w-10 text-cyan-300" />
      <h1 className="text-2xl font-semibold tracking-widest text-cyan-300">
        VantaCore
      </h1>
      <p className="mt-2 text-xs tracking-widest text-zinc-400">
        {subtitle}
      </p>
    </div>
  );
}