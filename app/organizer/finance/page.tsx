"use client";
import { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { fmtDate, fmtPKR } from "@/lib/utils";
import { Modal } from "@/components/Modal";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  CreditCard,
  Download,
  Receipt,
  ListFilter,
  Eye,
} from "lucide-react";

const timeFilters = [
  { k: "all", label: "All time" },
  { k: "today", label: "Today" },
  { k: "week", label: "This week" },
  { k: "month", label: "This month" },
  { k: "quarter", label: "Last 3 months" },
];

export default function FinancePage() {
  const user = useStore((s) => s.currentUser())!;
  const events = useStore((s) =>
    s.events.filter((e) => e.organizerId === user.id)
  );
  const tickets = useStore((s) =>
    s.tickets.filter((t) =>
      events.some((e) => e.id === t.eventId)
    )
  );
  const payments = useStore((s) =>
    s.payments.filter((p) =>
      tickets.some((t) => t.id === p.ticketId)
    )
  );

  const [timeFilter, setTimeFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState<"all" | "online" | "cash">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "succeeded" | "failed" | "refunded" | "pending">("all");
  const [showAllTx, setShowAllTx] = useState(false);

  const ranges: Record<string, number> = {
    today: 86400_000,
    week: 7 * 86400_000,
    month: 30 * 86400_000,
    quarter: 90 * 86400_000,
  };

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (timeFilter !== "all") {
        const age = Date.now() - new Date(p.createdAt).getTime();
        if (age > ranges[timeFilter]) return false;
      }
      if (methodFilter !== "all" && p.method !== methodFilter) return false;
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      return true;
    });
  }, [payments, timeFilter, methodFilter, statusFilter]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (timeFilter !== "all") {
        const age = Date.now() - new Date(t.bookedAt).getTime();
        if (age > ranges[timeFilter]) return false;
      }
      if (methodFilter !== "all" && t.paymentMethod !== methodFilter) return false;
      return true;
    });
  }, [tickets, timeFilter, methodFilter]);

  const totalRevenue = filteredTickets
    .filter((t) => t.status !== "refunded" && t.status !== "cancelled")
    .reduce((s, t) => s + t.amount, 0);
  const totalRefunded = filteredTickets
    .filter((t) => t.status === "refunded")
    .reduce((s, t) => s + t.amount, 0);
  const onlineCount = filteredTickets.filter((t) => t.paymentMethod === "online").length;
  const cashCount = filteredTickets.filter((t) => t.paymentMethod === "cash").length;

  const breakdown = events.map((e) => {
    const eTickets = filteredTickets.filter((t) => t.eventId === e.id);
    const rev = eTickets
      .filter((t) => t.status !== "refunded" && t.status !== "cancelled")
      .reduce((s, t) => s + t.amount, 0);
    return {
      event: e,
      sold: eTickets.length,
      revenue: rev,
    };
  }).filter((b) => b.sold > 0);

  function exportLedger() {
    const rows = [
      ["Event", "Method", "Status", "Amount", "Date"],
      ...filteredTickets.map((t) => {
        const ev = events.find((e) => e.id === t.eventId);
        return [
          ev?.title ?? t.eventId,
          t.paymentMethod,
          t.status,
          t.amount.toString(),
          t.bookedAt,
        ];
      }),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const url = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = `finance-ledger.csv`;
    a.click();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold flex items-center gap-2.5">
            <Wallet size={26} /> Finance
          </h1>
          <p className="text-white/55 text-sm mt-1">
            Revenue, refunds, and payment methods across your events.
          </p>
        </div>
        <button onClick={exportLedger} className="btn btn-secondary text-sm">
          <Download size={14} /> Export ledger
        </button>
      </div>

      <div className="glass rounded-2xl p-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-white/55">
          <ListFilter size={14} /> Filter by
        </div>
        <select
          className="select w-auto min-w-[160px]"
          value={timeFilter}
          onChange={(e) => setTimeFilter(e.target.value)}
        >
          {timeFilters.map((t) => (
            <option key={t.k} value={t.k}>{t.label}</option>
          ))}
        </select>
        <select
          className="select w-auto min-w-[160px]"
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value as any)}
        >
          <option value="all">All payment methods</option>
          <option value="online">Online only</option>
          <option value="cash">Cash only</option>
        </select>
        <select
          className="select w-auto min-w-[160px]"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
        >
          <option value="all">All statuses</option>
          <option value="succeeded">Succeeded</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
        <div className="ml-auto text-xs text-white/55">
          {filteredPayments.length} transaction{filteredPayments.length !== 1 ? "s" : ""}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Tile
          icon={<TrendingUp size={18} className="text-emerald-300" />}
          label="Total revenue"
          value={fmtPKR(totalRevenue)}
          tone="emerald"
        />
        <Tile
          icon={<TrendingDown size={18} className="text-rose-300" />}
          label="Refunded"
          value={fmtPKR(totalRefunded)}
          tone="rose"
        />
        <Tile
          icon={<CreditCard size={18} className="text-violet-300" />}
          label="Online payments"
          value={onlineCount.toString()}
          tone="violet"
        />
        <Tile
          icon={<Wallet size={18} className="text-amber-300" />}
          label="Cash payments"
          value={cashCount.toString()}
          tone="amber"
        />
      </div>

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
        <div className="glass rounded-2xl p-5">
          <div className="font-display font-semibold mb-3">Revenue by event</div>
          {breakdown.length === 0 ? (
            <div className="text-sm text-white/55 py-8 text-center">
              No financial data for this period.
            </div>
          ) : (
            <div className="space-y-3">
              {breakdown.map(({ event, sold, revenue }) => {
                const max = Math.max(...breakdown.map((b) => b.revenue), 1);
                const pct = (revenue / max) * 100;
                return (
                  <div key={event.id}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span>{event.coverEmoji}</span>
                        <span className="truncate max-w-[200px]">{event.title}</span>
                      </span>
                      <span className="font-display font-semibold">
                        {fmtPKR(revenue)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-2 rounded-full bg-white/8 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            background: `linear-gradient(90deg, hsl(${event.coverHue},80%,55%), hsl(${(parseInt(event.coverHue) + 60) % 360},80%,55%))`,
                          }}
                        />
                      </div>
                      <div className="text-[11px] text-white/55 w-16 text-right shrink-0">
                        {sold} tkts
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="glass rounded-2xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="font-display font-semibold flex items-center gap-2">
              <Receipt size={16} /> Recent transactions
            </div>
            {filteredPayments.length > 0 && (
              <button
                onClick={() => setShowAllTx(true)}
                className="text-xs text-fuchsia-300 hover:text-fuchsia-200 flex items-center gap-1"
              >
                <Eye size={12} /> View all
              </button>
            )}
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1 flex-1">
            {filteredPayments.length === 0 ? (
              <div className="text-sm text-white/55 py-6 text-center">
                No transactions in this period.
              </div>
            ) : (
              filteredPayments.slice(0, 12).map((p) => {
                const t = tickets.find((tk) => tk.id === p.ticketId);
                const e = events.find((ev) => ev.id === t?.eventId);
                return (
                  <TxRow key={p.id} p={p} eventTitle={e?.title ?? "—"} />
                );
              })
            )}
          </div>
          {filteredPayments.length > 12 && (
            <button
              onClick={() => setShowAllTx(true)}
              className="btn btn-secondary w-full mt-3 text-xs"
            >
              View all {filteredPayments.length} transactions
            </button>
          )}
        </div>
      </div>

      <Modal
        open={showAllTx}
        onClose={() => setShowAllTx(false)}
        title={`All transactions (${filteredPayments.length})`}
        maxWidth="max-w-3xl"
      >
        <div className="overflow-x-auto -mx-2 max-h-[60vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-ink-900 z-10">
              <tr className="text-left text-xs text-white/55 border-b border-white/8">
                <th className="px-2 py-2 font-medium">When</th>
                <th className="px-2 py-2 font-medium">Event</th>
                <th className="px-2 py-2 font-medium">Method</th>
                <th className="px-2 py-2 font-medium">Status</th>
                <th className="px-2 py-2 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((p) => {
                const t = tickets.find((tk) => tk.id === p.ticketId);
                const e = events.find((ev) => ev.id === t?.eventId);
                return (
                  <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                    <td className="px-2 py-2.5 text-xs text-white/65">
                      {fmtDate(p.createdAt, "d MMM • h:mm a")}
                    </td>
                    <td className="px-2 py-2.5 truncate max-w-[280px]">
                      {e?.title ?? "—"}
                    </td>
                    <td className="px-2 py-2.5 text-xs">
                      {p.method === "online" ? "💳 Online" : "💵 Cash"}
                    </td>
                    <td className="px-2 py-2.5">
                      <span className={`chip text-[10px] ${
                        p.status === "succeeded" ? "chip-emerald" :
                        p.status === "failed" ? "chip-rose" :
                        p.status === "refunded" ? "chip-rose" : "chip-amber"
                      }`}>{p.status}</span>
                    </td>
                    <td className="px-2 py-2.5 text-right font-display font-semibold">
                      {fmtPKR(p.amount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
}

function TxRow({ p, eventTitle }: { p: any; eventTitle: string }) {
  return (
    <div className="rounded-xl p-3 bg-white/[0.03] border border-white/5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium truncate flex items-center gap-1.5">
          {p.method === "online" ? <CreditCard size={12} /> : <Wallet size={12} />}
          {eventTitle}
        </span>
        <span
          className={`font-display font-semibold ${
            p.status === "refunded" ? "text-rose-300 line-through" : ""
          }`}
        >
          {fmtPKR(p.amount)}
        </span>
      </div>
      <div className="flex items-center justify-between text-[11px] text-white/55 mt-0.5">
        <span>{fmtDate(p.createdAt, "d MMM • h:mm a")}</span>
        <span
          className={`chip text-[10px] ${
            p.status === "succeeded"
              ? "chip-emerald"
              : p.status === "failed"
              ? "chip-rose"
              : p.status === "refunded"
              ? "chip-rose"
              : "chip-amber"
          }`}
        >
          {p.status}
        </span>
      </div>
    </div>
  );
}

function Tile({
  icon, label, value, tone,
}: { icon: React.ReactNode; label: string; value: string; tone: string }) {
  const cls: Record<string, string> = {
    emerald: "from-emerald-500/25 to-emerald-500/0 border-emerald-400/30",
    rose: "from-rose-500/25 to-rose-500/0 border-rose-400/30",
    violet: "from-violet-500/25 to-violet-500/0 border-violet-400/30",
    amber: "from-amber-500/25 to-amber-500/0 border-amber-400/30",
  };
  return (
    <div className={`rounded-2xl p-4 border bg-gradient-to-br ${cls[tone]} backdrop-blur-md`}>
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs text-white/65">{label}</span>
      </div>
      <div className="font-display text-2xl font-bold mt-1.5">{value}</div>
    </div>
  );
}
