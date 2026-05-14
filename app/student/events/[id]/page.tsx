"use client";
import { useStore, useEventStats } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Ticket,
  Info,
  CreditCard,
  Wallet,
  AlertCircle,
  CheckCircle2,
  Shield,
  Phone,
  Globe2,
  Building,
} from "lucide-react";
import { fmtDate, fmtPKR, softGradient } from "@/lib/utils";
import { Modal } from "@/components/Modal";

export default function EventDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const event = useStore((s) => s.events.find((e) => e.id === params.id));
  const user = useStore((s) => s.currentUser())!;
  const tickets = useStore((s) => s.tickets);
  const stats = useEventStats(params.id);
  const bookTicket = useStore((s) => s.bookTicket);
  const [bookOpen, setBookOpen] = useState(false);
  const [confirmedTicketId, setConfirmedTicketId] = useState<string | null>(null);

  if (!event) {
    return (
      <div className="glass rounded-2xl p-10 text-center">
        <div className="text-5xl mb-3">😔</div>
        <div className="font-display text-xl font-semibold mb-1">Event not found</div>
        <div className="text-white/55 text-sm mb-5">
          This event may have been removed or the link is incorrect.
        </div>
        <Link href="/student/events" className="btn btn-primary">
          Back to events
        </Link>
      </div>
    );
  }

  const myTicket = tickets.find(
    (t) =>
      t.eventId === event.id &&
      t.userId === user.id &&
      (t.status === "confirmed" || t.status === "scanned")
  );

  const remaining = event.capacity - stats.sold;
  const soldOut = remaining <= 0;
  const lowStock = remaining <= event.capacity * 0.2 && !soldOut;
  const passed = new Date(event.date).getTime() < Date.now();

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.back()}
        className="btn btn-ghost text-sm -ml-3"
      >
        <ArrowLeft size={14} /> Back
      </button>

      {/* hero */}
      <div className="gradient-border-card overflow-hidden">
        <div
          className="h-56 sm:h-72 relative"
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
            <h1 className="font-display text-2xl sm:text-4xl font-bold mt-2 max-w-3xl leading-tight drop-shadow-lg">
              {event.title}
            </h1>
            <div className="text-sm text-white/85 mt-1">{event.society}</div>
          </div>
          {!event.posterUrl && (
            <div className="text-8xl absolute top-6 right-6 drop-shadow-2xl opacity-90">
              {event.coverEmoji}
            </div>
          )}
          {event.allowNonGikian && (
            <span className="chip chip-emerald absolute top-6 right-6 backdrop-blur-md">
              <Globe2 size={12} /> Open to all students
            </span>
          )}
        </div>

        <div className="p-6 grid lg:grid-cols-[1.6fr_1fr] gap-8">
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Stat icon={<Calendar size={14} />} label="Date" value={fmtDate(event.date, "d MMM, yyyy")} />
              <Stat icon={<Calendar size={14} />} label="Time" value={fmtDate(event.date, "h:mm a")} />
              <Stat icon={<MapPin size={14} />} label="Venue" value={event.venue} />
              <Stat icon={<Users size={14} />} label="Seats" value={`${remaining}/${event.capacity}`} />
            </div>
            <div>
              <div className="font-display font-semibold mb-1.5 flex items-center gap-2">
                <Info size={15} /> About this event
              </div>
              <p className="text-white/70 text-sm leading-relaxed">
                {event.longDescription ?? event.description}
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-2 text-xs text-white/70">
              {event.pocName && (
                <div className="glass rounded-xl p-3 flex items-center gap-2">
                  <Phone size={13} className="text-fuchsia-300" />
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-white/45">
                      Event contact
                    </div>
                    <div className="text-sm">{event.pocName} · {event.pocPhone}</div>
                  </div>
                </div>
              )}
              {event.facultyAdvisor && (
                <div className="glass rounded-xl p-3 flex items-center gap-2">
                  <Building size={13} className="text-cyan-300" />
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-white/45">
                      Faculty advisor
                    </div>
                    <div className="text-sm">{event.facultyAdvisor}</div>
                  </div>
                </div>
              )}
            </div>
            {event.resourcesRequested && event.resourcesRequested.length > 0 && (
              <div>
                <div className="text-xs text-white/55 mb-1.5">Provided</div>
                <div className="flex flex-wrap gap-1.5">
                  {event.resourcesRequested.map((r) => (
                    <span key={r} className="chip">{r}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* booking panel */}
          <div className="glass-strong rounded-2xl p-5 h-fit lg:sticky lg:top-24 space-y-4">
            <div>
              <div className="text-xs text-white/55">Ticket price</div>
              <div className="font-display text-3xl font-bold mt-0.5">
                {fmtPKR(event.ticketPrice)}
              </div>
            </div>

            {/* progress bar */}
            <div>
              <div className="flex items-center justify-between text-xs text-white/60 mb-1.5">
                <span>{stats.sold} booked</span>
                <span>{event.capacity} capacity</span>
              </div>
              <div className="h-2 rounded-full bg-white/8 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (stats.sold / event.capacity) * 100)}%`,
                    background:
                      "linear-gradient(90deg, #8b5cf6, #d946ef, #fb7185)",
                  }}
                />
              </div>
              {lowStock && (
                <div className="text-xs text-amber-300 mt-1.5 flex items-center gap-1.5">
                  <AlertCircle size={12} /> Only {remaining} seats left!
                </div>
              )}
            </div>

            {myTicket ? (
              <div className="space-y-2">
                <div className="rounded-xl p-3 bg-emerald-500/10 border border-emerald-400/30 flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-emerald-200">
                    You're booked for this event.
                  </div>
                </div>
                <Link href={`/student/tickets/${myTicket.id}`} className="btn btn-primary w-full">
                  View my ticket
                </Link>
              </div>
            ) : passed ? (
              <div className="rounded-xl p-3 bg-white/5 border border-white/10 text-xs text-white/65 text-center">
                This event has already passed.
              </div>
            ) : soldOut ? (
              <button className="btn btn-secondary w-full" disabled>
                Sold out
              </button>
            ) : event.status !== "approved" ? (
              <div className="rounded-xl p-3 bg-amber-500/10 border border-amber-400/30 text-xs text-amber-200 text-center">
                Bookings open after Dean approval.
              </div>
            ) : !user.isGikian && !event.allowNonGikian ? (
              <div className="rounded-xl p-3 bg-amber-500/10 border border-amber-400/30 text-xs text-amber-200 text-center">
                This event is open to GIKI students only.
              </div>
            ) : (
              <button onClick={() => setBookOpen(true)} className="btn btn-primary w-full">
                <Ticket size={15} /> Book ticket
              </button>
            )}

            <div className="text-[11px] text-white/45 flex items-center gap-1.5 justify-center">
              <Shield size={11} /> Secure checkout — 100% refund if event cancelled
            </div>
          </div>
        </div>
      </div>

      <BookingModal
        open={bookOpen}
        onClose={() => setBookOpen(false)}
        event={event}
        onConfirmed={(ticketId) => {
          setBookOpen(false);
          setConfirmedTicketId(ticketId);
        }}
      />

      <Modal open={!!confirmedTicketId} onClose={() => setConfirmedTicketId(null)} title="" maxWidth="max-w-md">
        <div className="text-center py-2">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 grid place-items-center mb-3">
            <CheckCircle2 size={32} className="text-emerald-400" />
          </div>
          <div className="font-display text-xl font-semibold">Ticket confirmed!</div>
          <div className="text-white/65 text-sm mt-1 mb-5">
            Your QR ticket is ready. Show it at the door on event day.
          </div>
          <div className="flex gap-2">
            <Link
              href={`/student/tickets/${confirmedTicketId}`}
              className="btn btn-primary flex-1"
            >
              View ticket
            </Link>
            <button onClick={() => setConfirmedTicketId(null)} className="btn btn-secondary">
              Done
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="glass rounded-xl p-3">
      <div className="text-[10px] uppercase tracking-wider text-white/45 flex items-center gap-1">
        {icon} {label}
      </div>
      <div className="text-sm font-medium mt-1">{value}</div>
    </div>
  );
}

