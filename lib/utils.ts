import { format, formatDistanceToNow, isAfter, isBefore } from "date-fns";
import { SocietyEvent } from "./types";

export function classNames(...args: (string | false | undefined | null)[]) {
  return args.filter(Boolean).join(" ");
}

export function fmtPKR(n: number) {
  if (n === 0) return "Free";
  return `PKR ${n.toLocaleString()}`;
}

export function fmtDate(iso: string, pattern = "EEE, d MMM • h:mm a") {
  try { return format(new Date(iso), pattern); } catch { return iso; }
}

export function fmtRelative(iso: string) {
  try { return formatDistanceToNow(new Date(iso), { addSuffix: true }); } catch { return ""; }
}

export function isUpcoming(e: SocietyEvent) {
  return isAfter(new Date(e.date), new Date());
}
export function isPast(e: SocietyEvent) {
  return isBefore(new Date(e.endDate ?? e.date), new Date());
}

export function pluralize(n: number, sing: string, plur?: string) {
  return n === 1 ? `1 ${sing}` : `${n} ${plur ?? sing + "s"}`;
}

export function initials(name: string) {
  return name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

export function gradientFor(hue: string) {
  return `linear-gradient(135deg, hsl(${hue}, 80%, 55%), hsl(${(parseInt(hue) + 50) % 360}, 90%, 60%), hsl(${(parseInt(hue) + 100) % 360}, 85%, 60%))`;
}

export function softGradient(hue: string) {
  return `radial-gradient(80% 80% at 30% 20%, hsla(${hue}, 90%, 65%, 0.55), transparent 60%),
          radial-gradient(80% 80% at 80% 80%, hsla(${(parseInt(hue) + 60) % 360}, 90%, 65%, 0.45), transparent 60%),
          linear-gradient(135deg, hsl(${hue}, 60%, 18%), hsl(${(parseInt(hue) + 40) % 360}, 50%, 12%))`;
}

export function detectConflicts<T extends { id: string; date: string; endDate?: string; venue: string; status: string }>(
  events: T[]
) {
  const conflicts: Array<{ a: T; b: T }> = [];
  const active = events.filter((e) => e.status === "approved" || e.status === "pending");
  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const a = active[i];
      const b = active[j];
      if (a.venue !== b.venue) continue;
      const aStart = new Date(a.date).getTime();
      const aEnd = a.endDate ? new Date(a.endDate).getTime() : aStart + 2 * 3600_000;
      const bStart = new Date(b.date).getTime();
      const bEnd = b.endDate ? new Date(b.endDate).getTime() : bStart + 2 * 3600_000;
      if (aStart < bEnd && bStart < aEnd) {
        conflicts.push({ a, b });
      }
    }
  }
  return conflicts;
}
