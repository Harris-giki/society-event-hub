"use client";
import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="text-center max-w-md space-y-5">
        <div className="text-6xl">😬</div>
        <div>
          <div className="font-display text-2xl font-semibold">
            Something went sideways.
          </div>
          <div className="text-white/60 text-sm mt-2">
            We've logged the error and our team will look into it. Try refreshing — most things bounce back.
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <button onClick={reset} className="btn btn-primary">
            <RotateCcw size={15} /> Try again
          </button>
          <Link href="/" className="btn btn-secondary">
            <Home size={15} /> Home
          </Link>
        </div>
      </div>
    </div>
  );
}
