"use client";
import Link from "next/link";
import { ArrowLeft, Home, HelpCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="text-center max-w-md space-y-5">
        <div className="font-display text-8xl font-bold text-gradient">404</div>
        <div>
          <div className="font-display text-2xl font-semibold">
            That page took a different lecture.
          </div>
          <div className="text-white/60 text-sm mt-2">
            The link you opened doesn't exist or has been removed. Let's get you back on track.
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <Link href="/" className="btn btn-primary">
            <Home size={15} /> Home
          </Link>
          <Link href="/help" className="btn btn-secondary">
            <HelpCircle size={15} /> Help center
          </Link>
        </div>
      </div>
    </div>
  );
}
