"use client";
import Link from "next/link";
import { useStore, useEventStats } from "@/lib/store";
import { fmtDate, fmtPKR, isUpcoming } from "@/lib/utils";
import {
  CalendarPlus,
  ChevronRight,
  ScanLine,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";

export default function OrganizerDashboard() {
  const user = useStore((s) => s.currentUser())!;
  const myEvents = useStore((s) =>
    s.events.filter((e) => e.organizerId === user.id)
  );
  const tickets = useStore((s) => s.tickets);

  const myTickets = tickets.filter((t) =>
    myEvents.some((e) => e.id === t.eventId)
  );
  const totalRevenue = myTickets
    .filter((t) => t.status !== "refunded" && t.status !== "cancelled")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalAttendees = myTickets.filter((t) => t.status === "scanned").length;
  const pending = myEvents.filter((e) => e.status === "pending").length;
  const live = myEvents.filter((e) => e.status === "approved" && isUpcoming(e));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-sm text-white/55">
            {user.society}
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold mt-1">
            Hi <span className="text-gradient">{user.name.split(" ")[0]}</span> — let's run an event.
          </h1>
        </div>
        <Link href="/organizer/events/new" className="btn btn-primary">
          <CalendarPlus size={15} /> New event
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile
          tone="violet"
          icon="📅"
          label="Active events"
          value={live.length}
          sub={`${pending} pending review`}
        />
        <StatTile
          tone="emerald"
          icon="🎟️"
          label="Tickets sold"
          value={myTickets.filter((t) => t.status !== "refunded" && t.status !== "cancelled").length}
          sub={`${totalAttendees} checked in`}
        />
        <StatTile
          tone="cyan"
          icon="💰"
          label="Revenue"
          value={fmtPKR(totalRevenue)}
          sub="across all events"
        />
        <StatTile
          tone="amber"
          icon="⚡"
          label="This week"
          value={
            live.filter((e) => {
              const d = new Date(e.date).getTime();
              return d - Date.now() < 7 * 24 * 3600 * 1000;
            }).length
          }
          sub="events approaching"
        />
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-3 gap-3">
        <ActionCard
          href="/organizer/events/new"
          icon={<CalendarPlus size={20} />}
          color="violet"
          title="Submit an event"
          body="Fill out the form, send to ADSA for approval."
        />
        <ActionCard
          href="/organizer/scanner"
          icon={<ScanLine size={20} />}
          color="fuchsia"
          title="Scan tickets at the door"
          body="Validate QR codes for any event you organize."
        />
        <ActionCard
          href="/organizer/finance"
          icon={<TrendingUp size={20} />}
          color="cyan"
          title="View financials"
          body="See revenue, refunds, and payment methods."
        />
      </div>

      {/* live events */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 font-display font-semibold text-lg">
            <Sparkles size={16} className="text-fuchsia-300" />
            Live events
          </div>
          <Link href="/organizer/events" className="text-xs text-fuchsia-300 hover:text-fuchsia-200">
            See all →
          </Link>
        </div>
        {live.length === 0 ? (
          <div className="glass rounded-2xl p-10 text-center">
            <div className="text-5xl mb-3">🌱</div>
            <div className="font-display text-lg font-semibold">No live events right now</div>
            <div className="text-white/55 text-sm mt-1 mb-4">
              Submit one and once admin approves, it'll show up here.
            </div>
            <Link href="/organizer/events/new" className="btn btn-primary">
              Submit your first event
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {live.slice(0, 4).map((e) => (
              <LiveEventCard key={e.id} eventId={e.id} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatTile({
  tone,
  icon,
  label,
  value,
  sub,
}: {
  tone: "violet" | "emerald" | "cyan" | "amber";
  icon: string;
  label: string;
  value: any;
  sub: string;
}) {
  const toneCss: Record<string, string> = {
    violet: "from-violet-500/30 to-violet-500/0 border-violet-400/30",
    emerald: "from-emerald-500/30 to-emerald-500/0 border-emerald-400/30",
    cyan: "from-cyan-500/30 to-cyan-500/0 border-cyan-400/30",
    amber: "from-amber-500/30 to-amber-500/0 border-amber-400/30",
  };
  return (
    <div className={`rounded-2xl p-4 border bg-gradient-to-br ${toneCss[tone]} backdrop-blur-md`}>
      <div className="flex items-center gap-2 text-sm text-white/65">
        <span className="text-xl">{icon}</span> {label}
      </div>
      <div className="font-display text-2xl sm:text-3xl font-bold mt-1.5">{value}</div>
      <div className="text-[11px] text-white/55 mt-0.5">{sub}</div>
    </div>
  );
}

function ActionCard({
  href,
  icon,
  color,
  title,
  body,
}: {
  href: string;
  icon: React.ReactNode;
  color: "violet" | "fuchsia" | "cyan";
  title: string;
  body: string;
}) {
  const c: Record<string, string> = {
    violet: "from-violet-500 to-violet-700",
    fuchsia: "from-fuchsia-500 to-pink-700",
    cyan: "from-cyan-500 to-cyan-700",
  };
  return (
    <Link href={href} className="glass glass-hover rounded-2xl p-5 block group">
      <div
        className={`w-10 h-10 rounded-xl grid place-items-center mb-3 bg-gradient-to-br ${c[color]} text-white shadow-lg`}
      >
        {icon}
      </div>
      <div className="font-display font-semibold flex items-center gap-1">
        {title}
        <ChevronRight
          size={14}
          className="text-white/40 group-hover:translate-x-1 transition"
        />
      </div>
      <div className="text-xs text-white/55 mt-1">{body}</div>
    </Link>
  );
}

function LiveEventCard({ eventId }: { eventId: string }) {
  const event = useStore((s) => s.events.find((e) => e.id === eventId))!;
  const stats = useEventStats(eventId);
  const pct = (stats.sold / event.capacity) * 100;
  return (
    <Link href={`/organizer/events/${event.id}`} className="glass glass-hover rounded-2xl p-4 block">
      <div className="flex items-start gap-3">
        <div
          className="w-12 h-12 rounded-xl grid place-items-center text-2xl shrink-0"
          style={{ background: `linear-gradient(135deg, hsl(${event.coverHue},70%,40%), hsl(${(parseInt(event.coverHue) + 60) % 360},70%,40%))` }}
        >
          {event.coverEmoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] text-white/55">{event.category}</div>
          <div className="font-medium text-sm leading-tight truncate">{event.title}</div>
          <div className="text-xs text-white/55 mt-0.5">
            {fmtDate(event.date, "d MMM • h:mm a")}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-white/60">
        <span className="flex items-center gap-1">
          <Users size={11} /> {stats.sold}/{event.capacity}
        </span>
        <span>{fmtPKR(stats.revenue)}</span>
      </div>
      <div className="h-1.5 mt-1.5 rounded-full bg-white/8 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.min(100, pct)}%`,
            background: "linear-gradient(90deg, #8b5cf6, #d946ef)",
          }}
        />
      </div>
    </Link>
  );
}