function BookingModal({
  open,
  onClose,
  event,
  onConfirmed,
}: {
  open: boolean;
  onClose: () => void;
  event: any;
  onConfirmed: (ticketId: string) => void;
}) {
  const [step, setStep] = useState<"summary" | "payment" | "processing">("summary");
  const [method, setMethod] = useState<"online" | "cash">("online");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const bookTicket = useStore((s) => s.bookTicket);
  const currentUser = useStore((s) => s.currentUser());
  const isNonGikian = !!(currentUser && !currentUser.isGikian);

  function reset() {
    setStep("summary"); setMethod("online");
    setCardNumber(""); setCardName(""); setCardExpiry(""); setCardCvv("");
    setFieldErrors({}); setGlobalError(""); setTermsAccepted(false);
  }

  function close() { reset(); onClose(); }

  function formatCard(v: string) {
    return v.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})/g, "$1 ").trim();
  }
  function formatExpiry(v: string) {
    const digits = v.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2);
    return digits;
  }

  function confirm() {
    setGlobalError(""); setFieldErrors({});
    if (method === "online" && event.ticketPrice > 0) {
      const errors: Record<string, string> = {};
      const digits = cardNumber.replace(/\s/g, "");
      if (!digits) errors.number = "Card number is required.";
      else if (!/^\d{16}$/.test(digits)) errors.number = "Must be exactly 16 digits.";
      if (!cardName.trim()) errors.name = "Cardholder name is required.";
      if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) errors.expiry = "Use MM/YY format.";
      if (!/^\d{3,4}$/.test(cardCvv)) errors.cvv = "3 or 4 digits.";
      if (Object.keys(errors).length) { setFieldErrors(errors); return; }
    }
    if (isNonGikian && !termsAccepted) {
      setGlobalError("Please accept the terms & conditions to continue.");
      return;
    }
    setStep("processing");
    setTimeout(() => {
      const res = bookTicket(
        event.id,
        method,
        {
          number: cardNumber,
          name: cardName,
          expiry: cardExpiry,
          cvv: cardCvv,
        },
        termsAccepted
      );
      if (res.ok) {
        onConfirmed(res.ticket.id);
        reset();
      } else {
        setStep("payment");
        if (res.field === "card.number") setFieldErrors({ number: res.error });
        else if (res.field === "card.cvv") setFieldErrors({ cvv: res.error });
        else if (res.field === "card.expiry") setFieldErrors({ expiry: res.error });
        else if (res.field === "card.name") setFieldErrors({ name: res.error });
        else setGlobalError(res.error);
      }
    }, 1200);
  }

  if (!open) return null;

  return (
    <Modal open={open} onClose={close} title={
      step === "summary" ? "Book your ticket" :
      step === "payment" ? "Payment details" :
      "Processing"
    }>
      {step === "summary" && (
        <div className="space-y-4">
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div
                className="w-14 h-14 rounded-xl grid place-items-center text-2xl shrink-0"
                style={{ background: `linear-gradient(135deg, hsl(${event.coverHue},70%,40%), hsl(${(parseInt(event.coverHue) + 60) % 360},70%,40%))` }}
              >
                {event.coverEmoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{event.title}</div>
                <div className="text-xs text-white/55">
                  {fmtDate(event.date, "EEE, d MMM • h:mm a")}
                </div>
                <div className="text-xs text-white/55">{event.venue}</div>
              </div>
            </div>
          </div>

          <div>
            <div className="text-xs text-white/55 mb-2">Choose payment method</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMethod("online")}
                className={`rounded-xl p-3 border text-left transition ${
                  method === "online"
                    ? "border-fuchsia-400/50 bg-fuchsia-500/10"
                    : "border-white/10 hover:bg-white/5"
                }`}
              >
                <CreditCard size={18} className="mb-1.5" />
                <div className="text-sm font-medium">Online</div>
                <div className="text-[11px] text-white/55">Card or wallet</div>
              </button>
              <button
                onClick={() => setMethod("cash")}
                className={`rounded-xl p-3 border text-left transition ${
                  method === "cash"
                    ? "border-fuchsia-400/50 bg-fuchsia-500/10"
                    : "border-white/10 hover:bg-white/5"
                }`}
              >
                <Wallet size={18} className="mb-1.5" />
                <div className="text-sm font-medium">Cash at venue</div>
                <div className="text-[11px] text-white/55">Pay on event day</div>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm pt-3 border-t border-white/8">
            <span className="text-white/65">Total</span>
            <span className="font-display text-xl font-bold">{fmtPKR(event.ticketPrice)}</span>
          </div>

          {isNonGikian && (
            <label className="rounded-xl p-3 bg-amber-500/8 border border-amber-400/30 flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1"
              />
              <div className="text-xs text-amber-100 leading-relaxed">
                <span className="font-semibold">Terms & conditions (non-GIKI attendees):</span> I
                understand that I'm attending a GIKI campus event as an external visitor. I take
                full responsibility for my own conduct, safety, and any personal belongings. I
                agree to follow campus security guidelines and abide by the organizer's rules.
                In case of any incident, neither the organizer nor the Dean of Student Affairs
                shall be held liable for damages or injury that result from my own actions.
              </div>
            </label>
          )}

          {globalError && (
            <div className="rounded-xl p-3 bg-rose-500/10 border border-rose-400/30 text-xs text-rose-200 flex items-start gap-2">
              <AlertCircle size={14} className="text-rose-400 shrink-0 mt-0.5" />
              {globalError}
            </div>
          )}

          <button
            onClick={() => {
              if (isNonGikian && !termsAccepted) {
                setGlobalError("Please accept the terms & conditions to continue.");
                return;
              }
              setGlobalError("");
              if (method === "online" && event.ticketPrice > 0) setStep("payment");
              else confirm();
            }}
            className="btn btn-primary w-full"
          >
            {method === "online" && event.ticketPrice > 0
              ? "Continue to payment"
              : "Confirm booking"}
          </button>
        </div>
      )}

      {step === "payment" && (
        <div className="space-y-3">
          <div className="text-xs text-white/55">
            Test card: <span className="font-mono text-white/80">4242 4242 4242 4242</span> (any expiry, any CVV)
            <br />
            Test decline: <span className="font-mono text-rose-300">4000 0000 0000 0002</span>
          </div>

          <div className="field">
            <label className="field-label">Card number</label>
            <input
              className={`input font-mono ${fieldErrors.number ? "input-error" : ""}`}
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCard(e.target.value))}
              placeholder="1234 5678 9012 3456"
              inputMode="numeric"
            />
            {fieldErrors.number && (
              <div className="field-error">
                <AlertCircle size={12} /> {fieldErrors.number}
              </div>
            )}
          </div>

          <div className="field">
            <label className="field-label">Cardholder name</label>
            <input
              className={`input ${fieldErrors.name ? "input-error" : ""}`}
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              placeholder="Mumtaz Ali"
            />
            {fieldErrors.name && (
              <div className="field-error">
                <AlertCircle size={12} /> {fieldErrors.name}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="field">
              <label className="field-label">Expiry</label>
              <input
                className={`input font-mono ${fieldErrors.expiry ? "input-error" : ""}`}
                value={cardExpiry}
                onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                placeholder="MM/YY"
                inputMode="numeric"
                maxLength={5}
              />
              {fieldErrors.expiry && (
                <div className="field-error">
                  <AlertCircle size={12} /> {fieldErrors.expiry}
                </div>
              )}
            </div>
            <div className="field">
              <label className="field-label">CVV</label>
              <input
                className={`input font-mono ${fieldErrors.cvv ? "input-error" : ""}`}
                value={cardCvv}
                onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="123"
                inputMode="numeric"
              />
              {fieldErrors.cvv && (
                <div className="field-error">
                  <AlertCircle size={12} /> {fieldErrors.cvv}
                </div>
              )}
            </div>
          </div>

          {globalError && (
            <div className="rounded-xl p-3 bg-rose-500/10 border border-rose-400/30 text-xs text-rose-200 flex items-start gap-2">
              <AlertCircle size={14} className="text-rose-400 shrink-0 mt-0.5" />
              {globalError}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button onClick={() => setStep("summary")} className="btn btn-secondary">
              Back
            </button>
            <button onClick={confirm} className="btn btn-primary flex-1">
              Pay {fmtPKR(event.ticketPrice)}
            </button>
          </div>
        </div>
      )}

      {step === "processing" && (
        <div className="py-6 text-center">
          <div className="w-12 h-12 mx-auto rounded-full border-2 border-white/20 border-t-fuchsia-400 animate-spin mb-3" />
          <div className="font-display text-lg font-semibold">Processing payment…</div>
          <div className="text-white/55 text-sm mt-1">Please don't close this window.</div>
        </div>
      )}
    </Modal>
  );
}
