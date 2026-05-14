"use client";
import { useState, useEffect, useRef } from "react";
import { Bell, Check, CheckCheck } from "lucide-react";
import { useStore } from "@/lib/store";
import { fmtRelative } from "@/lib/utils";
import Link from "next/link";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const user = useStore((s) => s.currentUser());
  const notifs = useStore((s) =>
    s.notifications.filter((n) => n.userId === user?.id)
  );
  const markRead = useStore((s) => s.markNotificationRead);
  const markAll = useStore((s) => s.markAllNotificationsRead);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  if (!user) return null;
  const unread = notifs.filter((n) => !n.read).length;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2.5 rounded-xl hover:bg-white/10 transition"
        aria-label="Notifications"
      >
        <Bell size={18} className="text-white/80" />
        {unread > 0 && (
          <>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-fuchsia-400" />
            <span className="absolute top-1 right-1 w-3 h-3 rounded-full bg-fuchsia-400/60 animate-pulseRing" />
          </>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-[380px] max-w-[92vw] popover-panel rounded-2xl p-3 z-50 max-h-[70vh] overflow-y-auto animate-slideUp">
          <div className="flex items-center justify-between px-2 py-1.5">
            <div className="font-semibold flex items-center gap-2">
              Notifications
              {unread > 0 && (
                <span className="chip chip-violet text-[10px]">{unread} new</span>
              )}
            </div>
            {unread > 0 && (
              <button
                onClick={() => markAll(user.id)}
                className="btn-ghost text-xs flex items-center gap-1 px-2 py-1 rounded-md"
              >
                <CheckCheck size={14} /> Mark all
              </button>
            )}
          </div>
          <div className="divider my-1" />
          {notifs.length === 0 && (
            <div className="text-center py-8 text-white/50 text-sm">
              No notifications yet
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            {notifs.slice(0, 25).map((n) => {
              const inner = (
                <div
                  className={`p-2.5 rounded-xl hover:bg-white/5 transition cursor-pointer ${
                    !n.read ? "bg-white/[0.04]" : ""
                  }`}
                  onClick={() => markRead(n.id)}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="text-2xl shrink-0 leading-none">{n.icon ?? "🔔"}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate flex items-center gap-2">
                        {n.title}
                        {!n.read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400" />
                        )}
                      </div>
                      <div className="text-xs text-white/65 mt-0.5">{n.body}</div>
                      <div className="text-[10px] text-white/40 mt-1">
                        {fmtRelative(n.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              );
              return n.link ? (
                <Link key={n.id} href={n.link} onClick={() => setOpen(false)}>
                  {inner}
                </Link>
              ) : (
                <div key={n.id}>{inner}</div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
