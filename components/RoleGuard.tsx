"use client";
import { useStore } from "@/lib/store";
import { Role } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * RoleGuard
 * - Waits for the persisted store to hydrate (avoids SSR/CSR mismatch)
 * - Redirects unauthenticated users to /login
 * - Redirects role mismatches to their own dashboard
 * - Re-evaluates on every render so logging out mid-session unmounts the page
 *   instead of crashing on a null currentUser inside child components.
 */
export function RoleGuard({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const hydrated = useStore((s) => s.hydrated);
  const user = useStore((s) => s.currentUser());

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== role) {
      router.replace(`/${user.role}/dashboard`);
    }
  }, [hydrated, user, role, router]);

  // Block render until hydrated AND user matches the expected role.
  // This is the critical fix for the logout crash: if user becomes null, we
  // immediately show the loader instead of letting child pages access user.id.
  const ready = hydrated && !!user && user.role === role;

  if (!ready) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="flex flex-col items-center gap-3 text-white/60">
          <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-fuchsia-400 animate-spin" />
          <div className="text-sm">
            {!hydrated ? "Preparing your dashboard…" : "Redirecting…"}
          </div>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
