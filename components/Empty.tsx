"use client";

export function Empty({
  icon = "🪄",
  title,
  body,
  action,
}: {
  icon?: string;
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="glass rounded-2xl p-10 text-center flex flex-col items-center gap-3 animate-fadeIn">
      <div className="text-5xl">{icon}</div>
      <div className="font-display text-lg font-semibold">{title}</div>
      {body && <div className="text-sm text-white/60 max-w-md">{body}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
