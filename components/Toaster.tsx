"use client";
import { useStore } from "@/lib/store";
import { Check, AlertTriangle, Info, X, ShieldAlert } from "lucide-react";

const toneStyles: Record<string, { icon: any; bar: string; cls: string }> = {
  success: { icon: Check, bar: "bg-emerald-400", cls: "text-emerald-300" },
  info: { icon: Info, bar: "bg-violet-400", cls: "text-violet-300" },
  warn: { icon: AlertTriangle, bar: "bg-amber-400", cls: "text-amber-300" },
  danger: { icon: ShieldAlert, bar: "bg-rose-400", cls: "text-rose-300" },
};

export function Toaster() {
  const toasts = useStore((s) => s.toasts);
  const dismiss = useStore((s) => s.dismissToast);

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-3 max-w-sm">
      {toasts.map((t) => {
        const T = toneStyles[t.tone] ?? toneStyles.info;
        const Icon = T.icon;
        return (
          <div
            key={t.id}
            className="glass-strong rounded-2xl p-4 pr-9 relative toast-pop overflow-hidden min-w-[280px]"
          >
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${T.bar}`} />
            <div className="flex items-start gap-3">
              <div className={`rounded-lg p-2 bg-white/5 ${T.cls}`}>
                <Icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">{t.title}</div>
                {t.body && (
                  <div className="text-xs text-white/70 mt-0.5">{t.body}</div>
                )}
              </div>
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="absolute top-2 right-2 p-1 rounded-md hover:bg-white/10 text-white/60"
              aria-label="Close"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
