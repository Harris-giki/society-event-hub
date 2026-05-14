"use client";
import { QRCodeSVG } from "qrcode.react";

export function QRCode({
  value,
  size = 220,
  fg = "#0a0a17",
  bg = "#ffffff",
}: {
  value: string;
  size?: number;
  fg?: string;
  bg?: string;
}) {
  return (
    <div
      className="rounded-2xl p-3 inline-block"
      style={{ background: bg }}
    >
      <QRCodeSVG value={value} size={size} fgColor={fg} bgColor={bg} level="M" />
    </div>
  );
}
