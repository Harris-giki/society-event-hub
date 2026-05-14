"use client";
import { useState } from "react";
import Link from "next/link";
import {
  HelpCircle,
  MessageCircle,
  Phone,
  Mail,
  ArrowLeft,
  ChevronDown,
  Send,
  Sparkles,
  Ticket,
  CreditCard,
  CalendarPlus,
  ShieldCheck,
  ScanLine,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useStore } from "@/lib/store";

const categories = [
  { k: "tickets", label: "Tickets & Bookings", icon: Ticket, c: "violet" },
  { k: "payments", label: "Payments & Refunds", icon: CreditCard, c: "fuchsia" },
  { k: "events", label: "Creating Events", icon: CalendarPlus, c: "cyan" },
  { k: "admin", label: "Approval Process", icon: ShieldCheck, c: "amber" },
  { k: "scanner", label: "QR Scanner", icon: ScanLine, c: "emerald" },
];

const faqs = [
  {
    cat: "tickets",
    q: "How do I book a ticket for an event?",
    a: "Go to Discover, tap any event card, then click 'Book ticket'. Pick your payment method (online or cash) and confirm. Your QR ticket appears instantly under My Tickets.",
  },
  {
    cat: "tickets",
    q: "Can I cancel a booked ticket?",
    a: "Yes. Open the ticket from My Tickets, then click 'Cancel & refund'. Refunds are issued automatically and reflect within 3–5 working days in real life. In this demo they're instant.",
  },
  {
    cat: "tickets",
    q: "What if my QR is rejected at the door?",
    a: "Tickets can be rejected if they've already been scanned, refunded, or are for a different event. Ask the organizer to verify your ticket ID against the attendee list — it's exportable as CSV from the event page.",
  },
  {
    cat: "payments",
    q: "How do I demo a failed payment?",
    a: "Use the card number 4000 0000 0000 0002 with any name/expiry/CVV — the gateway will simulate a decline. You'll see the exact error message that students would face in production.",
  },
  {
    cat: "payments",
    q: "What happens to my payment if an event is cancelled?",
    a: "If the organizer cancels an event, every confirmed ticket is automatically marked refunded and all attendees are notified. No action needed from your side.",
  },
  {
    cat: "events",
    q: "How long does approval usually take?",
    a: "ADSA reviews events typically within 1–2 working days. You can track status (Pending / Approved / Rejected) from My Events. Rejections include a reason from the admin so you can fix and resubmit.",
  },
  {
    cat: "events",
    q: "Can I edit an event after submitting?",
    a: "In this demo, events are non-editable post-submission. If something changes, ask the admin to reject so you can resubmit a corrected version.",
  },
  {
    cat: "events",
    q: "What if my chosen venue conflicts with another event?",
    a: "The create-event form warns you in real time if your chosen venue + time clashes with another approved/pending event. ADSA also sees these conflicts on the approval queue.",
  },
  {
    cat: "admin",
    q: "How does the approval queue work?",
    a: "Every submitted event lands in the Approvals page, sorted by submission time. You can approve to publish, or reject with a reason — the organizer is notified instantly.",
  },
  {
    cat: "admin",
    q: "How do venue conflicts get flagged?",
    a: "The system detects overlapping events at the same venue and surfaces them on the Approvals page and the Overview. You can still approve them, but you'll see a clear warning.",
  },
  {
    cat: "scanner",
    q: "How do I scan tickets at the door?",
    a: "Open Scanner from the organizer nav. In production it would use your phone's camera; in this demo, you can paste the QR payload or click any confirmed ticket from the side panel to simulate a scan.",
  },
  {
    cat: "scanner",
    q: "Can I scan tickets for someone else's event?",
    a: "No — for security, only the organizer (or admin) of a specific event can scan its tickets. Trying to scan an unauthorized ticket will return an error.",
  },
];

