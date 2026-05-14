"use client";
import { useStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Clock,
  XCircle,
  Sparkles,
  MessageSquare,
  Pencil,
  LogOut,
  CheckCircle2,
  Mail,
  Phone,
} from "lucide-react";
import { fmtRelative, fmtDate } from "@/lib/utils";
import { Avatar } from "./Avatar";
import { Modal } from "./Modal";
import { isAlphaOnly, isValidPkPhone, isGikiEmail } from "@/lib/types";
import { AlertCircle } from "lucide-react";

/**
 * Wraps organizer pages. If the current organizer's accountStatus is:
 *   - "approved" → renders children normally
 *   - "pending"  → shows the waiting-for-approval screen
 *   - "rejected" → shows the rejection screen with Resubmit / Chat options
 */
export function OrganizerStatusGate({ children }: { children: React.ReactNode }) {
  const user = useStore((s) => s.currentUser());
  if (!user || user.role !== "organizer") return <>{children}</>;
  const status = user.accountStatus ?? "approved";
  if (status === "approved") return <>{children}</>;
  if (status === "pending") return <PendingScreen />;
  return <RejectedScreen />;
}

function PendingScreen() {
  const user = useStore((s) => s.currentUser())!;
  const societies = useStore((s) => s.societies);
  const logout = useStore((s) => s.logout);
  const router = useRouter();

  const matching = societies.find(
    (s) => s.name.trim().toLowerCase() === (user.society ?? "").trim().toLowerCase()
  );
  const isNewSociety = !matching || matching.status === "pending";

  return (
    <div className="min-h-screen p-6 flex items-center justify-center">
      <div className="max-w-xl w-full">
        <div className="gradient-border-card p-8 text-center space-y-5">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-amber-500/15 grid place-items-center border border-amber-400/30">
            <Clock size={36} className="text-amber-300" />
          </div>
          <div>
            <div className="font-display text-2xl font-bold">Awaiting Dean approval</div>
            <div className="text-white/65 text-sm mt-2">
              Your organizer account application has been received.
              {isNewSociety
                ? " Because your society isn't in our registry yet, the Dean of Student Affairs needs to verify it before unlocking access."
                : " The Dean will review and approve your account shortly."}
            </div>
          </div>

          <div className="glass rounded-2xl p-4 text-left space-y-2.5">
            <div className="flex items-center gap-3">
              <Avatar name={user.name} seed={user.avatarSeed} size={44} />
              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm truncate">{user.name}</div>
                <div className="text-[11px] text-white/55 truncate">{user.email}</div>
              </div>
              <span className="chip chip-amber text-[10px]">pending</span>
            </div>
            <div className="divider" />
            <div className="text-xs space-y-1.5">
              <div className="flex items-center gap-2 text-white/65">
                <span className="text-white/45 w-20">Society</span>
                <span className="text-white">{user.society}</span>
              </div>
              {user.regNumber && (
                <div className="flex items-center gap-2 text-white/65">
                  <span className="text-white/45 w-20">Reg #</span>
                  <span className="text-white">{user.regNumber}</span>
                </div>
              )}
              {user.appliedAt && (
                <div className="flex items-center gap-2 text-white/65">
                  <span className="text-white/45 w-20">Applied</span>
                  <span className="text-white">{fmtRelative(user.appliedAt)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl p-3 bg-violet-500/10 border border-violet-400/30 text-xs text-violet-100 text-left flex items-start gap-2">
            <Sparkles size={14} className="text-violet-300 shrink-0 mt-0.5" />
            <span>
              <span className="font-semibold">What happens next:</span> the Dean will review
              your application and approve or reject it. You'll receive an in-app notification
              the moment a decision is made. You can leave this page open or check back later.
            </span>
          </div>

          <div className="flex gap-2 justify-center">
            <button
              onClick={() => { logout(); router.push("/login"); }}
              className="btn btn-secondary text-sm"
            >
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RejectedScreen() {
  const user = useStore((s) => s.currentUser())!;
  const admin = useStore((s) =>
    s.users.find((u) => u.role === "admin")
  );
  const chatMessages = useStore((s) =>
    s.chatMessages.filter(
      (m) => m.eventId === `account:${user.id}`
    )
  );
  const logout = useStore((s) => s.logout);
  const updateProfile = useStore((s) => s.updateProfile);
  const router = useRouter();

  const [showChat, setShowChat] = useState(false);
  const [showResubmit, setShowResubmit] = useState(false);

  const lastNote = chatMessages.find((m) => m.isRejectionNote)?.body ?? user.rejectionReason;

  function resubmit(updated: { name: string; society: string; phone: string }) {
    // Update the user with new details + reset status to pending
    const res = updateProfile(user.id, {
      name: updated.name,
      society: updated.society,
      phone: updated.phone,
      accountStatus: "pending",
      rejectionReason: undefined,
      appliedAt: new Date().toISOString(),
    });
    if (!res.ok) return;
    setShowResubmit(false);
  }

  return (
    <div className="min-h-screen p-6 flex items-center justify-center">
      <div className="max-w-xl w-full">
        <div className="gradient-border-card p-8 text-center space-y-5">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-rose-500/15 grid place-items-center border border-rose-400/30">
            <XCircle size={36} className="text-rose-300" />
          </div>
          <div>
            <div className="font-display text-2xl font-bold">Application rejected</div>
            <div className="text-white/65 text-sm mt-2">
              The Dean has declined your organizer application. You can resubmit with
              corrected details or open a chat to discuss directly.
            </div>
          </div>

          {lastNote && (
            <div className="rounded-xl p-4 bg-rose-500/10 border border-rose-400/30 text-left">
              <div className="text-[10px] uppercase tracking-wider text-rose-300 font-semibold mb-1.5">
                Dean's note
              </div>
              <div className="text-sm text-rose-100 leading-relaxed">{lastNote}</div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setShowResubmit(true)}
              className="btn btn-primary"
            >
              <Pencil size={15} /> Resubmit details
            </button>
            <button
              onClick={() => setShowChat(true)}
              className="btn btn-secondary"
            >
              <MessageSquare size={15} /> Chat with Dean
            </button>
          </div>

          <button
            onClick={() => { logout(); router.push("/login"); }}
            className="btn btn-ghost text-sm mx-auto"
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </div>

      <ResubmitModal
        open={showResubmit}
        onClose={() => setShowResubmit(false)}
        onSubmit={resubmit}
        user={user}
      />

      {admin && (
        <ChatWithDeanModal
          open={showChat}
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
  );
}

function ResubmitModal({
  open, onClose, onSubmit, user,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (u: { name: string; society: string; phone: string }) => void;
  user: any;
}) {
  const societies = useStore((s) => s.societies.filter((x) => x.status === "approved"));
  const [name, setName] = useState(user.name);
  const [society, setSociety] = useState(user.society ?? "");
  const [phone, setPhone] = useState(user.phone ?? "");
  const [errs, setErrs] = useState<Record<string, string>>({});

  function submit() {
    const e: Record<string, string> = {};
    if (!name.trim() || !isAlphaOnly(name)) e.name = "Letters only.";
    if (!society.trim()) e.society = "Society required.";
    if (phone && !isValidPkPhone(phone)) e.phone = "Valid PK phone required.";
    setErrs(e);
    if (Object.keys(e).length) return;
    onSubmit({ name: name.trim(), society: society.trim(), phone: phone.trim() });
  }

  return (
    <Modal open={open} onClose={onClose} title="Resubmit application">
      <div className="space-y-3">
        <div className="text-xs text-white/55">
          Update your details and resubmit. The Dean will review again.
        </div>
        <div className="field">
          <label className="field-label">Full name</label>
          <input
            className={`input ${errs.name ? "input-error" : ""}`}
            value={name}
            onChange={(e) => { if (isAlphaOnly(e.target.value)) setName(e.target.value); }}
          />
          {errs.name && (<div className="field-error"><AlertCircle size={12} />{errs.name}</div>)}
        </div>
        <div className="field">
          <label className="field-label">Society</label>
          <input
            className={`input ${errs.society ? "input-error" : ""}`}
            value={society}
            onChange={(e) => setSociety(e.target.value)}
            list="approved-societies"
            placeholder="Pick existing or type new"
          />
          <datalist id="approved-societies">
            {societies.map((s) => <option key={s.id} value={s.name} />)}
          </datalist>
          {errs.society && (<div className="field-error"><AlertCircle size={12} />{errs.society}</div>)}
          <div className="field-hint">
            Picking an existing approved society auto-approves your account. A new
            society name requires Dean re-approval.
          </div>
        </div>
        <div className="field">
          <label className="field-label">Phone</label>
          <input
            className={`input ${errs.phone ? "input-error" : ""}`}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+92 3XX XXXXXXX"
          />
          {errs.phone && (<div className="field-error"><AlertCircle size={12} />{errs.phone}</div>)}
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button onClick={submit} className="btn btn-primary"><CheckCircle2 size={14} />Resubmit</button>
        </div>
      </div>
    </Modal>
  );
}

function ChatWithDeanModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const user = useStore((s) => s.currentUser())!;
  const admin = useStore((s) => s.users.find((u) => u.role === "admin"));
  const messages = useStore((s) =>
    s.chatMessages
      .filter((m) => m.eventId === `account:${user.id}`)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
  );
  const send = useStore((s) => s.sendChat);
  const [text, setText] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !admin) return;
    send(`account:${user.id}`, admin.id, text);
    setText("");
  }

  if (!admin) return null;
  return (
    <Modal open={open} onClose={onClose} title="Chat with Dean" maxWidth="max-w-md">
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/8">
          <Avatar name={admin.name} seed={admin.avatarSeed} size={36} />
          <div>
            <div className="text-sm font-medium">{admin.name}</div>
            <div className="text-[11px] text-white/55">Dean of Student Affairs</div>
          </div>
        </div>
        <div className="max-h-[300px] overflow-y-auto space-y-2">
          {messages.length === 0 && (
            <div className="text-center text-xs text-white/45 py-6">
              No messages yet.
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
                  <div className="text-sm whitespace-pre-wrap break-words">{m.body}</div>
                  <div className="text-[10px] text-white/45 mt-1">
                    {fmtRelative(m.createdAt)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <form onSubmit={submit} className="flex gap-2">
          <input
            className="input flex-1"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message…"
          />
          <button type="submit" disabled={!text.trim()} className="btn btn-primary text-sm">
            Send
          </button>
        </form>
      </div>
    </Modal>
  );
}
