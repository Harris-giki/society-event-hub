"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { Avatar } from "./Avatar";
import { NotificationBell } from "./NotificationBell";
import {
  LogOut,
  HelpCircle,
  Settings,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { classNames } from "@/lib/utils";

interface NavLink {
  href: string;
  label: string;
  icon?: React.ReactNode;
}

export function NavBar({
  brandHref,
  links,
}: {
  brandHref: string;
  links: NavLink[];
}) {
  const user = useStore((s) => s.currentUser());
  const logout = useStore((s) => s.logout);
  const router = useRouter();
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node))
        setProfileOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function doLogout() {
    logout();
    router.push("/login");
  }

  return (
    <nav className="sticky top-0 z-40 backdrop-blur-xl bg-ink-900/60 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <Link href={brandHref} className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 grid place-items-center font-bold text-ink-900 text-lg">
            G
          </div>
          <div className="hidden sm:block">
            <div className="font-display font-semibold text-[15px] leading-tight">
              GIKI Event Hub
            </div>
            <div className="text-[10px] text-white/50 leading-tight">
              Society Event & Ticketing
            </div>
          </div>
        </Link>

        {/* desktop links */}
        <div className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
          {links.map((l) => {
            const active = pathname === l.href || pathname.startsWith(l.href + "/");
            return (
              <Link
                key={l.href}
                href={l.href}
                className={classNames(
                  "px-3.5 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition",
                  active
                    ? "bg-white/10 text-white"
                    : "text-white/65 hover:text-white hover:bg-white/5"
                )}
              >
                {l.icon}
                {l.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-1">
          <Link
            href="/help"
            className="p-2.5 rounded-xl hover:bg-white/10 hidden sm:flex"
            aria-label="Help"
          >
            <HelpCircle size={18} className="text-white/80" />
          </Link>
          <NotificationBell />

          {user && (
            <div ref={profileRef} className="relative">
              <button
                onClick={() => setProfileOpen((o) => !o)}
                className="flex items-center gap-2 pl-1.5 pr-2 py-1.5 rounded-xl hover:bg-white/10 transition"
              >
                <Avatar name={user.name} seed={user.avatarSeed} size={30} />
                <div className="text-left hidden sm:block">
                  <div className="text-[13px] font-medium leading-tight">
                    {user.name.split(" ")[0]}
                  </div>
                  <div className="text-[10px] text-white/50 capitalize leading-tight">
                    {user.role}
                  </div>
                </div>
                <ChevronDown size={14} className="text-white/50 hidden sm:block" />
              </button>
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-72 popover-panel rounded-2xl p-2 z-50 animate-slideUp">
                  <div className="px-3 py-3 flex items-center gap-3">
                    <Avatar name={user.name} seed={user.avatarSeed} size={44} />
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate">{user.name}</div>
                      <div className="text-xs text-white/55 truncate">{user.email}</div>
                    </div>
                  </div>
                  <div className="divider" />
                  <div className="flex flex-col p-1 gap-0.5">
                    <Link
                      href={`/${user.role}/profile`}
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-2.5 py-2.5 rounded-lg hover:bg-white/8 text-sm"
                    >
                      <Settings size={15} /> Profile & Settings
                    </Link>
                    <Link
                      href="/help"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-2.5 py-2.5 rounded-lg hover:bg-white/8 text-sm"
                    >
                      <HelpCircle size={15} /> Help & Support
                    </Link>
                    <button
                      onClick={doLogout}
                      className="flex items-center gap-2 px-2.5 py-2.5 rounded-lg hover:bg-rose-500/10 text-sm text-rose-300"
                    >
                      <LogOut size={15} /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* mobile menu trigger */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="md:hidden p-2.5 rounded-xl hover:bg-white/10"
            aria-label="Open menu"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-ink-900/95 backdrop-blur-xl animate-slideUp">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-1">
            {links.map((l) => {
              const active = pathname === l.href || pathname.startsWith(l.href + "/");
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className={classNames(
                    "px-3 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2",
                    active
                      ? "bg-white/10 text-white"
                      : "text-white/65 hover:bg-white/5"
                  )}
                >
                  {l.icon}
                  {l.label}
                </Link>
              );
            })}
            <Link
              href="/help"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 text-white/65 hover:bg-white/5"
            >
              <HelpCircle size={15} /> Help & Support
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