export default function HelpPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | "all">("all");
  const [open, setOpen] = useState<string | null>(null);
  const [contactSubject, setContactSubject] = useState("");
  const [contactBody, setContactBody] = useState("");
  const [sent, setSent] = useState(false);
  const user = useStore((s) => s.currentUser());

  let list = faqs;
  if (cat !== "all") list = list.filter((f) => f.cat === cat);
  if (q.trim()) {
    const lc = q.toLowerCase();
    list = list.filter(
      (f) => f.q.toLowerCase().includes(lc) || f.a.toLowerCase().includes(lc)
    );
  }

  function send(e: React.FormEvent) {
    e.preventDefault();
    if (!contactSubject.trim() || !contactBody.trim()) return;
    setSent(true);
    setContactSubject("");
    setContactBody("");
    setTimeout(() => setSent(false), 4000);
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <Link
          href={user ? `/${user.role}/dashboard` : "/"}
          className="btn btn-ghost text-sm -ml-3 w-fit"
        >
          <ArrowLeft size={14} /> {user ? "Back to dashboard" : "Back home"}
        </Link>

        {/* hero */}
        <div className="text-center space-y-3">
          <span className="chip chip-violet mx-auto">
            <Sparkles size={12} /> Help & Support
          </span>
          <h1 className="font-display text-4xl font-bold">
            How can we <span className="text-gradient">help</span>?
          </h1>
          <p className="text-white/65 max-w-xl mx-auto">
            Quick answers to common questions, or reach the team directly.
          </p>
          <div className="max-w-xl mx-auto">
            <input
              className="input py-3.5 text-base"
              placeholder="Search help articles…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>

        {/* categories */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <button
            onClick={() => setCat("all")}
            className={`glass rounded-2xl p-4 transition ${
              cat === "all"
                ? "bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border-fuchsia-400/40"
                : ""
            }`}
          >
            <HelpCircle size={20} className="mx-auto mb-2 text-fuchsia-300" />
            <div className="text-xs font-medium">All topics</div>
          </button>
          {categories.map((c) => {
            const Icon = c.icon;
            const colorClasses: Record<string, string> = {
              violet: "text-violet-300",
              fuchsia: "text-fuchsia-300",
              cyan: "text-cyan-300",
              amber: "text-amber-300",
              emerald: "text-emerald-300",
            };
            return (
              <button
                key={c.k}
                onClick={() => setCat(c.k)}
                className={`glass glass-hover rounded-2xl p-4 transition ${
                  cat === c.k ? "border-fuchsia-400/40 bg-fuchsia-500/10" : ""
                }`}
              >
                <Icon size={20} className={`mx-auto mb-2 ${colorClasses[c.c]}`} />
                <div className="text-xs font-medium">{c.label}</div>
              </button>
            );
          })}
        </div>

        {/* faqs */}
        <div className="space-y-2">
          {list.length === 0 ? (
            <div className="glass rounded-2xl p-10 text-center">
              <div className="text-5xl mb-2">🤔</div>
              <div className="font-display font-semibold">No matching articles</div>
              <div className="text-sm text-white/55 mt-1">
                Try a different search term or contact support below.
              </div>
            </div>
          ) : (
            list.map((f, i) => (
              <details
                key={i}
                className="glass rounded-xl group"
                open={open === f.q}
                onToggle={(e) => {
                  if ((e.target as HTMLDetailsElement).open) setOpen(f.q);
                }}
              >
                <summary className="cursor-pointer p-4 flex items-center justify-between gap-3 list-none">
                  <span className="text-sm font-medium pr-3">{f.q}</span>
                  <ChevronDown
                    size={16}
                    className="text-white/50 group-open:rotate-180 transition shrink-0"
                  />
                </summary>
                <div className="px-4 pb-4 text-sm text-white/65 leading-relaxed border-t border-white/8 pt-3">
                  {f.a}
                </div>
              </details>
            ))
          )}
        </div>

        {/* contact */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="gradient-border-card p-6">
            <div className="font-display font-semibold mb-1 flex items-center gap-2">
              <MessageCircle size={16} className="text-fuchsia-300" /> Contact support
            </div>
            <div className="text-xs text-white/55 mb-4">
              Can't find what you need? Send us a message — we usually reply within 24 hrs.
            </div>
            {sent && (
              <div className="rounded-xl p-3 mb-3 bg-emerald-500/10 border border-emerald-400/30 text-xs text-emerald-200 flex items-center gap-2">
                <CheckCircle2 size={14} /> Thanks! We've received your message.
              </div>
            )}
            <form onSubmit={send} className="space-y-3">
              <div className="field">
                <label className="field-label">Subject</label>
                <input
                  className="input"
                  value={contactSubject}
                  onChange={(e) => setContactSubject(e.target.value)}
                  placeholder="What's this about?"
                  maxLength={80}
                />
              </div>
              <div className="field">
                <label className="field-label">Message</label>
                <textarea
                  className="textarea min-h-[100px]"
                  value={contactBody}
                  onChange={(e) => setContactBody(e.target.value)}
                  placeholder="Tell us a bit more…"
                />
              </div>
              <button
                type="submit"
                disabled={!contactSubject.trim() || !contactBody.trim()}
                className="btn btn-primary w-full"
              >
                <Send size={15} /> Send message
              </button>
            </form>
          </div>

          <div className="space-y-3">
            <div className="glass rounded-2xl p-5">
              <div className="font-display font-semibold mb-3">Direct channels</div>
              <div className="space-y-3">
                <ContactRow
                  icon={<Mail size={16} />}
                  label="Email"
                  value="support@gikieventhub.pk"
                  href="mailto:support@gikieventhub.pk"
                />
                <ContactRow
                  icon={<Phone size={16} />}
                  label="ADSA office"
                  value="+92 938 281 3000"
                  href="tel:+923812813000"
                />
                <ContactRow
                  icon={<MessageCircle size={16} />}
                  label="WhatsApp helpline"
                  value="+92 320 5560000 (9 AM – 6 PM)"
                  href="#"
                />
              </div>
            </div>

            <div className="glass rounded-2xl p-5">
              <div className="font-display font-semibold mb-2 flex items-center gap-2">
                <AlertCircle size={15} className="text-amber-300" /> In an emergency
              </div>
              <div className="text-xs text-white/65 leading-relaxed">
                For event-day emergencies, call campus security on <span className="text-white font-mono">2811</span> from any internal phone, or contact your faculty advisor directly.
              </div>
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-white/45 pt-6">
          © 2026 GIKI Event Hub • CS324 Milestone 3 demo
        </div>
      </div>
    </div>
  );
}

function ContactRow({
  icon, label, value, href,
}: { icon: React.ReactNode; label: string; value: string; href: string }) {
  return (
    <a href={href} className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-white/5 transition">
      <div className="w-9 h-9 rounded-lg bg-white/8 grid place-items-center">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[11px] text-white/55">{label}</div>
        <div className="text-sm truncate">{value}</div>
      </div>
    </a>
  );
}
