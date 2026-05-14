"use client";
import Link from "next/link";
import { useStore, useEventStats } from "@/lib/store";
import { fmtDate, fmtPKR } from "@/lib/utils";
import { Empty } from "@/components/Empty";
import { Modal } from "@/components/Modal";
import { CalendarPlus, Eye, Pencil, Trash2, ListFilter } from "lucide-react";
import { useState } from "react";

const statusOptions = [
  { k: "all", label: "All statuses" },
  { k: "approved", label: "Approved" },
  { k: "pending", label: "Pending review" },
  { k: "rejected", label: "Rejected" },
  { k: "completed", label: "Completed" },
  { k: "cancelled", label: "Cancelled" },
];

const sortOptions = [
  { k: "newest", label: "Newest first" },
  { k: "oldest", label: "Oldest first" },
  { k: "date-asc", label: "Event date ↑" },
  { k: "date-desc", label: "Event date ↓" },
];

export default function OrganizerEvents() {
  const user = useStore((s) => s.currentUser())!;
  const events = useStore((s) =>
    s.events.filter((e) => e.organizerId === user.id)
  );
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const deleteEvent = useStore((s) => s.deleteEvent);

  let list = events;
  if (statusFilter !== "all") list = list.filter((e) => e.status === statusFilter);
  list = [...list].sort((a, b) => {
    if (sort === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (sort === "date-asc") return new Date(a.date).getTime() - new Date(b.date).getTime();
    if (sort === "date-desc") return new Date(b.date).getTime() - new Date(a.date).getTime();
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const counts = {
    all: events.length,
    approved: events.filter((e) => e.status === "approved").length,
    pending: events.filter((e) => e.status === "pending").length,
    rejected: events.filter((e) => e.status === "rejected").length,
    completed: events.filter((e) => e.status === "completed").length,
    cancelled: events.filter((e) => e.status === "cancelled").length,
  };

  const target = confirmDelete ? events.find((e) => e.id === confirmDelete) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-3xl font-bold">My Events</h1>
        <Link href="/organizer/events/new" className="btn btn-primary">
          <CalendarPlus size={15} /> New event
        </Link>
      </div>

      <div className="glass rounded-2xl p-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-white/55 mr-1">
          <ListFilter size={14} /> Filter
        </div>
        <select
          className="select w-auto min-w-[180px]"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {statusOptions.map((o) => (
            <option key={o.k} value={o.k}>
              {o.label} ({(counts as any)[o.k] ?? 0})
            </option>
          ))}
        </select>
        <select
          className="select w-auto min-w-[180px]"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          {sortOptions.map((o) => (
            <option key={o.k} value={o.k}>
              {o.label}
            </option>
          ))}
        </select>
        <div className="ml-auto text-xs text-white/55">
          Showing <span className="text-white font-semibold">{list.length}</span> of {events.length}
        </div>
      </div>

      {list.length === 0 ? (
        <Empty
          icon="📋"
          title="Nothing matches"
          body="Try a different filter — or create a new event."
          action={
            <Link href="/organizer/events/new" className="btn btn-primary">
              <CalendarPlus size={15} /> Create event
            </Link>
          }
        />
      ) : (
        <div className="grid gap-3">
          {list.map((e) => (
            <OrgEventRow
              key={e.id}
              eventId={e.id}
              onDelete={() => setConfirmDelete(e.id)}
            />
          ))}
        </div>
      )}

      <Modal
        open={!!target}
        onClose={() => setConfirmDelete(null)}
        title="Delete this event?"
      >
        <div className="text-sm text-white/70 mb-4">
          Permanently remove <span className="text-white font-medium">"{target?.title}"</span> from
          your dashboard. This can't be undone.
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={() => setConfirmDelete(null)} className="btn btn-secondary">
            Keep
          </button>
          <button
            onClick={() => {
              if (target) deleteEvent(target.id);
              setConfirmDelete(null);
            }}
            className="btn btn-danger"
          >
            <Trash2 size={14} /> Delete event
          </button>
        </div>
      </Modal>
    </div>
  );
}

function OrgEventRow({
  eventId,
  onDelete,
}: {
  eventId: string;
  onDelete: () => void;
}) {
  const event = useStore((s) => s.events.find((e) => e.id === eventId))!;
  const stats = useEventStats(eventId);
  const statusChip: Record<string, string> = {
    approved: "chip-emerald",
    pending: "chip-amber",
    rejected: "chip-rose",
    completed: "chip",
    cancelled: "chip-rose",
    draft: "chip",
  };
  const canEdit = !["completed", "cancelled"].includes(event.status);
  const canDelete = ["cancelled", "rejected", "draft"].includes(event.status);

  return (
    <div className="glass rounded-2xl p-4 sm:p-5 flex flex-wrap items-center gap-4">
      <div
        className="w-14 h-14 rounded-xl grid place-items-center text-2xl shrink-0 overflow-hidden"
        style={{
          background: event.posterUrl
            ? undefined
            : `linear-gradient(135deg, hsl(${event.coverHue},70%,40%), hsl(${(parseInt(event.coverHue) + 60) % 360},70%,40%))`,
        }}
      >
        {event.posterUrl ? (
          <img src={event.posterUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          event.coverEmoji
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center flex-wrap gap-2">
          <div className="font-medium">{event.title}</div>
          <span className={`chip text-[10px] ${statusChip[event.status]}`}>
            {event.status}
          </span>
          {event.allowNonGikian && (
            <span className="chip chip-cyan text-[10px]">open to all</span>
          )}
        </div>
        <div className="text-xs text-white/55 mt-0.5">
          {fmtDate(event.date)} • {event.venue}
        </div>
        {event.rejectionReason && event.status === "rejected" && (
          <div className="text-xs text-rose-300 mt-1">
            Reason: {event.rejectionReason}
          </div>
        )}
      </div>
      <div className="flex items-center gap-5 text-xs text-white/65">
        <div className="text-center">
          <div className="font-display font-bold text-base text-white">{stats.sold}</div>
          <div>booked</div>
        </div>
        <div className="text-center">
          <div className="font-display font-bold text-base text-white">{stats.scanned}</div>
          <div>scanned</div>
        </div>
        <div className="text-center">
          <div className="font-display font-bold text-base text-white">
            {fmtPKR(stats.revenue).replace("PKR ", "")}
          </div>
          <div>PKR</div>
        </div>
      </div>
      <div className="flex items-center gap-1 ml-auto">
        <Link
          href={`/organizer/events/${event.id}`}
          className="btn btn-secondary text-xs"
        >
          <Eye size={13} /> View
        </Link>
        {canEdit && (
          <Link
            href={`/organizer/events/${event.id}/edit`}
            className="btn btn-secondary text-xs"
          >
            <Pencil size={13} /> Edit
          </Link>
        )}
        {canDelete && (
          <button
            onClick={onDelete}
            className="btn btn-ghost text-rose-300 text-xs"
            aria-label="Delete event"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
