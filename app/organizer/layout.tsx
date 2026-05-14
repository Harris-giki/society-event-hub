"use client";
import { NavBar } from "@/components/NavBar";
import { RoleGuard } from "@/components/RoleGuard";
import { OnboardingTour } from "@/components/OnboardingTour";
import { OrganizerStatusGate } from "@/components/OrganizerStatusGate";
import { useStore } from "@/lib/store";
import { LayoutDashboard, CalendarPlus, ScanLine, Wallet } from "lucide-react";

export default function OrganizerLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard role="organizer">
      <OrganizerLayoutInner>{children}</OrganizerLayoutInner>
    </RoleGuard>
  );
}

function OrganizerLayoutInner({ children }: { children: React.ReactNode }) {
  const user = useStore((s) => s.currentUser());
  const status = user?.accountStatus ?? "approved";

  // For pending/rejected organizers, render ONLY the gate screen — no nav,
  // no tour. They have nothing to navigate to until approved.
  if (user?.role === "organizer" && status !== "approved") {
    return <OrganizerStatusGate>{children}</OrganizerStatusGate>;
  }

  return (
    <>
      <NavBar
        brandHref="/organizer/dashboard"
        links={[
          { href: "/organizer/dashboard", label: "Overview", icon: <LayoutDashboard size={15} /> },
          { href: "/organizer/events", label: "My Events", icon: <CalendarPlus size={15} /> },
          { href: "/organizer/scanner", label: "Scanner", icon: <ScanLine size={15} /> },
          { href: "/organizer/finance", label: "Finance", icon: <Wallet size={15} /> },
        ]}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24">
        {children}
      </main>
      <OnboardingTour />
    </>
  );
}
