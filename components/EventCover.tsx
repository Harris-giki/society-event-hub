"use client";
import { softGradient } from "@/lib/utils";

export function EventCover({
  hue,
  emoji,
  height = 160,
  title,
  category,
}: {
  hue: string;
  emoji: string;
  height?: number;
  title?: string;
  category?: string;
}) {
  return (
    <div
      className="relative rounded-xl overflow-hidden border border-white/10"
      style={{
        height,
        background: softGradient(hue),
      }}
    >
      {/* Pattern overlay */}
      <svg
        className="absolute inset-0 w-full h-full opacity-25 mix-blend-overlay"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id={`pat-${hue}`} width="32" height="32" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="white" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#pat-${hue})`} />
      </svg>
      <div className="absolute top-3 left-3 chip chip-cyan backdrop-blur-md">
        {category}
      </div>
      <div
        className="absolute right-3 bottom-3 text-5xl"
        style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.45))" }}
      >
        {emoji}
      </div>
      {title && (
        <div className="absolute bottom-3 left-3 max-w-[70%] text-white font-display font-semibold text-lg leading-tight drop-shadow">
          {title}
        </div>
      )}
    </div>
  );
}
