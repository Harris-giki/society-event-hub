"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { fmtDate, fmtPKR, softGradient, detectConflicts, fmtRelative } from "@/lib/utils";
import {
  Calendar,
  MapPin,
  Users,
  Banknote,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Building,
  MessageSquare,
  StickyNote,
  Phone,
  Globe2,
  ListFilter,
} from "lucide-react";
import { Modal } from "@/components/Modal";
import { Avatar } from "@/components/Avatar";
import { EventChat } from "@/components/EventChat";

const rejectionReasons = [
  "Insufficient details — please add more information about the schedule.",
  "Venue conflict with another approved event.",
  "Budget appears unreasonable for the proposed activities.",
  "Date falls during academic break / examinations.",
  "Missing faculty advisor approval.",
];

const orgRejectionReasons = [
  "Society does not exist in the registry — please verify with your faculty advisor.",
  "Insufficient information to verify the society.",
  "Duplicate of an existing society under a different name.",
];

const timeFilters = [
  { k: "all", label: "All time" },
  { k: "today", label: "Today" },
  { k: "week", label: "This week" },
  { k: "month", label: "This month" },
];

type Tab = "pending" | "approved" | "rejected" | "societies" | "organizers";

export default function AdminApprovals() {
  const events = useStore((s) => s.events);
  const users = useStore((s) => s.users);
  const societies = useStore((s) => s.societies);
  const chatMessages = useStore((s) => s.chatMessages);
  const approve = useStore((s) => s.approveEvent);
  const reject = useStore((s) => s.rejectEvent);
  const approveSociety = useStore((s) => s.approveSociety);
  const rejectOrg = useStore((s) => s.rejectOrganizer);
  const approveOrg = useStore((s) => s.approveOrganizer);

  const [rejectModalFor, setRejectModalFor] = useState<string | null>(null);
  const [rejectOrgFor, setRejectOrgFor] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [tab, setTab] = useState<Tab>("pending");
  const [timeFilter, setTimeFilter] = useState("all");
  const [societyFilter, setSocietyFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [chatFor, setChatFor] = useState<string | null>(null);

  // event queue
  let filtered = events
    .filter((e) => {
      if (tab === "pending") return e.status === "pending";
      if (tab === "approved") return e.status === "approved";
      if (tab === "rejected") return e.status === "rejected";
      return false;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (timeFilter !== "all") {
    const now = Date.now();
    const ranges: Record<string, number> = {
      today: 1 * 86400_000,
      week: 7 * 86400_000,
      month: 30 * 86400_000,
    };
    filtered = filtered.filter(
      (e) => now - new Date(e.createdAt).getTime() < ranges[timeFilter]
    );
  }
  if (societyFilter !== "all") {
    filtered = filtered.filter((e) => e.society === societyFilter);
  }
  if (searchQuery.trim()) {
    const lc = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (e) =>
        e.title.toLowerCase().includes(lc) ||
        e.society.toLowerCase().includes(lc) ||
        e.venue.toLowerCase().includes(lc)
    );
  }

  const conflicts = detectConflicts(events);
  function getConflictsFor(id: string) {
    return conflicts
      .filter((c) => c.a.id === id || c.b.id === id)
      .map((c) => (c.a.id === id ? c.b : c.a));
  }

  function submitReject() {
    if (!rejectModalFor) return;
    const r = reason === "custom" ? customReason : reason;
    if (!r.trim()) return;
    reject(rejectModalFor, r);
    setRejectModalFor(null);
    setReason("");
    setCustomReason("");
  }
  function submitRejectOrg() {
    if (!rejectOrgFor) return;
    const r = reason === "custom" ? customReason : reason;
    if (!r.trim()) return;
    rejectOrg(rejectOrgFor, r);
    setRejectOrgFor(null);
    setReason("");
    setCustomReason("");
  }

  const tabCounts = {
    pending: events.filter((e) => e.status === "pending").length,
    approved: events.filter((e) => e.status === "approved").length,
    rejected: events.filter((e) => e.status === "rejected").length,
    societies: societies.filter((s) => s.status === "pending").length,
    organizers: users.filter(
      (u) => u.role === "organizer" && u.accountStatus === "pending"
    ).length,
  };

  // unique society list for the dropdown
  const allSocieties = Array.from(new Set(events.map((e) => e.society))).sort();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Approvals</h1>
        <p className="text-white/55 text-sm mt-1">
          Events, society applications, and new organizer accounts — all in one queue.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/8 overflow-x-auto no-scrollbar">
          {(["pending", "approved", "rejected", "societies", "organizers"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition capitalize shrink-0 ${
                tab === t
                  ? "bg-gradient-to-br from-violet-500/80 to-fuchsia-500/80 text-white"
                  : "text-white/60 hover:text-white"
              }`}
            >
              {t === "societies"
                ? "Societies"
                : t === "organizers"
                ? "Organizers"
                : `Events · ${t}`}
              <span className="opacity-60"> ({tabCounts[t]})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Events sub-filters */}
      {(tab === "pending" || tab === "approved" || tab === "rejected") && (
        <div className="glass rounded-2xl p-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-white/55">
            <ListFilter size={14} /> Filter
          </div>
          <input
            className="input w-auto flex-1 min-w-[200px] max-w-xs"
            placeholder="Search by title, venue, society…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select
            className="select w-auto min-w-[180px]"
            value={societyFilter}
            onChange={(e) => setSocietyFilter(e.target.value)}
          >
            <option value="all">All societies</option>
            {allSocieties.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            className="select w-auto min-w-[140px]"
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
          >
            {timeFilters.map((t) => (
              <option key={t.k} value={t.k}>
                {t.label}
              </option>
            ))}
          </select>
          <div className="ml-auto text-xs text-white/55">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}

      {/* Societies queue */}
      {tab === "societies" && (
        <SocietyQueue
          societies={societies.filter((s) => s.status === "pending")}
          users={users}
          onApprove={approveSociety}
          onReject={(socId) => {
            const society = societies.find((s) => s.id === socId);
            if (!society || !society.appliedBy) return;
            setRejectOrgFor(society.appliedBy);
          }}
        />
      )}

      {/* Organizer applications queue */}
      {tab === "organizers" && (
        <OrganizerQueue
          orgs={users.filter(
            (u) => u.role === "organizer" && u.accountStatus === "pending"
          )}
          societies={societies}
          onApprove={approveOrg}
          onReject={(uid) => setRejectOrgFor(uid)}
        />
      )}

      {/* Event lists */}
      {(tab === "pending" || tab === "approved" || tab === "rejected") && (
        <>
          {filtered.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center">
              <div className="text-5xl mb-3">
                {tab === "pending" ? "🎉" : tab === "approved" ? "📅" : "🗂️"}
              </div>
              <div className="font-display text-lg font-semibold">
                {tab === "pending"
                  ? "No events awaiting review"
                  : `No ${tab} events match`}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((e) => {
                const organizer = users.find((u) => u.id === e.organizerId);
                const eConflicts = getConflictsFor(e.id);
                const unreadChat = chatMessages.some(
                  (m) =>
                    m.eventId === e.id &&
                    m.toUserId === users.find((x) => x.role === "admin")?.id &&
                    !m.read
                );
                const eventHasChat = chatMessages.some((m) => m.eventId === e.id);
                return (
                  <div
                    key={e.id}
                    id={e.id}
                    className="gradient-border-card overflow-hidden"
                  >
                    <div
                      className="h-36 relative"
                      style={{
                        background: e.posterUrl ? undefined : softGradient(e.coverHue),
                      }}
                    >
                      {e.posterUrl && (
                        <img
                          src={e.posterUrl}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                      )}
                      {e.posterUrl && (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      )}
                      <div className="absolute inset-0 p-5 flex flex-col justify-end">
                        <span className="chip chip-cyan w-fit backdrop-blur-md">
                          {e.category}
                        </span>
                        <div className="font-display text-xl font-bold mt-1.5 drop-shadow">
                          {e.title}
                        </div>
                      </div>
                      {!e.posterUrl && (
                        <div className="absolute top-4 right-5 text-5xl drop-shadow opacity-90">
                          {e.coverEmoji}
                        </div>
                      )}
                      {e.allowNonGikian && (
                        <span className="chip chip-emerald absolute top-4 right-4 backdrop-blur-md text-[10px]">
                          <Globe2 size={10} /> Open to all
                        </span>
                      )}
                    </div>

                    <div className="p-5 grid md:grid-cols-[2fr_1fr] gap-5">
                      <div className="space-y-3">
                        <div className="grid sm:grid-cols-2 gap-2">
                          <Stat icon={<Calendar size={12} />} label="Schedule" value={fmtDate(e.date)} />
                          <Stat icon={<MapPin size={12} />} label="Venue" value={e.venue} />
                          <Stat icon={<Users size={12} />} label="Capacity" value={`${e.capacity}`} />
                          <Stat icon={<Banknote size={12} />} label="Ticket" value={fmtPKR(e.ticketPrice)} />
                        </div>

                        <div className="text-sm text-white/75 leading-relaxed">
                          {e.longDescription ?? e.description}
                        </div>

                        {e.facultyAdvisor && (
                          <div className="text-xs text-white/65 flex items-center gap-1.5">
                            <Building size={12} /> Faculty advisor: <span className="text-white/80">{e.facultyAdvisor}</span>
                          </div>
                        )}
                        {e.pocName && (
                          <div className="text-xs text-white/65 flex items-center gap-1.5">
                            <Phone size={12} /> POC: <span className="text-white/80">{e.pocName} · {e.pocPhone}</span>
                          </div>
                        )}
                        <div className="text-xs text-white/65">
                          Budget: <span className="text-white/80">{fmtPKR(e.budget)}</span>
                        </div>
                        {e.resourcesRequested && e.resourcesRequested.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {e.resourcesRequested.map((r) => (
                              <span key={r} className="chip text-[10px]">{r}</span>
                            ))}
                          </div>
                        )}

                        {e.submissionNote && (
                          <div className="rounded-xl p-3 bg-violet-500/10 border border-violet-400/30 text-xs text-violet-100 flex items-start gap-2">
                            <StickyNote size={13} className="shrink-0 mt-0.5 text-violet-300" />
                            <span>
                              <span className="font-semibold">Note from organizer:</span>{" "}
                              {e.submissionNote}
                            </span>
                          </div>
                        )}

                        {eConflicts.length > 0 && tab !== "rejected" && (
                          <div className="rounded-xl p-3 bg-rose-500/10 border border-rose-400/30 text-xs">
                            <div className="font-semibold text-rose-200 flex items-center gap-1.5 mb-1">
                              <AlertTriangle size={13} /> Schedule conflict detected
                            </div>
                            <div className="text-white/70">
                              Same venue & time:{" "}
                              {eConflicts.map((c) => (
                                <span key={c.id} className="text-white">"{c.title}"</span>
                              ))}
                            </div>
                          </div>
                        )}

                        {e.rejectionReason && (
                          <div className="rounded-xl p-3 bg-rose-500/10 border border-rose-400/30 text-xs text-rose-200">
                            <span className="font-semibold">Rejection note:</span>{" "}
                            {e.rejectionReason}
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        {organizer && (
                          <div className="glass rounded-xl p-3 flex items-center gap-3">
                            <Avatar name={organizer.name} seed={organizer.avatarSeed} size={42} />
                            <div className="min-w-0">
                              <div className="text-[11px] text-white/55">Submitted by</div>
                              <div className="font-medium text-sm truncate">{organizer.name}</div>
                              <div className="text-[11px] text-white/55 truncate">
                                {organizer.society}
                              </div>
                              {organizer.phone && (
                                <div className="text-[10px] text-white/45 truncate mt-0.5">
                                  {organizer.phone}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        <div className="text-[11px] text-white/45">
                          Submitted {fmtDate(e.createdAt, "d MMM • h:mm a")}
                        </div>
                        {tab === "pending" && (
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => approve(e.id)}
                              className="btn btn-success w-full"
                            >
                              <CheckCircle2 size={15} /> Approve
                            </button>
                            <button
                              onClick={() => setRejectModalFor(e.id)}
                              className="btn btn-secondary text-rose-200 w-full"
                            >
                              <XCircle size={15} /> Reject with feedback
                            </button>
                          </div>
                        )}
                        {tab === "approved" && (
                          <div className="rounded-xl p-3 bg-emerald-500/10 border border-emerald-400/30 text-xs text-emerald-200 flex items-center gap-2">
                            <CheckCircle2 size={14} /> Live since{" "}
                            {e.approvedAt && fmtDate(e.approvedAt, "d MMM")}
                          </div>
                        )}
                        {(eventHasChat || tab === "rejected") && (
                          <button
                            onClick={() => setChatFor(chatFor === e.id ? null : e.id)}
                            className="btn btn-secondary w-full relative"
                          >
                            <MessageSquare size={14} />{" "}
                            {chatFor === e.id ? "Hide chat" : "Open chat"}
                            {unreadChat && (
                              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-fuchsia-400" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {chatFor === e.id && (
                      <div className="px-5 pb-5 animate-slideUp">
                        <EventChat eventId={e.id} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <Modal
        open={!!rejectModalFor}
        onClose={() => { setRejectModalFor(null); setReason(""); setCustomReason(""); }}
        title="Reject event submission"
      >
        <RejectionReasonPicker
          options={rejectionReasons}
          reason={reason}
          setReason={setReason}
          customReason={customReason}
          setCustomReason={setCustomReason}
        />
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={() => setRejectModalFor(null)} className="btn btn-secondary">
            Cancel
          </button>
          <button
            onClick={submitReject}
            disabled={!reason || (reason === "custom" && !customReason.trim())}
            className="btn btn-danger"
          >
            Send rejection + open chat
          </button>
        </div>
      </Modal>

      <Modal
        open={!!rejectOrgFor}
        onClose={() => { setRejectOrgFor(null); setReason(""); setCustomReason(""); }}
        title="Reject organizer application"
      >
        <RejectionReasonPicker
          options={orgRejectionReasons}
          reason={reason}
          setReason={setReason}
          customReason={customReason}
          setCustomReason={setCustomReason}
        />
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={() => setRejectOrgFor(null)} className="btn btn-secondary">
            Cancel
          </button>
          <button
            onClick={submitRejectOrg}
            disabled={!reason || (reason === "custom" && !customReason.trim())}
            className="btn btn-danger"
          >
            Reject application
          </button>
        </div>
      </Modal>
    </div>
  );
}

function RejectionReasonPicker({
  options, reason, setReason, customReason, setCustomReason,
}: {
  options: string[];
  reason: string;
  setReason: (s: string) => void;
  customReason: string;
  setCustomReason: (s: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="text-sm text-white/65">
        The recipient will be notified and a chat thread will open.
      </div>
      <div className="flex flex-col gap-1.5">
        {options.map((r) => (
          <label
            key={r}
            className={`rounded-xl p-2.5 border cursor-pointer transition ${
              reason === r
                ? "border-fuchsia-400/50 bg-fuchsia-500/10"
                : "border-white/10 hover:bg-white/5"
            }`}
          >
            <input
              type="radio"
              name="reason"
              className="sr-only"
              checked={reason === r}
              onChange={() => setReason(r)}
            />
            <span className="text-sm">{r}</span>
          </label>
        ))}
        <label
          className={`rounded-xl p-2.5 border cursor-pointer transition ${
            reason === "custom"
              ? "border-fuchsia-400/50 bg-fuchsia-500/10"
              : "border-white/10 hover:bg-white/5"
          }`}
        >
          <input
            type="radio"
            name="reason"
            className="sr-only"
            checked={reason === "custom"}
            onChange={() => setReason("custom")}
          />
          <span className="text-sm">Custom reason / message…</span>
        </label>
        {reason === "custom" && (
          <textarea
            className="textarea mt-1"
            placeholder="Type your full feedback message"
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            rows={4}
          />
        )}
      </div>
    </div>
  );
}

function SocietyQueue({
  societies, users, onApprove, onReject,
}: {
  societies: any[];
  users: any[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  if (societies.length === 0) {
    return (
      <div className="glass rounded-2xl p-12 text-center">
        <div className="text-5xl mb-3">🏛️</div>
        <div className="font-display text-lg font-semibold">
          No society applications pending
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {societies.map((soc) => {
        const applicant = users.find((u) => u.id === soc.appliedBy);
        return (
          <div key={soc.id} className="gradient-border-card p-5 grid md:grid-cols-[2fr_1fr] gap-4">
            <div>
              <div className="font-display font-semibold text-lg">{soc.name}</div>
              <div className="text-xs text-white/55 mt-1">
                Applied {fmtRelative(soc.createdAt)}
              </div>
              {soc.description && (
                <div className="text-sm text-white/75 mt-2">{soc.description}</div>
              )}
            </div>
            <div className="space-y-3">
              {applicant && (
                <div className="glass rounded-xl p-3 flex items-center gap-3">
                  <Avatar name={applicant.name} seed={applicant.avatarSeed} size={42} />
                  <div className="min-w-0">
                    <div className="text-[11px] text-white/55">Applicant</div>
                    <div className="font-medium text-sm truncate">{applicant.name}</div>
                    <div className="text-[11px] text-white/55 truncate">{applicant.email}</div>
                    {applicant.phone && (
                      <div className="text-[10px] text-white/45 truncate mt-0.5">{applicant.phone}</div>
                    )}
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-2">
                <button onClick={() => onApprove(soc.id)} className="btn btn-success w-full">
                  <CheckCircle2 size={15} /> Approve society
                </button>
                <button onClick={() => onReject(soc.id)} className="btn btn-secondary text-rose-200 w-full">
                  <XCircle size={15} /> Reject
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OrganizerQueue({
  orgs, societies, onApprove, onReject,
}: {
  orgs: any[];
  societies: any[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  if (orgs.length === 0) {
    return (
      <div className="glass rounded-2xl p-12 text-center">
        <div className="text-5xl mb-3">👤</div>
        <div className="font-display text-lg font-semibold">
          No organizer applications pending
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {orgs.map((org) => {
        const soc = societies.find(
          (s: any) => s.name.toLowerCase() === (org.society ?? "").toLowerCase()
        );
        const newSociety = !soc || soc.status === "pending";
        return (
          <div key={org.id} className="gradient-border-card p-5 grid md:grid-cols-[2fr_1fr] gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Avatar name={org.name} seed={org.avatarSeed} size={48} />
                <div className="min-w-0 flex-1">
                  <div className="font-display font-semibold text-lg">{org.name}</div>
                  <div className="text-xs text-white/55">{org.email}</div>
                </div>
                <span className="chip chip-amber text-[10px]">pending</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <Stat icon={<Building size={12} />} label="Society" value={org.society ?? "—"} />
                <Stat icon={<Phone size={12} />} label="Phone" value={org.phone ?? "—"} />
                {org.regNumber && <Stat icon={<Users size={12} />} label="Reg #" value={org.regNumber} />}
                <Stat icon={<Calendar size={12} />} label="Applied" value={fmtDate(org.appliedAt ?? org.id, "d MMM")} />
              </div>
              {newSociety && (
                <div className="rounded-xl p-3 mt-3 bg-amber-500/10 border border-amber-400/30 text-xs text-amber-200 flex items-start gap-2">
                  <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                  <span>
                    <span className="font-semibold">New society:</span> "{org.society}" is not
                    in the registry. Approving this organizer also approves the society.
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 h-fit">
              <button onClick={() => onApprove(org.id)} className="btn btn-success w-full">
                <CheckCircle2 size={15} /> Approve organizer
              </button>
              <button onClick={() => onReject(org.id)} className="btn btn-secondary text-rose-200 w-full">
                <XCircle size={15} /> Reject application
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Stat({
  icon, label, value,
}: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl p-2.5 bg-white/[0.03] border border-white/5">
      <div className="text-[10px] uppercase tracking-wider text-white/45 flex items-center gap-1">
        {icon} {label}
      </div>
      <div className="text-sm mt-0.5 truncate">{value}</div>
    </div>
  );
}
