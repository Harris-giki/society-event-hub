"use client";
import { useStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Download,
  Printer,
  AlertCircle,
  ShieldX,
  Wallet,
  CreditCard,
  CheckCircle2,
  Hash,
  Star,
} from "lucide-react";
import { fmtDate, fmtPKR } from "@/lib/utils";
import { QRCode } from "@/components/QRCode";
import { useEffect, useState } from "react";
import { Modal } from "@/components/Modal";
import { ReviewModal } from "@/components/ReviewModal";

export default function TicketPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const user = useStore((s) => s.currentUser())!;
  const ticket = useStore((s) => s.tickets.find((t) => t.id === params.id));
  const event = useStore((s) =>
    ticket ? s.events.find((e) => e.id === ticket.eventId) : undefined
  );
  const myReview = useStore((s) =>
    s.reviews.find(
      (r) => r.eventId === ticket?.eventId && r.userId === user.id
    )
  );
  const refund = useStore((s) => s.refundTicket);
  const [confirmRefund, setConfirmRefund] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  // Auto-prompt the review modal once after a successful scan.
  useEffect(() => {
    if (ticket && ticket.status === "scanned" && !myReview) {
      const promptedKey = `review-prompted-${ticket.id}`;
      if (typeof window !== "undefined" && !sessionStorage.getItem(promptedKey)) {
        setReviewOpen(true);
        sessionStorage.setItem(promptedKey, "1");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket?.status]);

  if (!ticket || !event || ticket.userId !== user.id) {
    return (
      <div className="glass rounded-2xl p-10 text-center">
        <div className="text-5xl mb-3">🎟️</div>
        <div className="font-display text-xl font-semibold mb-1">Ticket not found</div>
        <Link href="/student/tickets" className="btn btn-primary mt-3">
          Back to tickets
        </Link>
      </div>
    );
  }

  const isPast = new Date(event.date).getTime() < Date.now();
  const isCancelled = ticket.status === "cancelled" || ticket.status === "refunded";

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <button
        onClick={() => router.back()}
        className="btn btn-ghost text-sm -ml-3 no-print"
      >
        <ArrowLeft size={14} /> Back
      </button>

      <div className="gradient-border-card overflow-hidden">
        {/* top — gradient */}
        <div
          className="p-6 text-white relative"
          style={{
            background: `linear-gradient(135deg, hsl(${event.coverHue},70%,40%), hsl(${(parseInt(event.coverHue) + 60) % 360},70%,40%))`,
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-widest opacity-80">
                {event.society}
              </div>
              <div className="font-display text-2xl font-bold mt-1 max-w-md leading-tight">
                {event.title}
              </div>
            </div>
            <div className="text-5xl drop-shadow-lg">{event.coverEmoji}</div>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-4 text-sm">
            <span className="flex items-center gap-1.5">
              <Calendar size={13} /> {fmtDate(event.date, "EEE, d MMM • h:mm a")}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin size={13} /> {event.venue}
            </span>
          </div>
        </div>

        {/* perforation */}
        <div className="relative h-6 -my-3 z-10">
          <div className="absolute inset-x-0 top-1/2 h-px bg-white/15 border-t border-dashed" />
          <div className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-ink-900" />
          <div className="absolute -right-3 top-0 w-6 h-6 rounded-full bg-ink-900" />
        </div>

        {/* QR */}
        <div className="p-6 grid sm:grid-cols-[auto_1fr] gap-6 items-center bg-white/[0.02]">
          <div className="mx-auto">
            <div
              className={
                isCancelled || ticket.status === "scanned"
                  ? "relative"
                  : "relative"
              }
            >
              <QRCode value={ticket.qrPayload} size={200} />
              {(isCancelled || ticket.status === "scanned") && (
                <div className="absolute inset-0 grid place-items-center bg-black/60 rounded-2xl">
                  <div className="rotate-[-18deg] border-4 border-white/90 text-white font-bold text-xl px-4 py-1 rounded-md">
                    {ticket.status === "scanned" ? "USED" : ticket.status === "refunded" ? "REFUNDED" : "CANCELLED"}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="space-y-3">
            <Row label="Holder" value={user.name} />
            <Row
              label="Ticket code"
              value={
                <span className="font-mono text-lg tracking-widest">{ticket.ticketCode}</span>
              }
            />
            <Row label="Ticket ID" value={ticket.id} mono />
            <Row label="Seat" value={ticket.seatLabel ?? "Open seating"} />
            <Row label="Booked" value={fmtDate(ticket.bookedAt)} />
            <Row
              label="Payment"
              value={
                <span className="flex items-center gap-1.5">
                  {ticket.paymentMethod === "online" ? (
                    <CreditCard size={13} />
                  ) : (
                    <Wallet size={13} />
                  )}
                  {ticket.paymentMethod === "online"
                    ? "Online — Paid"
                    : "Cash — Pay at venue"}{" "}
                  • {fmtPKR(ticket.amount)}
                </span>
              }
            />
            <Row
              label="Status"
              value={
                <span
                  className={`chip ${
                    ticket.status === "scanned"
                      ? "chip-emerald"
                      : isCancelled
                      ? "chip-rose"
                      : "chip-violet"
                  }`}
                >
                  {ticket.status === "scanned"
                    ? "Checked in"
                    : ticket.status === "refunded"
                    ? "Refunded"
                    : ticket.status === "cancelled"
                    ? "Cancelled"
                    : "Confirmed"}
                </span>
              }
            />
          </div>
        </div>
      </div>

      {ticket.refundProgress && (
        <RefundProgress
          stage={ticket.refundProgress.stage}
          times={ticket.refundProgress}
          amount={ticket.amount}
        />
      )}

      <div className="flex flex-wrap gap-2 no-print">
        <button
          onClick={() => window.print()}
          className="btn btn-secondary"
        >
          <Printer size={15} /> Print
        </button>
        <button
          onClick={() => {
            const url = `data:text/plain;charset=utf-8,${encodeURIComponent(
              `GIKI EVENT HUB — TICKET\n\n${event.title}\n${event.society}\n${fmtDate(event.date)}\n${event.venue}\n\nHolder: ${user.name}\nTicket ID: ${ticket.id}\nQR Payload: ${ticket.qrPayload}`
            )}`;
            const a = document.createElement("a");
            a.href = url;
            a.download = `ticket-${ticket.id}.txt`;
            a.click();
          }}
          className="btn btn-secondary"
        >
          <Download size={15} /> Save
        </button>
        {!isPast && !isCancelled && ticket.status === "confirmed" && (
          <button onClick={() => setConfirmRefund(true)} className="btn btn-ghost ml-auto text-rose-300">
            <ShieldX size={15} /> Cancel & refund
          </button>
        )}
      </div>

      {ticket.status === "confirmed" && !isPast && (
        <div className="rounded-xl p-4 bg-violet-500/10 border border-violet-400/30 flex items-start gap-2.5">
          <AlertCircle size={16} className="text-violet-300 shrink-0 mt-0.5" />
          <div className="text-xs text-violet-200">
            Show this QR at the entrance on event day. The organizer will scan it to
            check you in. Don't share this QR with anyone — it's one-time use.
          </div>
        </div>
      )}

      {ticket.status === "scanned" && !myReview && (
        <div className="rounded-2xl p-5 bg-amber-500/8 border border-amber-400/25 flex flex-col sm:flex-row items-start sm:items-center gap-3 no-print">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 grid place-items-center shrink-0">
            <Star size={22} className="text-amber-300 fill-amber-300" />
          </div>
          <div className="flex-1">
            <div className="font-display font-semibold">How was the event?</div>
            <div className="text-xs text-white/60 mt-0.5">
              Help the organizer get better — 30 seconds.
            </div>
          </div>
          <button onClick={() => setReviewOpen(true)} className="btn btn-primary text-sm">
            <Star size={14} /> Leave a review
          </button>
        </div>
      )}

      {myReview && (
        <div className="rounded-2xl p-4 bg-emerald-500/8 border border-emerald-400/25 no-print">
          <div className="flex items-center justify-between mb-1.5">
            <div className="text-xs text-emerald-300 font-semibold">Your review</div>
            <div className="text-amber-300 font-mono text-sm">
              {"★".repeat(myReview.rating)}
              <span className="text-white/25">{"★".repeat(5 - myReview.rating)}</span>
            </div>
          </div>
          <div className="text-sm text-white/80">{myReview.body}</div>
        </div>
      )}

      <Modal open={confirmRefund} onClose={() => setConfirmRefund(false)} title="Cancel ticket?">
        <div className="text-sm text-white/70 mb-4">
          Your booking will be cancelled and your payment{" "}
          <span className="text-white font-medium">
            ({fmtPKR(ticket.amount)})
          </span>{" "}
          will be refunded within 3–5 working days. This can't be undone.
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={() => setConfirmRefund(false)} className="btn btn-secondary">
            Keep ticket
          </button>
          <button
            onClick={() => {
              refund(ticket.id);
              setConfirmRefund(false);
            }}
            className="btn btn-danger"
          >
            Cancel & refund
          </button>
        </div>
      </Modal>

      <ReviewModal
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        eventId={event.id}
        eventTitle={event.title}
      />
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="text-[11px] uppercase tracking-wider text-white/45 shrink-0 pt-0.5">
        {label}
      </div>
      <div className={`text-sm text-right ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}

function RefundProgress({
  stage,
  times,
  amount,
}: {
  stage: "initiated" | "processing" | "completed";
  times: { initiatedAt?: string; processingAt?: string; completedAt?: string };
  amount: number;
}) {
  const steps = [
    { k: "initiated", label: "Refund requested", t: times.initiatedAt },
    { k: "processing", label: "Processing with payment provider", t: times.processingAt },
    { k: "completed", label: "Refund completed", t: times.completedAt },
  ];
  const order = { initiated: 0, processing: 1, completed: 2 };
  const current = order[stage];
  return (
    <div className="rounded-2xl p-5 border border-emerald-400/30 bg-emerald-500/8 space-y-3 animate-slideUp">
      <div className="flex items-center justify-between">
        <div className="font-display font-semibold text-emerald-300">
          Refund in progress
        </div>
        <div className="font-display font-bold">{fmtPKR(amount)}</div>
      </div>
      <div className="space-y-2.5">
        {steps.map((s, i) => {
          const done = i <= current;
          const active = i === current && stage !== "completed";
          return (
            <div key={s.k} className="flex items-start gap-3">
              <div
                className={`w-6 h-6 rounded-full grid place-items-center shrink-0 mt-0.5 ${
                  done
                    ? "bg-emerald-500/40 border border-emerald-400/50"
                    : "bg-white/5 border border-white/15"
                }`}
              >
                {done ? (
                  <CheckCircle2 size={14} className={active ? "text-emerald-200 animate-pulse" : "text-emerald-300"} />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                )}
              </div>
              <div className="flex-1">
                <div className={`text-sm ${done ? "text-white" : "text-white/55"}`}>
                  {s.label}
                </div>
                {s.t && (
                  <div className="text-[10px] text-white/45 font-mono mt-0.5">
                    {fmtDate(s.t, "h:mm:ss a · d MMM")}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {stage === "completed" && (
        <div className="text-xs text-emerald-200 pt-1">
          Funds reflect in your account within 3–5 working days.
        </div>
      )}
    </div>
  );
}
