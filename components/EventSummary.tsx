"use client";
import { useStore } from "@/lib/store";
import { fmtDate, fmtPKR } from "@/lib/utils";
import { Avatar } from "./Avatar";
import {
  Activity,
  Star,
  Ticket as TicketIcon,
  CheckCircle2,
  XCircle,
  CreditCard,
  Wallet,
  Globe2,
} from "lucide-react";

/**
 * Event summary panel for an organizer — booked vs. checked-in vs. no-show,
 * payment-method split, non-GIKI attendee count, and aggregate review snapshot.
 */
export function EventSummary({ eventId }: { eventId: string }) {
  const event = useStore((s) => s.events.find((e) => e.id === eventId));
  const tickets = useStore((s) =>
    s.tickets.filter((t) => t.eventId === eventId)
  );
  const reviews = useStore((s) =>
    s.reviews
      .filter((r) => r.eventId === eventId)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
  );
  const users = useStore((s) => s.users);

  if (!event) return null;

  const booked = tickets.filter(
    (t) => t.status === "confirmed" || t.status === "scanned"
  );
  const checkedIn = tickets.filter((t) => t.status === "scanned");
  const noShow = tickets.filter(
    (t) =>
      t.status === "confirmed" &&
      new Date(event.date).getTime() < Date.now()
  );
  const refunded = tickets.filter((t) => t.status === "refunded");

  const eventStarted = new Date(event.date).getTime() < Date.now();
  const attendanceRate =
    booked.length > 0 ? Math.round((checkedIn.length / booked.length) * 100) : 0;
  const fillRate = Math.round((booked.length / event.capacity) * 100);

  const onlineCount = booked.filter((t) => t.paymentMethod === "online").length;
  const cashCount = booked.filter((t) => t.paymentMethod === "cash").length;
  const nonGikiCount = booked.filter((t) => {
    const u = users.find((x) => x.id === t.userId);
    return u && !u.isGikian;
  }).length;

  const avgRating =
    reviews.length === 0
      ? 0
      : reviews.reduce((a, r) => a + r.rating, 0) / reviews.length;
  const ratingDist = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((r) => r.rating === stars).length,
  }));

  return (
    <div className="glass rounded-2xl p-5 space-y-5">
      <div className="flex items-center gap-2">
        <Activity size={18} className="text-fuchsia-300" />
        <div className="font-display font-semibold text-lg">Event summary</div>
        {!eventStarted && (
          <span className="chip chip-amber text-[10px] ml-auto">
            Event hasn't happened yet
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <Tile
          icon={<TicketIcon size={16} className="text-violet-300" />}
          label="Booked"
          value={booked.length}
          sub={`${fillRate}% of ${event.capacity} seats`}
        />
        <Tile
          icon={<CheckCircle2 size={16} className="text-emerald-300" />}
          label="Checked in"
          value={checkedIn.length}
          sub={`${attendanceRate}% attendance`}
        />
        <Tile
          icon={<XCircle size={16} className="text-amber-300" />}
          label="No-show"
          value={noShow.length}
          sub={eventStarted ? "after event date" : "—"}
        />
        <Tile
          icon={<XCircle size={16} className="text-rose-300" />}
          label="Refunded"
          value={refunded.length}
          sub="cancelled tickets"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="rounded-xl p-3 bg-white/[0.03] border border-white/8">
          <div className="text-xs text-white/55 mb-2">Payment split</div>
          <div className="flex gap-1.5 h-3 rounded-full overflow-hidden bg-white/8">
            <div
              className="bg-violet-500"
              style={{ width: `${(onlineCount / Math.max(1, booked.length)) * 100}%` }}
              title={`${onlineCount} online`}
            />
            <div
              className="bg-amber-500"
              style={{ width: `${(cashCount / Math.max(1, booked.length)) * 100}%` }}
              title={`${cashCount} cash`}
            />
          </div>
          <div className="flex justify-between text-[11px] text-white/65 mt-1.5">
            <span className="flex items-center gap-1">
              <CreditCard size={11} /> {onlineCount} online
            </span>
            <span className="flex items-center gap-1">
              <Wallet size={11} /> {cashCount} cash
            </span>
          </div>
        </div>
        <div className="rounded-xl p-3 bg-white/[0.03] border border-white/8 flex items-center justify-between">
          <div>
            <div className="text-xs text-white/55">Audience</div>
            <div className="font-display text-xl font-bold mt-0.5">
              {booked.length - nonGikiCount} <span className="text-white/45 text-base font-normal">GIKI</span>
              {nonGikiCount > 0 && (
                <> · {nonGikiCount} <span className="text-white/45 text-base font-normal">external</span></>
              )}
            </div>
          </div>
          {event.allowNonGikian && (
            <span className="chip chip-cyan text-[10px]">
              <Globe2 size={10} /> open to all
            </span>
          )}
        </div>
      </div>

      {/* Reviews snapshot */}
      <div className="rounded-xl p-4 bg-amber-500/5 border border-amber-400/15 space-y-3">
        <div className="flex items-center justify-between">
          <div className="font-display font-semibold flex items-center gap-2">
            <Star size={16} className="text-amber-300" /> Attendee reviews
            <span className="chip text-[10px]">{reviews.length}</span>
          </div>
          {reviews.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="font-display text-2xl font-bold text-amber-300">
                {avgRating.toFixed(1)}
              </span>
              <span className="text-amber-300/80 text-sm">/ 5</span>
            </div>
          )}
        </div>

        {reviews.length === 0 ? (
          <div className="text-xs text-white/55 text-center py-3">
            {eventStarted
              ? "No reviews yet — attendees will be prompted after check-in."
              : "Reviews unlock after the event."}
          </div>
        ) : (
          <>
            <div className="space-y-1">
              {ratingDist.map(({ stars, count }) => {
                const pct = (count / reviews.length) * 100;
                return (
                  <div key={stars} className="flex items-center gap-2 text-xs">
                    <span className="w-6 text-amber-300/80 font-mono">{stars}★</span>
                    <div className="flex-1 h-1.5 rounded-full bg-white/8 overflow-hidden">
                      <div
                        className="h-full bg-amber-400/80"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-6 text-right text-white/55">{count}</span>
                  </div>
                );
              })}
            </div>
            <div className="space-y-1.5 pt-2">
              {reviews.slice(0, 6).map((r) => {
                const reviewer = users.find((u) => u.id === r.userId);
                return (
                  <div
                    key={r.id}
                    className="rounded-xl p-3 bg-white/[0.03] border border-white/8"
                  >
                    <div className="flex items-center gap-2.5 mb-1">
                      <Avatar
                        name={reviewer?.name ?? "Anon"}
                        seed={reviewer?.avatarSeed}
                        size={26}
                      />
                      <div className="text-sm font-medium truncate flex-1">
                        {reviewer?.name ?? "Anonymous"}
                      </div>
                      <div className="text-amber-300 font-mono text-xs">
                        {"★".repeat(r.rating)}
                        <span className="text-white/20">
                          {"★".repeat(5 - r.rating)}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-white/80 leading-relaxed">
                      {r.body}
                    </div>
                    <div className="text-[10px] text-white/40 mt-1.5">
                      {fmtDate(r.createdAt, "d MMM • h:mm a")}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Tile({
  icon, label, value, sub,
}: { icon: React.ReactNode; label: string; value: any; sub: string }) {
  return (
    <div className="rounded-xl p-3 bg-white/[0.03] border border-white/8">
      <div className="flex items-center gap-1.5 text-[11px] text-white/55">
        {icon} {label}
      </div>
      <div className="font-display text-2xl font-bold mt-0.5">{value}</div>
      <div className="text-[11px] text-white/45">{sub}</div>
    </div>
  );
}
