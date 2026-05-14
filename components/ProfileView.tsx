"use client";
import { useStore } from "@/lib/store";
import { Avatar } from "./Avatar";
import { Modal } from "./Modal";
import { EditProfileModal } from "./EditProfileModal";
import {
  Mail,
  Phone,
  GraduationCap,
  BadgeCheck,
  LogOut,
  RotateCcw,
  BellRing,
  Building,
  Pencil,
  HelpCircle,
  ShieldAlert,
  CreditCard,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export function ProfileView() {
  const user = useStore((s) => s.currentUser());
  const tickets = useStore((s) =>
    s.tickets.filter((t) => t.userId === user?.id)
  );
  const events = useStore((s) =>
    user ? s.events.filter((e) => e.organizerId === user.id) : []
  );
  const logout = useStore((s) => s.logout);
  const reset = useStore((s) => s.resetAll);
  const router = useRouter();
  const [confirmReset, setConfirmReset] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  if (!user) return null;

  const attended = tickets.filter((t) => t.status === "scanned").length;
  const spend = tickets
    .filter((t) => t.status !== "refunded" && t.status !== "cancelled")
    .reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <h1 className="font-display text-3xl font-bold">Profile</h1>

      <div className="gradient-border-card p-6">
        <div className="flex items-center gap-4">
          <Avatar name={user.name} seed={user.avatarSeed} size={72} />
          <div className="flex-1 min-w-0">
            <div className="font-display text-xl font-semibold">{user.name}</div>
            <div className="text-sm text-white/55 capitalize">
              {user.role === "admin" ? "Dean of Student Affairs" : user.role}
              {user.society && ` · ${user.society}`}
            </div>
            {user.regNumber && (
              <div className="text-xs text-white/45 mt-0.5">Reg # {user.regNumber}</div>
            )}
          </div>
          <button onClick={() => setEditOpen(true)} className="btn btn-secondary text-sm">
            <Pencil size={14} /> Edit
          </button>
        </div>

        <div className="divider my-5" />

        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <Row icon={<Mail size={14} />} label="Email" value={user.email} />
          {user.phone && <Row icon={<Phone size={14} />} label="Phone" value={user.phone} />}
          {user.program && (
            <Row icon={<GraduationCap size={14} />} label="Program" value={user.program} />
          )}
          {user.society && (
            <Row icon={<Building size={14} />} label="Society" value={user.society} />
          )}
          {user.regNumber && (
            <Row icon={<BadgeCheck size={14} />} label="Reg Number" value={user.regNumber} />
          )}
          {user.universityName && (
            <Row icon={<Building size={14} />} label="University" value={user.universityName} />
          )}
          {user.cnic && (
            <Row icon={<CreditCard size={14} />} label="CNIC" value={user.cnic} />
          )}
          {user.emergencyContact && (
            <Row icon={<ShieldAlert size={14} />} label={`Emergency · ${user.emergencyContactName ?? ""}`} value={user.emergencyContact} />
          )}
        </div>

        {user.universityIdCardUrl && (
          <div className="mt-5 pt-5 border-t border-white/8">
            <div className="text-xs text-white/55 mb-2">University ID card</div>
            <img
              src={user.universityIdCardUrl}
              alt="University ID"
              className="rounded-lg max-h-44 border border-white/10"
            />
          </div>
        )}
      </div>

      {user.role === "student" && (
        <div className="grid grid-cols-3 gap-3">
          <Mini label="Tickets" value={tickets.length} />
          <Mini label="Attended" value={attended} />
          <Mini label="Total spent" value={`PKR ${spend.toLocaleString()}`} />
        </div>
      )}

      {user.role === "organizer" && (
        <div className="grid grid-cols-3 gap-3">
          <Mini label="Events" value={events.length} />
          <Mini label="Approved" value={events.filter((e) => e.status === "approved").length} />
          <Mini label="Pending" value={events.filter((e) => e.status === "pending").length} />
        </div>
      )}

      <div className="glass rounded-2xl p-5 space-y-3">
        <div className="font-display font-semibold flex items-center gap-2">
          <BellRing size={16} /> Notification preferences
        </div>
        <div className="text-xs text-white/55">
          Manage how you're notified about new events, approvals, and your bookings.
        </div>
        <div className="space-y-2 mt-2">
          <Toggle label="New event announcements" defaultChecked />
          <Toggle label="Reminders 1 hour before event" defaultChecked />
          <Toggle label="Society newsletters" />
        </div>
      </div>

      <div className="glass rounded-2xl p-5 space-y-3">
        <div className="font-display font-semibold">Account</div>
        <Link href="/help" className="btn btn-secondary w-full justify-start">
          <HelpCircle size={15} /> Help & Support
        </Link>
        <button
          onClick={() => { logout(); router.push("/login"); }}
          className="btn btn-secondary w-full justify-start"
        >
          <LogOut size={15} /> Sign out
        </button>
        <button
          onClick={() => setConfirmReset(true)}
          className="btn btn-ghost w-full justify-start text-rose-300"
        >
          <RotateCcw size={15} /> Reset demo data (clears everything)
        </button>
      </div>

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title="Reset demo data?">
        <div className="text-sm text-white/70 mb-4">
          This wipes all bookings, events you've created, notifications, chats, and
          invitations, and restores the original demo state. Use this between demo runs.
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={() => setConfirmReset(false)} className="btn btn-secondary">
            Cancel
          </button>
          <button
            onClick={() => {
              reset();
              router.push("/login");
            }}
            className="btn btn-danger"
          >
            Reset everything
          </button>
        </div>
      </Modal>

      <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} user={user} />
    </div>
  );
}

function Row({
  icon, label, value,
}: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="glass rounded-xl p-3">
      <div className="text-[10px] uppercase tracking-wider text-white/45 flex items-center gap-1">
        {icon} {label}
      </div>
      <div className="text-sm mt-1 break-words">{value}</div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: any }) {
  return (
    <div className="glass rounded-2xl p-4 text-center">
      <div className="font-display text-2xl font-bold">{value}</div>
      <div className="text-[11px] text-white/55 mt-1">{label}</div>
    </div>
  );
}

function Toggle({ label, defaultChecked }: { label: string; defaultChecked?: boolean }) {
  const [on, setOn] = useState(defaultChecked ?? false);
  return (
    <label className="flex items-center justify-between cursor-pointer text-sm">
      <span className="text-white/75">{label}</span>
      <button
        type="button"
        onClick={() => setOn(!on)}
        className={`w-10 h-6 rounded-full p-0.5 transition ${
          on ? "bg-gradient-to-r from-violet-500 to-fuchsia-500" : "bg-white/15"
        }`}
      >
        <div
          className={`w-5 h-5 rounded-full bg-white transition-transform ${
            on ? "translate-x-4" : ""
          }`}
        />
      </button>
    </label>
  );
}
