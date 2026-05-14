"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { fmtDate } from "@/lib/utils";
import {
  BarChart3,
  Calendar,
  Users,
  Activity,
  Ticket,
  X,
  ChevronRight,
  Mail,
  Phone,
} from "lucide-react";
import { Modal } from "@/components/Modal";
import { Avatar } from "@/components/Avatar";

export default function AnalyticsPage() {
  const events = useStore((s) => s.events);
  const tickets = useStore((s) => s.tickets);
  const users = useStore((s) => s.users);
  const reviews = useStore((s) => s.reviews);

  const [societyDrill, setSocietyDrill] = useState<string | null>(null);

  const byCategory = events.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + 1;
    return acc;
  }, {});
  const maxCat = Math.max(...Object.values(byCategory), 1);

  const bySociety = events.reduce<Record<string, { count: number; sold: number; scanned: number }>>(
    (acc, e) => {
      const t = tickets.filter((x) => x.eventId === e.id);
      const sold = t.filter((x) => x.status !== "refunded" && x.status !== "cancelled").length;
      const scanned = t.filter((x) => x.status === "scanned").length;
      if (!acc[e.society]) acc[e.society] = { count: 0, sold: 0, scanned: 0 };
      acc[e.society].count += 1;
      acc[e.society].sold += sold;
      acc[e.society].scanned += scanned;
      return acc;
    },
    {}
  );

  const months: string[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toLocaleString("en-PK", { month: "short" }));
  }
  const monthCounts = months.map((m) => {
    return events.filter((e) => {
      const d = new Date(e.date);
      return d.toLocaleString("en-PK", { month: "short" }) === m;
    }).length;
  });
  const monthMax = Math.max(...monthCounts, 1);

  const studentCount = users.filter((u) => u.role === "student").length;
  const organizerCount = users.filter((u) => u.role === "organizer").length;
  const gikianStudentCount = users.filter((u) => u.role === "student" && u.isGikian).length;
  const nonGikianStudentCount = studentCount - gikianStudentCount;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold flex items-center gap-2.5">
          <BarChart3 size={26} /> Analytics
        </h1>
        <p className="text-white/55 text-sm mt-1">
          Big-picture view of campus event activity. Click a society to drill down.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={<Calendar size={18} />} label="Total events" value={events.length} sub={`${events.filter((e) => e.status === "approved").length} approved`} tone="violet" />
        <KpiCard icon={<Ticket size={18} />} label="Tickets sold" value={tickets.filter((t) => t.status !== "refunded" && t.status !== "cancelled").length} sub={`${tickets.filter((t) => t.status === "scanned").length} checked in`} tone="emerald" />
        <KpiCard icon={<Users size={18} />} label="Active users" value={users.length} sub={`${gikianStudentCount} GIKI · ${nonGikianStudentCount} external · ${organizerCount} organizers`} tone="cyan" />
        <KpiCard icon={<Activity size={18} />} label="Avg attendance" value={`${Math.round((tickets.filter((t) => t.status === "scanned").length / Math.max(1, tickets.length)) * 100)}%`} sub="of bookings checked in" tone="amber" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-5">
          <div className="font-display font-semibold mb-4">Events by category</div>
          <div className="space-y-2.5">
            {Object.entries(byCategory).map(([k, v]) => (
              <div key={k}>
                <div className="flex items-center justify-between text-sm">
                  <span>{k}</span>
                  <span className="text-white/65">{v}</span>
                </div>
                <div className="h-2 rounded-full bg-white/8 overflow-hidden mt-1">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(v / maxCat) * 100}%`,
                      background: "linear-gradient(90deg, #8b5cf6, #d946ef, #22d3ee)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="font-display font-semibold mb-4">Events per month</div>
          <div className="flex items-end justify-between h-40 gap-2">
            {months.map((m, i) => {
              const h = (monthCounts[i] / monthMax) * 100;
              return (
                <div key={i} className="flex flex-col items-center justify-end gap-1.5 flex-1">
                  <div
                    className="w-full rounded-t-lg transition-all"
                    style={{
                      height: `${h}%`,
                      background: "linear-gradient(180deg, rgba(217,70,239,0.9), rgba(139,92,246,0.6))",
                      minHeight: monthCounts[i] > 0 ? "8px" : "2px",
                    }}
                  />
                  <div className="text-[10px] text-white/55">{m}</div>
                  <div className="text-[11px] font-semibold">{monthCounts[i]}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-5">
        <div className="font-display font-semibold mb-4 flex items-center gap-2">
          Society activity
          <span className="chip text-[10px]">click row to drill down</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-white/55 border-b border-white/8">
                <th className="px-2 py-2 font-medium">Society</th>
                <th className="px-2 py-2 font-medium">Events</th>
                <th className="px-2 py-2 font-medium">Tickets sold</th>
                <th className="px-2 py-2 font-medium">Checked in</th>
                <th className="px-2 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(bySociety)
                .sort((a, b) => b[1].count - a[1].count)
                .map(([s, v]) => (
                  <tr
                    key={s}
                    className="border-b border-white/5 hover:bg-white/[0.06] transition cursor-pointer"
                    onClick={() => setSocietyDrill(s)}
                  >
                    <td className="px-2 py-3 font-medium">{s}</td>
                    <td className="px-2 py-3">{v.count}</td>
                    <td className="px-2 py-3">{v.sold}</td>
                    <td className="px-2 py-3 font-display font-semibold">{v.scanned}</td>
                    <td className="px-2 py-3 text-right">
                      <ChevronRight size={14} className="text-white/40 inline" />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <SocietyDrillModal
        societyName={societyDrill}
        onClose={() => setSocietyDrill(null)}
      />
    </div>
  );
}

function SocietyDrillModal({
  societyName,
  onClose,
}: {
  societyName: string | null;
  onClose: () => void;
}) {
  const events = useStore((s) =>
    societyName ? s.events.filter((e) => e.society === societyName) : []
  );
  const tickets = useStore((s) => s.tickets);
  const users = useStore((s) => s.users);
  const reviews = useStore((s) => s.reviews);
  const societies = useStore((s) => s.societies);

  if (!societyName) return null;

  const soc = societies.find((s) => s.name === societyName);
  const orgs = users.filter(
    (u) => u.role === "organizer" && u.society === societyName
  );
  const totalSold = events.reduce(
    (acc, e) =>
      acc +
      tickets.filter(
        (t) => t.eventId === e.id && t.status !== "refunded" && t.status !== "cancelled"
      ).length,
    0
  );
  const totalScanned = events.reduce(
    (acc, e) => acc + tickets.filter((t) => t.eventId === e.id && t.status === "scanned").length,
    0
  );
  const allReviews = reviews.filter((r) => events.some((e) => e.id === r.eventId));
  const avgRating =
    allReviews.length === 0
      ? 0
      : allReviews.reduce((a, r) => a + r.rating, 0) / allReviews.length;

  return (
    <Modal open={!!societyName} onClose={onClose} title={societyName} maxWidth="max-w-3xl">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        {soc?.description && (
          <div className="text-sm text-white/70">{soc.description}</div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Stat label="Events" value={events.length} />
          <Stat label="Tickets sold" value={totalSold} />
          <Stat label="Checked in" value={totalScanned} />
          <Stat
            label="Avg rating"
            value={avgRating > 0 ? `${avgRating.toFixed(1)} ★` : "—"}
          />
        </div>

        <div>
          <div className="font-display font-semibold mb-2 text-sm">
            Organizers ({orgs.length})
          </div>
          {orgs.length === 0 ? (
            <div className="text-xs text-white/55">
              No organizer accounts associated yet.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-2">
              {orgs.map((o) => (
                <div
                  key={o.id}
                  className="glass rounded-xl p-3 flex items-center gap-3"
                >
                  <Avatar name={o.name} seed={o.avatarSeed} size={36} />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{o.name}</div>
                    <div className="text-[11px] text-white/55 truncate flex items-center gap-1">
                      <Mail size={10} /> {o.email}
                    </div>
                    {o.phone && (
                      <div className="text-[11px] text-white/55 truncate flex items-center gap-1">
                        <Phone size={10} /> {o.phone}
                      </div>
                    )}
                  </div>
                  <span
                    className={`chip text-[10px] ml-auto ${
                      (o.accountStatus ?? "approved") === "approved"
                        ? "chip-emerald"
                        : (o.accountStatus ?? "approved") === "pending"
                        ? "chip-amber"
                        : "chip-rose"
                    }`}
                  >
                    {o.accountStatus ?? "approved"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="font-display font-semibold mb-2 text-sm">
            All events ({events.length})
          </div>
          {events.length === 0 ? (
            <div className="text-xs text-white/55">No events yet.</div>
          ) : (
            <div className="space-y-1.5">
              {events
                .sort(
                  (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                )
                .map((e) => {
                  const sold = tickets.filter(
                    (t) =>
                      t.eventId === e.id &&
                      t.status !== "refunded" &&
                      t.status !== "cancelled"
                  ).length;
                  return (
                    <div
                      key={e.id}
                      className="rounded-xl p-3 bg-white/[0.03] border border-white/5 flex items-center gap-3"
                    >
                      <div
                        className="w-10 h-10 rounded-lg grid place-items-center text-xl shrink-0"
                        style={{
                          background: `linear-gradient(135deg, hsl(${e.coverHue},70%,40%), hsl(${(parseInt(e.coverHue) + 60) % 360},70%,40%))`,
                        }}
                      >
                        {e.coverEmoji}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate flex items-center gap-2">
                          {e.title}
                          <span
                            className={`chip text-[10px] ${
                              e.status === "approved"
                                ? "chip-emerald"
                                : e.status === "pending"
                                ? "chip-amber"
                                : e.status === "rejected"
                                ? "chip-rose"
                                : ""
                            }`}
                          >
                            {e.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-white/55">
                          {fmtDate(e.date, "d MMM • h:mm a")} · {e.venue}
                        </div>
                      </div>
                      <div className="text-xs text-white/65 shrink-0 text-right">
                        <div className="font-display font-bold text-white">{sold}</div>
                        <div>sold</div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {allReviews.length > 0 && (
          <div>
            <div className="font-display font-semibold mb-2 text-sm">
              Recent reviews ({allReviews.length})
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {allReviews.slice(0, 10).map((r) => {
                const reviewer = users.find((u) => u.id === r.userId);
                const ev = events.find((e) => e.id === r.eventId);
                return (
                  <div
                    key={r.id}
                    className="rounded-xl p-3 bg-amber-500/5 border border-amber-400/15"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="font-medium truncate">{reviewer?.name ?? "—"}</div>
                      <div className="text-amber-300 font-mono shrink-0">
                        {"★".repeat(r.rating)}
                      </div>
                    </div>
                    <div className="text-[11px] text-white/55 mb-1">{ev?.title}</div>
                    <div className="text-sm text-white/80">{r.body}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="glass rounded-xl p-3 text-center">
      <div className="font-display text-2xl font-bold">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-white/55 mt-0.5">{label}</div>
    </div>
  );
}

function KpiCard({
  icon, label, value, sub, tone,
}: {
  icon: React.ReactNode; label: string; value: any; sub: string;
  tone: "violet" | "emerald" | "cyan" | "amber";
}) {
  const cls: Record<string, string> = {
    violet: "from-violet-500/25 to-violet-500/0 border-violet-400/30",
    emerald: "from-emerald-500/25 to-emerald-500/0 border-emerald-400/30",
    cyan: "from-cyan-500/25 to-cyan-500/0 border-cyan-400/30",
    amber: "from-amber-500/25 to-amber-500/0 border-amber-400/30",
  };
  return (
    <div className={`rounded-2xl p-4 border bg-gradient-to-br ${cls[tone]} backdrop-blur-md`}>
      <div className="flex items-center gap-2 text-white/65 text-sm">
        {icon} {label}
      </div>
      <div className="font-display text-xl sm:text-2xl font-bold mt-1.5">{value}</div>
      <div className="text-[11px] text-white/55 mt-0.5">{sub}</div>
    </div>
  );
}
