"use client";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { Avatar } from "./Avatar";
import { MessageSquare, Send } from "lucide-react";
import { fmtRelative } from "@/lib/utils";

/**
 * EventChat — thread tied to a specific event between organizer and admin.
 * - Organizer view: shows messages, can reply
 * - Admin view: shows messages, can reply
 */
export function EventChat({ eventId }: { eventId: string }) {
  const user = useStore((s) => s.currentUser());
  const event = useStore((s) => s.events.find((e) => e.id === eventId));
  const users = useStore((s) => s.users);
  const messages = useStore((s) =>
    s.chatMessages
      .filter((m) => m.eventId === eventId)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
  );
  const send = useStore((s) => s.sendChat);
  const markRead = useStore((s) => s.markChatRead);

  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Counterpart resolution
  if (!user || !event) return null;
  const counterpart =
    user.role === "organizer"
      ? users.find((u) => u.role === "admin")
      : user.role === "admin"
      ? users.find((u) => u.id === event.organizerId)
      : null;

  // Mark incoming messages read on view
  useEffect(() => {
    if (counterpart) {
      markRead(eventId, counterpart.id, user.id);
    }
    // scroll to bottom
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, counterpart?.id, eventId, user.id, markRead]);

  if (!counterpart) return null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !counterpart) return;
    send(eventId, counterpart.id, text);
    setText("");
  }

  return (
    <div className="glass rounded-2xl flex flex-col" style={{ minHeight: 320 }}>
      <div className="p-4 border-b border-white/8 flex items-center gap-3">
        <Avatar name={counterpart.name} seed={counterpart.avatarSeed} size={36} />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium truncate">{counterpart.name}</div>
          <div className="text-[11px] text-white/55 truncate">
            {counterpart.role === "admin"
              ? "Dean of Student Affairs"
              : counterpart.society ?? "Organizer"}
          </div>
        </div>
        <MessageSquare size={16} className="text-fuchsia-300" />
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[400px]"
      >
        {messages.length === 0 && (
          <div className="text-center text-xs text-white/45 py-6">
            No messages yet. Send the first one!
          </div>
        )}
        {messages.map((m) => {
          const mine = m.fromUserId === user.id;
          return (
            <div
              key={m.id}
              className={`flex ${mine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2 ${
                  mine
                    ? "bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 border border-fuchsia-400/30"
                    : "bg-white/[0.06] border border-white/10"
                } ${m.isRejectionNote ? "ring-1 ring-rose-400/30" : ""}`}
              >
                {m.isRejectionNote && (
                  <div className="text-[10px] uppercase tracking-wider text-rose-300 mb-1 font-semibold">
                    Rejection note
                  </div>
                )}
                <div className="text-sm whitespace-pre-wrap break-words">
                  {m.body}
                </div>
                <div className="text-[10px] text-white/45 mt-1">
                  {fmtRelative(m.createdAt)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <form
        onSubmit={submit}
        className="p-3 border-t border-white/8 flex gap-2"
      >
        <input
          className="input flex-1"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Message ${counterpart.name.split(" ")[0]}…`}
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="btn btn-primary"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}
