import {useState} from "react";
import {cn} from "@/lib/utils";
import resolveFileUrl from "@/lib/resolveFileUrl";

export type AvatarProps = {
  name: string;
  src?: string;
  className?: string;
};

// Small round avatar for user pickers - falls back to an initial when there's
// no avatarUrl, or it fails to load, rather than leaving a broken image icon.
function Avatar({name, src, className}: AvatarProps) {
  const [failed, setFailed] = useState(false);
  // Defensive against callers resolving a name from data that turned out
  // missing at runtime (e.g. an id with no match in the user directory) -
  // falls back to "?" instead of throwing.
  const initial = (name ?? "").trim().charAt(0).toUpperCase() || "?";

  if (src && !failed) {
    return (
      <img
        src={resolveFileUrl(src)}
        alt=""
        onError={() => setFailed(true)}
        className={cn("h-5 w-5 shrink-0 rounded-full object-cover", className)}
      />
    );
  }

  return (
    <span
      className={cn(
        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-medium text-zinc-300",
        className,
      )}
    >
      {initial}
    </span>
  );
}

export {Avatar};