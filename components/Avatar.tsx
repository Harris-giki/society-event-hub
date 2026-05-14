"use client";
import { initials } from "@/lib/utils";

export function Avatar({
  name,
  seed,
  size = 36,
}: {
  name: string;
  seed?: string;
  size?: number;
}) {
  const s = seed ?? name;
  // generate a stable gradient from seed
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  const hue = hash % 360;
  return (
    <div
      className="rounded-full grid place-items-center font-semibold text-white shrink-0 border border-white/20"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: `linear-gradient(135deg, hsl(${hue},80%,55%), hsl(${(hue + 60) % 360},85%,55%))`,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2)",
      }}
      title={name}
    >
      {initials(name)}
    </div>
  );
}
