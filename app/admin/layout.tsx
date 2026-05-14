"use client";
import { NavBar } from "@/components/NavBar";
import { RoleGuard } from "@/components/RoleGuard";
import { OnboardingTour } from "@/components/OnboardingTour";
import { LayoutDashboard, ClipboardCheck, BarChart3, Users } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard role="admin">
      <NavBar
        brandHref="/admin/dashboard"
        links={[
          { href: "/admin/dashboard", label: "Overview", icon: <LayoutDashboard size={15} /> },
          { href: "/admin/approvals", label: "Approvals", icon: <ClipboardCheck size={15} /> },
          { href: "/admin/analytics", label: "Analytics", icon: <BarChart3 size={15} /> },
          { href: "/admin/users", label: "Users", icon: <Users size={15} /> },
        ]}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24">
        {children}
      </main>
      <OnboardingTour />
    </RoleGuard>
  );
}
