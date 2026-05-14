"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { AlertCircle, Mail, UserPlus, X } from "lucide-react";
import { isGikiEmail } from "@/lib/types";
import { fmtRelative } from "@/lib/utils";

export function SubOrganizerPanel({ eventId }: { eventId: string }) {
  const event = useStore((s) => s.events.find((e) => e.id === eventId));
  const invitations = useStore((s) =>
    s.invitations.filter((i) => i.eventId === eventId)
  );
  const users = useStore((s) => s.users);
  const invite = useStore((s) => s.inviteSubOrganizer);
  const removeSub = useStore((s) => s.removeSubOrganizer);

  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");

  if (!event) return null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!email.trim()) {
      setErr("Enter a @giki.edu.pk email.");
      return;
    }
    if (!isGikiEmail(email)) {
      setErr("Sub-organizers must use a @giki.edu.pk address.");
      return;
    }
    const res = invite(eventId, email);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    setEmail("");
  }

  const emails = event.subOrganizerEmails ?? [];

  return (
    <div className="glass rounded-2xl p-5 space-y-4">
      <div className="font-display font-semibold flex items-center gap-2">
        <UserPlus size={16} /> Sub-organizers (volunteers / core team)
      </div>
      <div className="text-xs text-white/55">
        Invite a society member to help scan tickets at the door. They must use a
        @giki.edu.pk email — if they don't have an account yet, they'll get access
        automatically once they sign up.
      </div>

      <form onSubmit={submit} className="flex gap-2">
        <input
          className={`input flex-1 ${err ? "input-error" : ""}`}
          value={email}
          onChange={(e) => { setEmail(e.target.value); setErr(""); }}
          placeholder="volunteer@giki.edu.pk"
          type="email"
        />
        <button type="submit" className="btn btn-primary text-sm">
          <Mail size={14} /> Invite
        </button>
      </form>
      {err && (
        <div className="text-xs text-rose-300 flex items-center gap-1.5">
          <AlertCircle size={12} /> {err}
        </div>
      )}

      {emails.length === 0 ? (
        <div className="text-xs text-white/45 text-center py-3">
          No sub-organizers yet for this event.
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {emails.map((em) => {
            const u = users.find(
              (x) => x.email.toLowerCase() === em.toLowerCase()
            );
            const inv = invitations.find(
              (i) => i.email.toLowerCase() === em.toLowerCase()
            );
            return (
              <div
                key={em}
                className="rounded-xl p-2.5 bg-white/[0.03] border border-white/8 flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 grid place-items-center text-xs font-bold shrink-0">
                  {(u?.name ?? em).split(/[\s@.]/)[0].slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">
                    {u?.name ?? em}
                  </div>
                  <div className="text-[11px] text-white/55 truncate">
                    {em}
                  </div>
                </div>
                <span
                  className={`chip text-[10px] ${
                    inv?.status === "accepted"
                      ? "chip-emerald"
                      : "chip-amber"
                  }`}
                >
                  {inv?.status === "accepted" ? "active" : "pending sign-up"}
                </span>
                <button
                  onClick={() => removeSub(eventId, em)}
                  className="p-1.5 rounded-md hover:bg-rose-500/10 text-white/55 hover:text-rose-300 transition shrink-0"
                  aria-label="Remove"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
