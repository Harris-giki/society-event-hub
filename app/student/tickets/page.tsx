"use client";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { Empty } from "@/components/Empty";
import { fmtDate, fmtPKR } from "@/lib/utils";
import { Calendar, MapPin, QrCode, Ticket as TicketIcon } from "lucide-react";
import { useState } from "react";

export default function MyTicketsPage() {
  const user = useStore((s) => s.currentUser())!;
  const tickets = useStore((s) =>
    s.tickets
      .filter((t) => t.userId === user.id)
      .sort((a, b) => new Date(b.bookedAt).getTime() - new Date(a.bookedAt).getTime())
  );
  const events = useStore((s) => s.events);
  const [tab, setTab] = useState<"active" | "past" | "all">("active");

  const enriched = tickets.map((t) => ({
    ticket: t,
    event: events.find((e) => e.id === t.eventId),
  }));

  const active = enriched.filter(
    ({ event, ticket }) =>
      event &&
      ticket.status === "confirmed" &&
      new Date(event.date).getTime() > Date.now()
  );
  const past = enriched.filter(
    ({ event, ticket }) =>
      event &&
      (ticket.status === "scanned" ||
        (ticket.status === "confirmed" && new Date(event.date).getTime() < Date.now()) ||
        ticket.status === "refunded" ||
        ticket.status === "cancelled")
  );

  const list = tab === "active" ? active : tab === "past" ? past : enriched;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold flex items-center gap-2.5">
          <TicketIcon size={26} /> My Tickets
        </h1>
        <p className="text-white/55 text-sm mt-1">
          Every event you've booked — past and present.
        </p>
      </div>

      <div className="flex gap-1.5 p-1 bg-white/5 rounded-xl border border-white/8 w-fit">
        {[
          { k: "active", label: `Active (${active.length})` },
          { k: "past", label: `Past (${past.length})` },
          { k: "all", label: `All (${enriched.length})` },
        ].map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k as any)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
              tab === t.k
                ? "bg-gradient-to-br from-violet-500/80 to-fuchsia-500/80 text-white"
                : "text-white/60 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <Empty
          icon="🎟️"
          title="No tickets here yet"
          body={tab === "past" ? "Past tickets will appear here after you attend an event." : "You haven't booked any events yet. Discover what's on!"}
          action={
            <Link href="/student/events" className="btn btn-primary">
              Browse events
            </Link>
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map(({ ticket, event }) =>
            event ? (
              <Link
                key={ticket.id}
                href={`/student/tickets/${ticket.id}`}
                className="glass glass-hover rounded-2xl p-4 block"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-14 h-14 rounded-xl grid place-items-center text-2xl shrink-0"
                    style={{
                      background: `linear-gradient(135deg, hsl(${event.coverHue},70%,40%), hsl(${(parseInt(event.coverHue) + 60) % 360},70%,40%))`,
                    }}
                  >
                    {event.coverEmoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] text-white/55">{event.society}</div>
                    <div className="font-medium text-sm leading-tight">{event.title}</div>
                  </div>
                </div>
                <div className="mt-3 space-y-1 text-xs text-white/60">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={11} /> {fmtDate(event.date, "EEE, d MMM • h:mm a")}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin size={11} /> {event.venue}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/8">
                  <span
                    className={`chip text-[10px] ${
                      ticket.status === "scanned"
                        ? "chip-emerald"
                        : ticket.status === "refunded"
                        ? "chip-rose"
                        : ticket.status === "cancelled"
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
                  <span className="text-xs text-fuchsia-300 flex items-center gap-1">
                    <QrCode size={12} /> View QR
                  </span>
                </div>
              </Link>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}
