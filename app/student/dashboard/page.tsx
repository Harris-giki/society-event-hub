"use client";
import Link from "next/link";
import { useStore, useEventStats } from "@/lib/store";
import { Empty } from "@/components/Empty";
import { EventCover } from "@/components/EventCover";
import { fmtDate, fmtPKR, isUpcoming } from "@/lib/utils";
import { ArrowRight, Calendar, MapPin, Sparkles, Ticket } from "lucide-react";

export default function StudentDashboard() {
  const user = useStore((s) => s.currentUser())!;
  const events = useStore((s) => s.events);
  const tickets = useStore((s) =>
    s.tickets.filter((t) => t.userId === user.id)
  );

  const upcoming = events
    .filter((e) => e.status === "approved" && isUpcoming(e))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const featured = upcoming[0];
  const next3 = upcoming.slice(1, 4);
  const myActiveTickets = tickets.filter(
    (t) => t.status === "confirmed" || t.status === "scanned"
  );

  return (
    <div className="space-y-8">
      {/* greeting */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-sm text-white/55">
            {new Date().toLocaleDateString("en-PK", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold mt-1">
            Hey <span className="text-gradient">{user.name.split(" ")[0]}</span>,
            ready to plan your week?
          </h1>
        </div>
        <Link href="/student/events" className="btn btn-secondary">
          Browse all events <ArrowRight size={15} />
        </Link>
      </div>

      {/* quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Active tickets" value={myActiveTickets.length.toString()} icon="🎟️" />
        <StatCard label="Events this week" value={upcoming.filter((e) => {
          const d = new Date(e.date);
          const now = new Date();
          const diff = (d.getTime() - now.getTime()) / (1000 * 3600 * 24);
          return diff >= 0 && diff <= 7;
        }).length.toString()} icon="📅" />
        <StatCard label="Free events open" value={upcoming.filter((e) => e.ticketPrice === 0).length.toString()} icon="✨" />
        <StatCard label="Past attended" value={tickets.filter((t) => t.status === "scanned").length.toString()} icon="🏁" />
      </div>

      {/* featured */}
      {featured && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 font-display font-semibold text-lg">
              <Sparkles size={16} className="text-fuchsia-300" />
              Spotlight event
            </div>
            <Link
              href={`/student/events/${featured.id}`}
              className="text-xs text-fuchsia-300 hover:text-fuchsia-200"
            >
              View details →
            </Link>
          </div>
          <FeaturedCard eventId={featured.id} />
        </section>
      )}

      {/* upcoming */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="font-display font-semibold text-lg">More coming up</div>
          <Link
            href="/student/events"
            className="text-xs text-fuchsia-300 hover:text-fuchsia-200"
          >
            See all →
          </Link>
        </div>
        {next3.length === 0 ? (
          <Empty
            icon="🌙"
            title="Nothing else scheduled yet"
            body="Check back soon — new society events are added every week."
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {next3.map((e) => (
              <MiniEventCard key={e.id} eventId={e.id} />
            ))}
          </div>
        )}
      </section>

      {/* your tickets */}
      {myActiveTickets.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="font-display font-semibold text-lg">Your tickets</div>
            <Link
              href="/student/tickets"
              className="text-xs text-fuchsia-300 hover:text-fuchsia-200"
            >
              Manage →
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {myActiveTickets.slice(0, 4).map((t) => {
              const ev = events.find((e) => e.id === t.eventId);
              if (!ev) return null;
              return (
                <Link
                  key={t.id}
                  href={`/student/tickets/${t.id}`}
                  className="glass glass-hover rounded-2xl p-4 flex gap-3"
                >
                  <div
                    className="w-20 h-20 rounded-xl grid place-items-center text-3xl shrink-0"
                    style={{
                      background: `linear-gradient(135deg, hsl(${ev.coverHue},70%,40%), hsl(${(parseInt(ev.coverHue) + 50) % 360},70%,40%))`,
                    }}
                  >
                    {ev.coverEmoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-white/55">{ev.society}</div>
                    <div className="font-medium text-sm truncate">{ev.title}</div>
                    <div className="text-xs text-white/55 mt-1 flex items-center gap-1.5">
                      <Calendar size={11} /> {fmtDate(ev.date, "d MMM • h:mm a")}
                    </div>
                    <div className="mt-2">
                      <span
                        className={`chip text-[10px] ${
                          t.status === "scanned" ? "chip-emerald" : "chip-violet"
                        }`}
                      >
                        {t.status === "scanned" ? "Checked in" : "Confirmed"}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="glass rounded-2xl p-4 flex items-center gap-3">
      <div className="text-2xl">{icon}</div>
      <div>
        <div className="text-[11px] text-white/55">{label}</div>
        <div className="font-display text-2xl font-bold">{value}</div>
      </div>
    </div>
  );
}

function FeaturedCard({ eventId }: { eventId: string }) {
  const event = useStore((s) => s.events.find((e) => e.id === eventId));
  const stats = useEventStats(eventId);
  if (!event) return null;
  const remaining = event.capacity - stats.sold;
  const lowStock = remaining <= event.capacity * 0.2;
  return (
    <Link href={`/student/events/${event.id}`} className="block">
      <div className="gradient-border-card overflow-hidden grid md:grid-cols-[1.2fr_1fr]">
        <div
          className="h-56 md:h-auto p-6 flex flex-col justify-end relative"
          style={{
            background: `radial-gradient(80% 80% at 30% 20%, hsla(${event.coverHue},90%,65%,0.6), transparent 60%), radial-gradient(80% 80% at 80% 80%, hsla(${(parseInt(event.coverHue) + 60) % 360},90%,65%,0.5), transparent 60%), linear-gradient(135deg, hsl(${event.coverHue},60%,18%), hsl(${(parseInt(event.coverHue) + 40) % 360},50%,12%))`,
          }}
        >
          <div className="text-6xl absolute top-5 right-5 drop-shadow-lg">{event.coverEmoji}</div>
          <span className="chip chip-cyan w-fit mb-2">{event.category}</span>
          <div className="font-display text-2xl sm:text-3xl font-bold leading-tight">
            {event.title}
          </div>
        </div>
        <div className="p-6 flex flex-col gap-3">
          <div className="text-sm text-white/70">{event.description}</div>
          <div className="space-y-1.5 text-sm pt-2">
            <div className="flex items-center gap-2 text-white/70">
              <Calendar size={14} /> {fmtDate(event.date)}
            </div>
            <div className="flex items-center gap-2 text-white/70">
              <MapPin size={14} /> {event.venue}
            </div>
            <div className="flex items-center gap-2 text-white/70">
              <Ticket size={14} /> {fmtPKR(event.ticketPrice)}
            </div>
          </div>
          <div className="mt-auto flex items-center justify-between gap-3 pt-3">
            <div className="text-xs">
              <span className={lowStock ? "text-amber-300" : "text-emerald-300"}>
                {remaining} of {event.capacity} seats left
              </span>
            </div>
            <span className="btn btn-primary text-sm">
              Book now <ArrowRight size={14} />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function MiniEventCard({ eventId }: { eventId: string }) {
  const event = useStore((s) => s.events.find((e) => e.id === eventId));
  const stats = useEventStats(eventId);
  if (!event) return null;
  return (
    <Link
      href={`/student/events/${event.id}`}
      className="glass glass-hover rounded-2xl overflow-hidden block"
    >
      <EventCover
        hue={event.coverHue}
        emoji={event.coverEmoji}
        category={event.category}
        height={140}
      />
      <div className="p-4">
        <div className="text-[11px] text-white/50">{event.society}</div>
        <div className="font-display font-semibold text-base leading-tight mt-1">
          {event.title}
        </div>
        <div className="flex items-center gap-3 text-xs text-white/60 mt-2">
          <span>{fmtDate(event.date, "d MMM • h:mm a")}</span>
        </div>
        <div className="flex items-center justify-between mt-3">
          <span className="text-sm font-semibold">{fmtPKR(event.ticketPrice)}</span>
          <span className="text-xs text-white/60">
            {event.capacity - stats.sold} left
          </span>
        </div>
      </div>
    </Link>
  );
}
