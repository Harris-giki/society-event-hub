"use client";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { fmtDate, detectConflicts, isUpcoming } from "@/lib/utils";
import {
  ClipboardCheck,
  AlertTriangle,
  CalendarDays,
} from "lucide-react";

export default function AdminDashboard() {
  const user = useStore((s) => s.currentUser())!;
  const events = useStore((s) => s.events);
  const users = useStore((s) => s.users);
  const tickets = useStore((s) => s.tickets);

  const pending = events.filter((e) => e.status === "pending");
  const approved = events.filter((e) => e.status === "approved");
  const upcoming = approved.filter(isUpcoming);
  const conflicts = detectConflicts(events);
  const totalScanned = tickets.filter((t) => t.status === "scanned").length;
  const totalSold = tickets.filter((t) => t.status !== "refunded" && t.status !== "cancelled").length;

  // next 7 days
  const next7 = upcoming.filter((e) => {
    const d = new Date(e.date).getTime();
    return d - Date.now() < 7 * 24 * 3600_000;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-sm text-white/55">
            Dean of Student Affairs
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold mt-1">
            Good day, <span className="text-gradient">{user.name.split(" ")[0]}</span>.
          </h1>
        </div>
        {pending.length > 0 && (
          <Link href="/admin/approvals" className="btn btn-primary">
            <ClipboardCheck size={15} /> Review {pending.length} event{pending.length > 1 ? "s" : ""}
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Tile icon="📋" label="Awaiting approval" value={pending.length} tone="amber" />
        <Tile icon="📅" label="This week" value={next7.length} tone="violet" />
        <Tile icon="🎟️" label="Total tickets sold" value={totalSold} tone="emerald" />
        <Tile icon="✅" label="Total checked in" value={totalScanned} tone="cyan" />
      </div>

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
        {/* Pending approvals */}
        <div className="glass rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-display font-semibold flex items-center gap-2">
              <ClipboardCheck size={16} className="text-amber-300" />
              Pending approvals
            </div>
            <Link href="/admin/approvals" className="text-xs text-fuchsia-300 hover:text-fuchsia-200">
              All →
            </Link>
          </div>
          {pending.length === 0 ? (
            <div className="text-center py-8 text-sm text-white/55">
              🎉 Inbox zero. No events awaiting your review.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {pending.slice(0, 4).map((e) => (
                <Link
                  key={e.id}
                  href={`/admin/approvals#${e.id}`}
                  className="rounded-xl p-3 hover:bg-white/5 transition flex items-center gap-3"
                >
                  <div
                    className="w-12 h-12 rounded-xl grid place-items-center text-2xl shrink-0"
                    style={{ background: `linear-gradient(135deg, hsl(${e.coverHue},70%,40%), hsl(${(parseInt(e.coverHue) + 60) % 360},70%,40%))` }}
                  >
                    {e.coverEmoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{e.title}</div>
                    <div className="text-xs text-white/55 truncate">
                      {e.society} • {fmtDate(e.date, "d MMM")} • {e.venue}
                    </div>
                  </div>
                  <span className="chip chip-amber text-[10px] shrink-0">Review</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Conflicts */}
        <div className="glass rounded-2xl p-5">
          <div className="font-display font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-rose-300" />
            Schedule conflicts
            {conflicts.length > 0 && (
              <span className="chip chip-rose text-[10px]">{conflicts.length}</span>
            )}
          </div>
          {conflicts.length === 0 ? (
            <div className="text-center py-6 text-sm text-white/55">
              ✅ No venue conflicts detected.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {conflicts.slice(0, 4).map(({ a, b }, i) => (
                <div key={i} className="rounded-xl p-3 bg-rose-500/10 border border-rose-400/30">
                  <div className="text-xs text-rose-200 mb-1.5">
                    <span className="font-semibold">{a.venue}</span> double-booked
                  </div>
                  <div className="text-xs space-y-0.5 text-white/70">
                    <div>• {a.title} — {fmtDate(a.date, "d MMM • h:mm a")}</div>
                    <div>• {b.title} — {fmtDate(b.date, "d MMM • h:mm a")}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upcoming */}
      <div className="glass rounded-2xl p-5">
        <div className="font-display font-semibold flex items-center gap-2 mb-3">
          <CalendarDays size={16} /> Next 7 days
        </div>
        {next7.length === 0 ? (
          <div className="text-center py-6 text-sm text-white/55">
            Nothing scheduled in the next 7 days.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {next7.slice(0, 6).map((e) => (
              <div key={e.id} className="rounded-xl p-3 bg-white/[0.03] border border-white/5 flex gap-3">
                <div
                  className="w-12 h-12 rounded-lg grid place-items-center text-xl shrink-0"
                  style={{ background: `linear-gradient(135deg, hsl(${e.coverHue},70%,40%), hsl(${(parseInt(e.coverHue) + 60) % 360},70%,40%))` }}
                >
                  {e.coverEmoji}
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{e.title}</div>
                  <div className="text-[11px] text-white/55 truncate">{e.society}</div>
                  <div className="text-[11px] text-white/65 mt-0.5">
                    {fmtDate(e.date, "d MMM • h:mm a")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Tile({
  icon, label, value, tone,
}: { icon: string; label: string; value: any; tone: "amber" | "violet" | "emerald" | "cyan" }) {
  const cls: Record<string, string> = {
    amber: "from-amber-500/25 to-amber-500/0 border-amber-400/30",
    violet: "from-violet-500/25 to-violet-500/0 border-violet-400/30",
    emerald: "from-emerald-500/25 to-emerald-500/0 border-emerald-400/30",
    cyan: "from-cyan-500/25 to-cyan-500/0 border-cyan-400/30",
  };
  return (
    <div className={`rounded-2xl p-4 border bg-gradient-to-br ${cls[tone]} backdrop-blur-md`}>
      <div className="text-sm text-white/65 flex items-center gap-2">
        <span className="text-xl">{icon}</span> {label}
      </div>
      <div className="font-display text-2xl sm:text-3xl font-bold mt-1.5">{value}</div>
    </div>
  );
}
