"use client";
import { useEffect, useState } from "react";
import { Toaster } from "./Toaster";

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <>
      {children}
      {mounted && <Toaster />}
    </>
  );
}
