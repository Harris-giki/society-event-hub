"use client";
import { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import {
  ScanLine,
  CheckCircle2,
  XCircle,
  ClipboardPaste,
  RotateCcw,
  Hash,
  Sparkles,
  ShieldCheck,
  Ticket as TicketIcon,
} from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { fmtDate } from "@/lib/utils";
import { CameraQRScanner } from "@/components/CameraQRScanner";

type ScanResult =
  | { ok: true; ticket: any; event: any; user: any; at: string }
  | { ok: false; error: string; at: string };

export default function ScannerPage() {
  const user = useStore((s) => s.currentUser())!;
  const tickets = useStore((s) => s.tickets);
  const events = useStore((s) => s.events);
  const users = useStore((s) => s.users);
  const scan = useStore((s) => s.scanTicket);

  const [manual, setManual] = useState("");
  const [latest, setLatest] = useState<ScanResult | null>(null);
  const [history, setHistory] = useState<ScanResult[]>([]);
  const [paused, setPaused] = useState(false);

  const myScannableEvents = useMemo(() => {
    return events.filter((e) => {
      if (e.organizerId === user.id) return true;
      if (
        e.subOrganizerEmails?.some(
          (em) => em.toLowerCase() === user.email.toLowerCase()
        )
      )
        return true;
      return false;
    });
  }, [events, user.email, user.id]);

  const [selectedEventId, setSelectedEventId] = useState<string>(
    myScannableEvents[0]?.id ?? ""
  );

  const ticketsToScan = useMemo(() => {
    const eventIds = selectedEventId
      ? [selectedEventId]
      : myScannableEvents.map((e) => e.id);
    return tickets.filter(
      (t) => eventIds.includes(t.eventId) && t.status === "confirmed"
    );
  }, [tickets, selectedEventId, myScannableEvents]);

  function handleScan(code: string) {
    setPaused(true);
    const r = scan(code, user.id);
    const at = new Date().toISOString();
    const entry: ScanResult = r.ok
      ? { ok: true, ticket: r.ticket, event: r.event, user: r.user, at }
      : { ok: false, error: r.error, at };
    setLatest(entry);
    setHistory((h) => [entry, ...h].slice(0, 50));
    setTimeout(() => setPaused(false), 1500);
  }

  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      setManual(text);
    } catch {
      setLatest({
        ok: false,
        error: "Couldn't read clipboard. Paste manually.",
        at: new Date().toISOString(),
      });
    }
  }

  function submitManual() {
    if (!manual.trim()) return;
    handleScan(manual.trim());
    setManual("");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold flex items-center gap-2.5">
          <ScanLine size={26} /> Ticket Scanner
        </h1>
        <p className="text-white/55 text-sm mt-1">
          Validate QR codes with your camera, paste a payload, or type the short ticket
          code printed on the ticket.
        </p>
      </div>

      {myScannableEvents.length > 1 && (
        <div className="glass rounded-2xl p-3 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs text-white/55">
            <ShieldCheck size={14} /> Scanning for
          </div>
          <select
            className="select max-w-md"
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
          >
            <option value="">All events you're authorised for</option>
            {myScannableEvents.map((e) => {
              const owner = e.organizerId === user.id;
              return (
                <option key={e.id} value={e.id}>
                  {e.title}
                  {owner ? "" : " (sub-organizer)"} — {fmtDate(e.date, "d MMM")}
                </option>
              );
            })}
          </select>
        </div>
      )}

      {myScannableEvents.length === 0 && (
        <div className="glass rounded-2xl p-8 text-center">
          <div className="text-4xl mb-2">🤷</div>
          <div className="font-display text-lg font-semibold">No events to scan</div>
          <div className="text-sm text-white/55 mt-1">
            You're not the organizer or sub-organizer of any active event. Ask the
            organizer to invite your @giki.edu.pk email to scan.
          </div>
        </div>
      )}

      {myScannableEvents.length > 0 && (
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-6">
          <div className="gradient-border-card p-6 space-y-4">
            <CameraQRScanner onScan={handleScan} paused={paused} />

            <div className="space-y-2">
              <div className="text-xs text-white/55">
                Or enter ticket code manually:
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Hash
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
                  />
                  <input
                    className="input pl-9 font-mono text-xs uppercase"
                    value={manual}
                    onChange={(e) => setManual(e.target.value)}
                    placeholder="XXXX-XXXX or full QR payload"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && manual.trim()) submitManual();
                    }}
                  />
                </div>
                <button onClick={pasteFromClipboard} className="btn btn-secondary">
                  <ClipboardPaste size={14} /> Paste
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={submitManual}
                  disabled={!manual.trim()}
                  className="btn btn-primary flex-1"
                >
                  <ScanLine size={15} /> Validate manually
                </button>
                <button
                  onClick={() => { setManual(""); setLatest(null); }}
                  className="btn btn-secondary"
                >
                  <RotateCcw size={14} />
                </button>
              </div>
            </div>

            {latest && (
              <div
                className={`rounded-2xl p-4 border animate-slideUp ${
                  latest.ok
                    ? "bg-emerald-500/10 border-emerald-400/40"
                    : "bg-rose-500/10 border-rose-400/40"
                }`}
              >
                {latest.ok ? (
                  <div className="flex items-start gap-3">
                    <CheckCircle2 size={22} className="text-emerald-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-display font-semibold text-emerald-300">
                        Check-in successful
                      </div>
                      <div className="text-sm mt-0.5">
                        {latest.user.name} → {latest.event.title}
                      </div>
                      <div className="text-[11px] text-white/55 mt-0.5">
                        {fmtDate(latest.at, "h:mm:ss a")}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <XCircle size={22} className="text-rose-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-display font-semibold text-rose-300">
                        {latest.error}
                      </div>
                      <div className="text-[11px] text-white/55 mt-0.5">
                        {fmtDate(latest.at, "h:mm:ss a")}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-semibold flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-300" />
                  Verified this session
                </div>
                <span className="chip text-[10px]">
                  {history.filter((h) => h.ok).length}
                </span>
              </div>
              {history.filter((h) => h.ok).length === 0 ? (
                <div className="text-xs text-white/55 py-3 text-center">
                  Scans will appear here as you validate.
                </div>
              ) : (
                <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto pr-1">
                  {history.filter((h) => h.ok).map((h: any, i) => (
                    <div
                      key={i}
                      className="rounded-xl p-2.5 bg-emerald-500/8 border border-emerald-400/20 flex items-center gap-3"
                    >
                      <Avatar name={h.user.name} seed={h.user.avatarSeed} size={32} />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">
                          {h.user.name}
                        </div>
                        <div className="text-[11px] text-white/55 truncate">
                          {h.event.title}
                        </div>
                      </div>
                      <div className="text-[10px] text-emerald-300 font-mono shrink-0">
                        {fmtDate(h.at, "h:mm a")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="glass rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3 text-sm font-semibold">
                <Sparkles size={14} className="text-fuchsia-300" /> Quick-scan helper
                <span className="chip text-[10px] ml-auto">demo only</span>
              </div>
              <div className="text-[11px] text-white/55 mb-2">
                No QR handy? Tap any confirmed ticket below to simulate scanning it.
              </div>
              {ticketsToScan.length === 0 ? (
                <div className="text-xs text-white/55 py-3 text-center">
                  No confirmed tickets for the selected event(s).
                </div>
              ) : (
                <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto pr-1">
                  {ticketsToScan.map((t) => {
                    const ev = events.find((e) => e.id === t.eventId)!;
                    const u = users.find((x) => x.id === t.userId)!;
                    return (
                      <button
                        key={t.id}
                        onClick={() => handleScan(t.qrPayload)}
                        className="text-left rounded-xl p-2.5 hover:bg-white/8 flex items-center gap-3 border border-white/5 transition"
                      >
                        <Avatar name={u.name} seed={u.avatarSeed} size={32} />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">{u.name}</div>
                          <div className="text-[11px] text-white/55 truncate">
                            {ev.title} · <span className="font-mono">{t.ticketCode}</span>
                          </div>
                        </div>
                        <TicketIcon size={14} className="text-fuchsia-300 shrink-0" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {history.filter((h) => !h.ok).length > 0 && (
              <div className="glass rounded-2xl p-4">
                <div className="text-sm font-semibold mb-2 text-rose-300">
                  Rejections ({history.filter((h) => !h.ok).length})
                </div>
                <div className="flex flex-col gap-1 text-xs">
                  {history.filter((h) => !h.ok).slice(0, 6).map((h: any, i) => (
                    <div
                      key={i}
                      className="rounded-md px-2 py-1.5 bg-rose-500/8 border border-rose-400/15 flex items-center justify-between gap-2"
                    >
                      <span className="truncate text-white/80">{h.error}</span>
                      <span className="text-[10px] text-white/45 font-mono shrink-0">
                        {fmtDate(h.at, "h:mm a")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
