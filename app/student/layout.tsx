"use client";
import { NavBar } from "@/components/NavBar";
import { RoleGuard } from "@/components/RoleGuard";
import { OnboardingTour } from "@/components/OnboardingTour";
import { Compass, Ticket, Calendar } from "lucide-react";

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard role="student">
      <NavBar
        brandHref="/student/dashboard"
        links={[
          { href: "/student/dashboard", label: "Home", icon: <Compass size={15} /> },
          { href: "/student/events", label: "Discover", icon: <Calendar size={15} /> },
          { href: "/student/tickets", label: "My Tickets", icon: <Ticket size={15} /> },
        ]}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24">
        {children}
      </main>
      <OnboardingTour />
    </RoleGuard>
  );
}
