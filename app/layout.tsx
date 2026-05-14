import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "GIKI Event Hub — Society Events & Ticketing",
  description:
    "One central hub for every society event at GIKI. Discover, book, scan, and manage — all in one frictionless place.",
  icons: {
    icon: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#06060d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="aurora"><div className="blob" /></div>
        <div className="grid-noise" />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
