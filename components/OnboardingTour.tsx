"use client";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { Modal } from "./Modal";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Search,
  Ticket,
  ScanLine,
  Calendar,
  ClipboardCheck,
  BarChart3,
  UserPlus,
  MessageSquare,
} from "lucide-react";
import { Role } from "@/lib/types";
import Link from "next/link";

interface TourStep {
  icon: React.ReactNode;
  title: string;
  body: string;
  action?: { href: string; label: string };
}

const tours: Record<Role, TourStep[]> = {
  student: [
    {
      icon: <Sparkles size={22} className="text-fuchsia-300" />,
      title: "Welcome to GIKI Event Hub 🎉",
      body: "Everything happening on campus, in one place. Let's walk through what you can do.",
    },
    {
      icon: <Search size={22} className="text-cyan-300" />,
      title: "Step 1 — Discover events",
      body: "Open Discover to browse every approved event. Filter by category, sort by date or price, or search by name. Each card shows seats remaining and price up front.",
      action: { href: "/student/events", label: "Open Discover" },
    },
    {
      icon: <Ticket size={22} className="text-violet-300" />,
      title: "Step 2 — Book a ticket",
      body: "Tap any event to see full details and book. You can pay online or pay cash at the venue. Your QR ticket lives under My Tickets — show it at the door.",
      action: { href: "/student/tickets", label: "View My Tickets" },
    },
    {
      icon: <CheckCircle2 size={22} className="text-emerald-300" />,
      title: "You're all set!",
      body: "Notifications keep you updated when new events drop or when you're checked in. Need help? The Help center is always one tap away.",
    },
  ],
  organizer: [
    {
      icon: <Sparkles size={22} className="text-fuchsia-300" />,
      title: "Welcome, organizer! 📣",
      body: "Run your society's events end-to-end: create, get approved, sell tickets, scan attendees, and review finance — all here.",
    },
    {
      icon: <Calendar size={22} className="text-cyan-300" />,
      title: "Step 1 — Create your event",
      body: "Hit 'New event'. Pick a venue (capacity auto-fills), set ticket price, upload a poster, add an event POC and a note for the Dean. Submit for approval — the Dean reviews from their queue.",
      action: { href: "/organizer/events/new", label: "Create event" },
    },
    {
      icon: <UserPlus size={22} className="text-violet-300" />,
      title: "Step 2 — Invite sub-organizers",
      body: "On your event's detail page, invite trusted core team members with their @giki.edu.pk email. They'll get scan access automatically — perfect for splitting door duty.",
      action: { href: "/organizer/events", label: "My events" },
    },
    {
      icon: <ScanLine size={22} className="text-amber-300" />,
      title: "Step 3 — Scan on event day",
      body: "Open Scanner on event day. Point your camera at any GIKI ticket QR — verified attendees appear in the live sidebar instantly. Already-used tickets are rejected automatically.",
      action: { href: "/organizer/scanner", label: "Open Scanner" },
    },
    {
      icon: <MessageSquare size={22} className="text-emerald-300" />,
      title: "Step 4 — Chat with the Dean",
      body: "If something gets rejected or you need to discuss, an event-specific chat thread opens with the Dean. Reply, adjust, resubmit — no email tag.",
    },
  ],
  admin: [
    {
      icon: <Sparkles size={22} className="text-fuchsia-300" />,
      title: "Welcome, Dean Sabir 🎓",
      body: "Your queue for every event submission on campus. Approve, reject with feedback, monitor conflicts, and see the big picture across all societies.",
    },
    {
      icon: <ClipboardCheck size={22} className="text-amber-300" />,
      title: "Step 1 — Review the queue",
      body: "Approvals shows every pending submission with full details: venue, capacity, budget, faculty advisor, and a 'note from organizer'. Schedule conflicts are auto-flagged in red.",
      action: { href: "/admin/approvals", label: "Open Approvals" },
    },
    {
      icon: <MessageSquare size={22} className="text-violet-300" />,
      title: "Step 2 — Reject with feedback",
      body: "Need something fixed? Rejecting opens a chat thread with the organizer right inside the event. They can reply, adjust, and resubmit — no email back-and-forth.",
    },
    {
      icon: <BarChart3 size={22} className="text-cyan-300" />,
      title: "Step 3 — Watch the whole campus",
      body: "Analytics gives you category mix, monthly cadence, and society activity. Use the Overview for a daily standup view: pending queue, conflicts, and the week ahead.",
      action: { href: "/admin/analytics", label: "Open Analytics" },
    },
  ],
};

const STORAGE_KEY = "giki-tour-seen";

export function OnboardingTour() {
  const user = useStore((s) => s.currentUser());
  const [open, setOpen] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    if (!user) return;
    if (typeof window === "undefined") return;
    try {
      const seen = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
      if (!seen[user.id]) {
        setOpen(true);
        setStepIdx(0);
      }
    } catch {
      setOpen(true);
    }
  }, [user?.id]);

  if (!user) return null;
  const steps = tours[user.role];
  const step = steps[stepIdx];
  const isLast = stepIdx === steps.length - 1;

  function close() {
    try {
      const seen = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
      seen[user!.id] = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seen));
    } catch {}
    setOpen(false);
  }

  return (
    <Modal open={open} onClose={close} title="" maxWidth="max-w-lg">
      <div className="space-y-4 -mt-3">
        <div className="flex items-center gap-2 text-[11px] text-white/55">
          <span>Step {stepIdx + 1} of {steps.length}</span>
          <div className="flex-1 h-1 bg-white/8 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all"
              style={{ width: `${((stepIdx + 1) / steps.length) * 100}%` }}
            />
          </div>
          <button
            onClick={close}
            className="text-xs text-white/55 hover:text-white"
          >
            Skip tour
          </button>
        </div>

        <div className="text-center pt-4 pb-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-white/8 grid place-items-center mb-4">
            {step.icon}
          </div>
          <div className="font-display text-xl font-bold mb-2">{step.title}</div>
          <div className="text-sm text-white/70 leading-relaxed max-w-md mx-auto">
            {step.body}
          </div>
        </div>

        {step.action && (
          <div className="text-center">
            <Link
              href={step.action.href}
              onClick={close}
              className="btn btn-secondary text-xs inline-flex"
            >
              {step.action.label} →
            </Link>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/8">
          <button
            onClick={() => stepIdx > 0 && setStepIdx(stepIdx - 1)}
            disabled={stepIdx === 0}
            className="btn btn-ghost text-sm"
          >
            <ArrowLeft size={14} /> Back
          </button>
          {isLast ? (
            <button onClick={close} className="btn btn-primary">
              <CheckCircle2 size={15} /> Got it!
            </button>
          ) : (
            <button
              onClick={() => setStepIdx(stepIdx + 1)}
              className="btn btn-primary"
            >
              Next <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
