"use client";
import { useState } from "react";
import Link from "next/link";
import { useStore, useEventStats } from "@/lib/store";
import { Empty } from "@/components/Empty";
import { EventCover } from "@/components/EventCover";
import {
  fmtDate,
  fmtPKR,
  isUpcoming,
  classNames,
} from "@/lib/utils";
import { SlidersHorizontal, Calendar, MapPin } from "lucide-react";
import { EventCategory } from "@/lib/types";

const CATS: (EventCategory | "All")[] = [
  "All",
  "Workshop",
  "Seminar",
  "Competition",
  "Tech",
  "Cultural",
  "Sports",
];

export default function DiscoverEvents() {
  const events = useStore((s) =>
    s.events.filter((e) => e.status === "approved" && isUpcoming(e))
  );
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<typeof CATS[number]>("All");
  const [sort, setSort] = useState<"date" | "price-asc" | "price-desc">("date");
  const [showFree, setShowFree] = useState(false);

  let list = [...events];
  if (cat !== "All") list = list.filter((e) => e.category === cat);
  if (q.trim()) {
    const lower = q.toLowerCase();
    list = list.filter(
      (e) =>
        e.title.toLowerCase().includes(lower) ||
        e.society.toLowerCase().includes(lower) ||
        e.venue.toLowerCase().includes(lower)
    );
  }
  if (showFree) list = list.filter((e) => e.ticketPrice === 0);
  list.sort((a, b) => {
    if (sort === "price-asc") return a.ticketPrice - b.ticketPrice;
    if (sort === "price-desc") return b.ticketPrice - a.ticketPrice;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Discover Events</h1>
        <p className="text-white/55 text-sm mt-1">
          Every approved society event on campus, filterable.
        </p>
      </div>

      {/* search + filters */}
      <div className="glass rounded-2xl p-3 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            className="input flex-1"
            placeholder="Search events, societies, venues…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            className="select sm:w-44"
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
          >
            <option value="date">Sort: Soonest first</option>
            <option value="price-asc">Sort: Price (low → high)</option>
            <option value="price-desc">Sort: Price (high → low)</option>
          </select>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
          {CATS.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={classNames(
                "px-3 py-1.5 rounded-full text-xs font-medium border shrink-0 transition",
                cat === c
                  ? "bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white border-transparent"
                  : "border-white/12 text-white/70 hover:bg-white/5"
              )}
            >
              {c}
            </button>
          ))}
          <div className="ml-2 h-5 w-px bg-white/10" />
          <button
            onClick={() => setShowFree((v) => !v)}
            className={classNames(
              "px-3 py-1.5 rounded-full text-xs font-medium border shrink-0 transition",
              showFree
                ? "bg-emerald-500/20 text-emerald-200 border-emerald-400/40"
                : "border-white/12 text-white/70 hover:bg-white/5"
            )}
          >
            ✨ Free only
          </button>
        </div>
      </div>

      {/* results */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-white/55">
          Showing <span className="text-white font-semibold">{list.length}</span> of{" "}
          {events.length} events
        </div>
        {(q || cat !== "All" || showFree) && (
          <button
            onClick={() => { setQ(""); setCat("All"); setShowFree(false); }}
            className="text-xs text-fuchsia-300 hover:text-fuchsia-200 flex items-center gap-1"
          >
            <SlidersHorizontal size={12} /> Clear filters
          </button>
        )}
      </div>

      {list.length === 0 ? (
        <Empty
          icon="🔍"
          title="No events match those filters"
          body="Try clearing your filters or searching for something else."
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((e) => (
            <EventListCard key={e.id} eventId={e.id} />
          ))}
        </div>
      )}
    </div>
  );
}

function EventListCard({ eventId }: { eventId: string }) {
  const event = useStore((s) => s.events.find((e) => e.id === eventId));
  const stats = useEventStats(eventId);
  if (!event) return null;
  const remaining = event.capacity - stats.sold;
  const lowStock = remaining <= event.capacity * 0.2 && remaining > 0;
  const soldOut = remaining <= 0;
  return (
    <Link
      href={`/student/events/${event.id}`}
      className="glass glass-hover rounded-2xl overflow-hidden block group"
    >
      <EventCover
        hue={event.coverHue}
        emoji={event.coverEmoji}
        category={event.category}
        height={150}
      />
      <div className="p-4">
        <div className="text-[11px] text-white/50">{event.society}</div>
        <div className="font-display font-semibold text-base leading-tight mt-1 line-clamp-2 min-h-[2.5rem]">
          {event.title}
        </div>
        <div className="flex flex-col gap-1.5 text-xs text-white/60 mt-3">
          <span className="flex items-center gap-1.5">
            <Calendar size={11} /> {fmtDate(event.date, "EEE, d MMM • h:mm a")}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin size={11} /> {event.venue}
          </span>
        </div>
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/8">
          <span className="text-sm font-semibold">{fmtPKR(event.ticketPrice)}</span>
          <span
            className={`chip text-[10px] ${
              soldOut
                ? "chip-rose"
                : lowStock
                ? "chip-amber"
                : "chip-emerald"
            }`}
          >
            {soldOut ? "Sold out" : lowStock ? `${remaining} left` : "Available"}
          </span>
        </div>
      </div>
    </Link>
  );
}
