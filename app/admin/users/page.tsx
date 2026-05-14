"use client";
import { useStore } from "@/lib/store";
import { Avatar } from "@/components/Avatar";
import { Mail, Phone, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Role } from "@/lib/types";

export default function AdminUsersPage() {
  const users = useStore((s) => s.users);
  const events = useStore((s) => s.events);
  const tickets = useStore((s) => s.tickets);
  const [tab, setTab] = useState<Role | "all">("all");
  const [q, setQ] = useState("");

  let list = users;
  if (tab !== "all") list = list.filter((u) => u.role === tab);
  if (q.trim()) {
    const lc = q.toLowerCase();
    list = list.filter(
      (u) =>
        u.name.toLowerCase().includes(lc) ||
        u.email.toLowerCase().includes(lc) ||
        u.regNumber?.toLowerCase().includes(lc) ||
        u.society?.toLowerCase().includes(lc)
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Users & Societies</h1>
        <p className="text-white/55 text-sm mt-1">
          Directory of students, organizers, and admin accounts.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex gap-1.5 p-1 bg-white/5 rounded-xl border border-white/8">
          {(["all", "student", "organizer", "admin"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
                tab === t
                  ? "bg-gradient-to-br from-violet-500/80 to-fuchsia-500/80 text-white"
                  : "text-white/60 hover:text-white"
              }`}
            >
              {t === "all" ? "Everyone" : t + "s"}
            </button>
          ))}
        </div>
        <input
          className="input flex-1 max-w-xs"
          placeholder="Search by name, email, reg # …"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {list.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center text-sm text-white/55">
          No users match your filters.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {list.map((u) => {
            const myEvents = events.filter((e) => e.organizerId === u.id).length;
            const myTickets = tickets.filter((t) => t.userId === u.id).length;
            return (
              <div key={u.id} className="glass rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <Avatar name={u.name} seed={u.avatarSeed} size={48} />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate flex items-center gap-1.5">
                      {u.name}
                      {u.role === "admin" && (
                        <ShieldCheck size={13} className="text-amber-300" />
                      )}
                    </div>
                    <div className="text-[11px] text-white/55 capitalize">{u.role}</div>
                  </div>
                </div>
                <div className="mt-3 space-y-1.5 text-xs text-white/65">
                  <div className="flex items-center gap-1.5 truncate">
                    <Mail size={11} /> {u.email}
                  </div>
                  {u.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone size={11} /> {u.phone}
                    </div>
                  )}
                  {u.society && (
                    <div className="text-white/65 mt-1.5 truncate">
                      🏛️ {u.society}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/8 text-[11px] text-white/55">
                  {u.role === "organizer" && <span>🎯 {myEvents} events</span>}
                  {u.role === "student" && <span>🎟️ {myTickets} tickets</span>}
                  {u.regNumber && <span>#{u.regNumber}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
