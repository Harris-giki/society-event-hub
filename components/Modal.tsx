"use client";
import { X } from "lucide-react";
import { useEffect } from "react";

export function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  useEffect(() => {
    function esc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center p-4 animate-fadeIn">
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-lg"
        onClick={onClose}
      />
      <div
        className={`relative modal-panel rounded-2xl p-7 w-full ${maxWidth} animate-slideUp`}
      >
        <div className="flex items-start justify-between gap-3 mb-5">
          {title && <div className="font-display text-xl font-semibold">{title}</div>}
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 -mr-2 -mt-2 ml-auto"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
