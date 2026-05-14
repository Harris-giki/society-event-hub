"use client";
import { useStore, useEventStats } from "@/lib/store";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { Modal } from "@/components/Modal";
import { SubOrganizerPanel } from "@/components/SubOrganizerPanel";
import { EventChat } from "@/components/EventChat";
import { EventSummary } from "@/components/EventSummary";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Mail,
  Phone,
  ScanLine,
  XCircle,
  AlertCircle,
  Download,
  Pencil,
  Trash2,
  Globe2,
  MessageSquare,
  RotateCcw,
} from "lucide-react";
import { fmtDate, fmtPKR, softGradient } from "@/lib/utils";
import { useState } from "react";

export default function OrgEventDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const event = useStore((s) => s.events.find((e) => e.id === params.id));
  const user = useStore((s) => s.currentUser())!;
  const tickets = useStore((s) =>
    s.tickets.filter((t) => t.eventId === params.id)
  );
  const users = useStore((s) => s.users);
  const chatMessages = useStore((s) =>
    s.chatMessages.filter((m) => m.eventId === params.id)
  );
  const stats = useEventStats(params.id);
  const cancelEvent = useStore((s) => s.cancelEvent);
  const deleteEvent = useStore((s) => s.deleteEvent);
  const resubmitEvent = useStore((s) => s.resubmitEvent);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showChat, setShowChat] = useState(false);

  if (!event || event.organizerId !== user.id) {
    return (
      <div className="glass rounded-2xl p-10 text-center">
        <div className="text-5xl mb-3">🤷</div>
        <div className="font-display text-xl font-semibold">Event not found</div>
        <Link href="/organizer/events" className="btn btn-primary mt-4">Back</Link>
      </div>
    );
  }

  const attendees = tickets.map((t) => ({
    ticket: t,
    user: users.find((u) => u.id === t.userId)!,
  }));

  const hasUnreadChat = chatMessages.some((m) => m.toUserId === user.id && !m.read);

  function exportCSV() {
    if (!event) return;
    const rows = [
      ["Ticket ID", "Name", "Email", "Reg #", "Status", "Method", "Amount", "Booked"],
      ...attendees.map(({ ticket, user }) => [
        ticket.id,
        user.name,
        user.email,
        user.regNumber ?? "",
        ticket.status,
        ticket.paymentMethod,
        ticket.amount.toString(),
        ticket.bookedAt,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const url = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = `${event.title}-attendees.csv`;
    a.click();
  }

  const canEdit = !["completed", "cancelled"].includes(event.status);
  const canDelete = ["cancelled", "rejected", "draft"].includes(event.status);
  const canCancel = !["completed", "cancelled"].includes(event.status);
  const canResubmit = event.status === "rejected";

  return (
    <div className="space-y-6">
      <button onClick={() => router.back()} className="btn btn-ghost text-sm -ml-3">
        <ArrowLeft size={14} /> Back
      </button>

      <div className="gradient-border-card overflow-hidden">
        <div
          className="h-56 relative"
          style={{
            background: event.posterUrl ? undefined : softGradient(event.coverHue),
          }}
        >
          {event.posterUrl && (
            <img
              src={event.posterUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          {event.posterUrl && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
          )}
          <div className="absolute inset-0 p-6 flex flex-col justify-end">
            <span className="chip chip-cyan w-fit backdrop-blur-md">{event.category}</span>
            <h1 className="font-display text-2xl sm:text-3xl font-bold mt-2 drop-shadow">
              {event.title}
            </h1>
          </div>
          {!event.posterUrl && (
            <div className="text-7xl absolute top-6 right-6 drop-shadow-lg opacity-90">
              {event.coverEmoji}
            </div>
          )}
          <span
            className={`chip absolute top-4 left-4 backdrop-blur-md ${
              event.status === "approved"
                ? "chip-emerald"
                : event.status === "pending"
                ? "chip-amber"
                : event.status === "rejected" || event.status === "cancelled"
                ? "chip-rose"
                : ""
            }`}
          >
            {event.status}
          </span>
          {event.allowNonGikian && (
            <span className="chip chip-cyan absolute top-4 right-4 backdrop-blur-md text-[10px]">
              <Globe2 size={10} /> Open to all
            </span>
          )}
        </div>

        <div className="p-6 grid lg:grid-cols-[2fr_1fr] gap-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Stat icon={<Calendar size={13} />} label="Date" value={fmtDate(event.date, "d MMM")} />
              <Stat icon={<Calendar size={13} />} label="Time" value={fmtDate(event.date, "h:mm a")} />
              <Stat icon={<MapPin size={13} />} label="Venue" value={event.venue} />
              <Stat icon={<Users size={13} />} label="Capacity" value={`${event.capacity}`} />
            </div>
            <p className="text-sm text-white/75 leading-relaxed">
              {event.longDescription ?? event.description}
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs text-white/70">
              <div>POC: <span className="text-white">{event.pocName} ({event.pocPhone})</span></div>
              <div>Faculty advisor: <span className="text-white">{event.facultyAdvisor}</span></div>
              <div>Budget: <span className="text-white">PKR {event.budget.toLocaleString()}</span></div>
              <div>Ticket: <span className="text-white">{fmtPKR(event.ticketPrice)}</span></div>
            </div>
            {event.rejectionReason && (
              <div className="rounded-xl p-3 bg-rose-500/10 border border-rose-400/30 text-xs text-rose-200 flex items-start gap-2">
                <AlertCircle size={14} className="text-rose-400 shrink-0 mt-0.5" />
                <span>
                  <span className="font-semibold">Rejection reason:</span>{" "}
                  {event.rejectionReason}
                </span>
              </div>
            )}
          </div>

          {/* live stats */}
          <div className="glass-strong rounded-2xl p-5 space-y-3 h-fit">
            <div className="font-display font-semibold flex items-center gap-2">
              📊 Live stats
            </div>
            <Row label="Booked" value={`${stats.sold} / ${event.capacity}`} />
            <Row label="Checked in" value={`${stats.scanned}`} />
            <Row label="Revenue" value={fmtPKR(stats.revenue)} />
            <div className="h-2 rounded-full bg-white/8 overflow-hidden">
              <div
                className="h-full"
                style={{
                  width: `${Math.min(100, (stats.sold / event.capacity) * 100)}%`,
                  background: "linear-gradient(90deg, #8b5cf6, #d946ef)",
                }}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              {event.status === "approved" && (
                <Link href="/organizer/scanner" className="btn btn-primary w-full">
                  <ScanLine size={14} /> Scan tickets
                </Link>
              )}
              {canResubmit && (
                <>
                  <Link
                    href={`/organizer/events/${event.id}/edit`}
                    className="btn btn-primary w-full"
                  >
                    <Pencil size={14} /> Edit & resubmit
                  </Link>
                  <button
                    onClick={() => {
                      const res = resubmitEvent(event.id);
                      if (res.ok) router.refresh();
                    }}
                    className="btn btn-secondary w-full"
                  >
                    <RotateCcw size={14} /> Resubmit as-is
                  </button>
                </>
              )}
              {canEdit && !canResubmit && (
                <Link
                  href={`/organizer/events/${event.id}/edit`}
                  className="btn btn-secondary w-full"
                >
                  <Pencil size={14} /> Edit event
                </Link>
              )}
              <button
                onClick={() => setShowChat((v) => !v)}
                className="btn btn-secondary w-full relative"
              >
                <MessageSquare size={14} /> Chat with Dean
                {hasUnreadChat && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-fuchsia-400" />
                )}
              </button>
              {canCancel && (
                <button
                  onClick={() => setConfirmCancel(true)}
                  className="btn btn-ghost text-rose-300 w-full"
                >
                  <XCircle size={14} /> Cancel event
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="btn btn-ghost text-rose-300 w-full"
                >
                  <Trash2 size={14} /> Delete from dashboard
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showChat && (
        <div className="animate-slideUp">
          <EventChat eventId={event.id} />
        </div>
      )}

      <EventSummary eventId={event.id} />

      <SubOrganizerPanel eventId={event.id} />

      {/* attendees */}
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="font-display font-semibold flex items-center gap-2">
            🎟️ Attendees
            <span className="chip text-[10px]">{attendees.length}</span>
          </div>
          {attendees.length > 0 && (
            <button onClick={exportCSV} className="btn btn-secondary text-xs">
              <Download size={13} /> Export CSV
            </button>
          )}
        </div>

        {attendees.length === 0 ? (
          <div className="text-center py-10 text-sm text-white/55">
            No tickets sold yet.
          </div>
        ) : (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-white/55 border-b border-white/8">
                  <th className="px-2 py-2 font-medium">Attendee</th>
                  <th className="px-2 py-2 font-medium hide-mobile">Contact</th>
                  <th className="px-2 py-2 font-medium">Status</th>
                  <th className="px-2 py-2 font-medium hide-mobile">Payment</th>
                </tr>
              </thead>
              <tbody>
                {attendees.map(({ ticket, user: stu }) => (
                  <tr
                    key={ticket.id}
                    className="border-b border-white/5 hover:bg-white/[0.03]"
                  >
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={stu.name} seed={stu.avatarSeed} size={32} />
                        <div className="min-w-0">
                          <div className="font-medium text-sm flex items-center gap-1.5">
                            {stu.name}
                            {!stu.isGikian && (
                              <span className="chip chip-amber text-[9px]">non-GIKI</span>
                            )}
                          </div>
                          {stu.regNumber && (
                            <div className="text-[11px] text-white/45">{stu.regNumber}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3 hide-mobile">
                      <div className="text-xs text-white/65 flex items-center gap-1">
                        <Mail size={11} /> {stu.email}
                      </div>
                      {stu.phone && (
                        <div className="text-xs text-white/55 flex items-center gap-1">
                          <Phone size={11} /> {stu.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-3">
                      <span
                        className={`chip text-[10px] ${
                          ticket.status === "scanned"
                            ? "chip-emerald"
                            : ticket.status === "confirmed"
                            ? "chip-violet"
                            : "chip-rose"
                        }`}
                      >
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-2 py-3 hide-mobile text-xs text-white/65">
                      {ticket.paymentMethod === "online" ? "💳 Online" : "💵 Cash"} •{" "}
                      {fmtPKR(ticket.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={confirmCancel} onClose={() => setConfirmCancel(false)} title="Cancel this event?">
        <div className="text-sm text-white/70 mb-4">
          All <span className="text-white font-medium">{stats.sold} ticket(s)</span> will be
          refunded automatically and attendees notified. This can't be undone.
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={() => setConfirmCancel(false)} className="btn btn-secondary">
            Keep event
          </button>
          <button
            onClick={() => { cancelEvent(event.id); setConfirmCancel(false); router.push("/organizer/events"); }}
            className="btn btn-danger"
          >
            Cancel event
          </button>
        </div>
      </Modal>

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete from dashboard?">
        <div className="text-sm text-white/70 mb-4">
          Permanently removes <span className="text-white font-medium">"{event.title}"</span> from
          your dashboard along with linked records. This can't be undone.
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={() => setConfirmDelete(false)} className="btn btn-secondary">
            Keep
          </button>
          <button
            onClick={() => { deleteEvent(event.id); router.push("/organizer/events"); }}
            className="btn btn-danger"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </Modal>
    </div>
  );
}

function Stat({
  icon, label, value,
}: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="glass rounded-xl p-2.5">
      <div className="text-[10px] uppercase tracking-wider text-white/45 flex items-center gap-1">
        {icon} {label}
      </div>
      <div className="text-sm mt-0.5 truncate">{value}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-white/65">{label}</span>
      <span className="font-display font-semibold">{value}</span>
    </div>
  );
}
