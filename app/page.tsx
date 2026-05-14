"use client";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  CalendarHeart,
  Ticket,
  ScanLine,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Github,
  GraduationCap,
} from "lucide-react";

export default function Landing() {
  const user = useStore((s) => s.currentUser());
  const hydrated = useStore((s) => s.hydrated);
  const router = useRouter();

  useEffect(() => {
    if (hydrated && user) router.replace(`/${user.role}/dashboard`);
  }, [hydrated, user, router]);

  return (
    <div className="min-h-screen">
      {/* top nav */}
      <header className="max-w-6xl mx-auto px-5 sm:px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 grid place-items-center font-bold text-ink-900">
            G
          </div>
          <div>
            <div className="font-display font-semibold">GIKI Event Hub</div>
            <div className="text-[10px] text-white/50 -mt-0.5">
              Society events & ticketing • HCI Milestone 3
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/help" className="btn btn-ghost hide-mobile">Help</Link>
          <Link href="/login" className="btn btn-primary">
            Sign in <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      {/* hero */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 pt-10 sm:pt-20 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="chip chip-violet">
              <Sparkles size={12} /> Built for GIKI by Batch 33
            </span>
            <h1 className="font-display text-4xl sm:text-6xl font-bold leading-[1.05]">
              One hub for{" "}
              <span className="text-gradient">every society event</span> on campus.
            </h1>
            <p className="text-lg text-white/65 max-w-xl">
              Stop hunting for posters and WhatsApp links. Discover, book, scan, and
              manage — debates, hackathons, cultural nights, workshops — all in one
              frictionless place.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/login" className="btn btn-primary">
                Try the demo <ArrowRight size={16} />
              </Link>
              <Link href="/help" className="btn btn-secondary">
                Scenario walkthrough
              </Link>
            </div>
            <div className="flex items-center gap-5 pt-4 text-xs text-white/50">
              <div className="flex items-center gap-1.5">
                <GraduationCap size={14} /> CS324 — HCI
              </div>
              <div>·</div>
              <div>Milestone 3 demo build</div>
              <div>·</div>
              <div>No real DB — full simulation</div>
            </div>
          </div>

          <div className="relative">
            {/* floating preview cards */}
            <div className="absolute -top-6 -left-2 glass-strong rounded-2xl p-4 w-48 rotate-[-4deg] animate-fadeIn shadow-2xl">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-2xl">🎤</div>
                <div>
                  <div className="text-[11px] text-white/55">Competition</div>
                  <div className="text-sm font-semibold leading-tight">
                    Inter-Society Debate
                  </div>
                </div>
              </div>
              <div className="text-[10px] text-white/55">Fri • 5:00 PM • Auditorium</div>
              <div className="mt-2 chip chip-emerald w-fit text-[10px]">62 seats left</div>
            </div>

            <div className="gradient-border-card p-6 rotate-[2deg] mt-8">
              <div className="text-xs text-white/55 mb-1">Your next event</div>
              <div className="font-display text-2xl font-semibold mb-3">
                Code Vortex — 24h AI Hackathon
              </div>
              <div className="flex items-center gap-2 text-xs text-white/60 mb-4">
                <span className="chip chip-cyan">Tech</span>
                <span>Sat 9:00 AM</span>·<span>CS Block</span>
              </div>
              <div className="rounded-xl p-4 bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-white/10 text-center">
                <div className="text-[10px] uppercase tracking-widest text-white/50 mb-1">
                  Your ticket
                </div>
                <div className="font-mono text-2xl tracking-widest">
                  GIKI-EVT-9F2A
                </div>
                <div className="mt-3 grid grid-cols-5 gap-0.5">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-sm"
                      style={{
                        background:
                          Math.random() > 0.45
                            ? "rgba(255,255,255,0.85)"
                            : "transparent",
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="absolute -bottom-6 -right-2 glass-strong rounded-2xl p-4 w-56 rotate-[3deg] animate-fadeIn shadow-2xl">
              <div className="text-[11px] text-white/55">Live notification</div>
              <div className="text-sm font-medium mt-1">
                ✅ Mumtaz checked into your event
              </div>
              <div className="text-[10px] text-white/45 mt-1">Just now</div>
            </div>
          </div>
        </div>
      </section>

      {/* feature pillars */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-12">
        <div className="text-center mb-10">
          <span className="chip chip-cyan mb-3 inline-flex">For every role on campus</span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold">
            Three dashboards. One <span className="text-gradient">source of truth</span>.
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {pillars.map((p) => (
            <div
              key={p.title}
              className="glass card glass-hover card-pop"
              style={{ minHeight: 220 }}
            >
              <div
                className="w-11 h-11 rounded-xl grid place-items-center mb-4"
                style={{
                  background: `linear-gradient(135deg, ${p.c1}, ${p.c2})`,
                  boxShadow: `0 14px 30px -10px ${p.c1}88`,
                }}
              >
                <p.icon size={20} className="text-white" />
              </div>
              <div className="font-display font-semibold text-lg mb-1">{p.title}</div>
              <p className="text-sm text-white/65">{p.body}</p>
              <ul className="mt-3 space-y-1 text-xs text-white/55">
                {p.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-1.5">
                    <span className="text-fuchsia-300 mt-1">▹</span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* scenario callout */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-12">
        <div className="gradient-border-card p-8 sm:p-10">
          <div className="grid md:grid-cols-[1.4fr_1fr] gap-8 items-center">
            <div>
              <span className="chip chip-amber mb-3">Demo scenario</span>
              <h3 className="font-display text-2xl sm:text-3xl font-bold mb-3">
                From poster on the gate to a <span className="text-gradient-warm">scanned QR</span> at the door — in 4 taps.
              </h3>
              <p className="text-white/65 text-sm leading-relaxed">
                Ammar (LDS President) creates the Debate Championship. Tahir (ADSA)
                reviews and approves it from his queue. Students get a live notification,
                Mumtaz books a ticket, pays online, and on Friday Ammar scans his QR at the
                entrance. Every action ripples through every dashboard — no email, no
                WhatsApp, no missed events.
              </p>
              <Link href="/login" className="btn btn-primary mt-5">
                Walk through the demo <ArrowRight size={16} />
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              {[
                ["Ammar", "Submits event 'Inter-Society Debate'", "📨"],
                ["Tahir", "Reviews & approves", "✅"],
                ["Mumtaz", "Browses, books, pays online", "🎟️"],
                ["Ammar", "Scans QR at the gate", "📷"],
                ["Mumtaz", "Checked in instantly", "🎉"],
              ].map(([who, what, e], i) => (
                <div
                  key={i}
                  className="glass rounded-xl p-3 flex items-center gap-3 animate-slideUp"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="text-2xl">{e}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-white/50">{who}</div>
                    <div className="text-sm">{what}</div>
                  </div>
                  <div className="text-xs text-white/40">{i + 1}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="max-w-6xl mx-auto px-5 sm:px-8 py-10 text-xs text-white/45 flex flex-wrap items-center justify-between gap-3">
        <div>© 2026 GIKI Event Hub • CS324 Milestone 3 demo</div>
        <div className="flex items-center gap-4">
          <span>Raja Bilal • M. Haris • M. Ammar • M. Bilal</span>
        </div>
      </footer>
    </div>
  );
}

const pillars = [
  {
    title: "For Students",
    body: "Discover what's happening this week, filter by category, and book a ticket with one tap. Tickets ride with you as a QR.",
    icon: Ticket,
    c1: "#8b5cf6",
    c2: "#d946ef",
    bullets: [
      "Filterable feed of approved events",
      "Online or cash payment",
      "QR ticket in your pocket",
      "Push when a new event drops",
    ],
  },
  {
    title: "For Organizers",
    body: "Create events with a single form. Track registrations live. Scan tickets at the door from your phone.",
    icon: CalendarHeart,
    c1: "#22d3ee",
    c2: "#8b5cf6",
    bullets: [
      "Submit for ADSA approval",
      "Realtime sold/scanned counters",
      "Built-in QR scanner",
      "Finance & attendance ledger",
    ],
  },
  {
    title: "For Administration",
    body: "Review every event, catch venue clashes, monitor financials, and broadcast announcements — all in one queue.",
    icon: ShieldCheck,
    c1: "#fb7185",
    c2: "#fbbf24",
    bullets: [
      "Approval queue with conflict warnings",
      "Calendar oversight",
      "User & society directory",
      "Analytics across the year",
    ],
  },
];
