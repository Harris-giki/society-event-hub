"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { Modal } from "./Modal";
import { Star, CheckCircle2, AlertCircle } from "lucide-react";

export function ReviewModal({
  open,
  onClose,
  eventId,
  eventTitle,
}: {
  open: boolean;
  onClose: () => void;
  eventId: string;
  eventTitle: string;
}) {
  const submit = useStore((s) => s.submitReview);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [body, setBody] = useState("");
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  function send() {
    setErr("");
    if (rating === 0) { setErr("Pick a star rating first."); return; }
    if (!body.trim()) { setErr("Add a quick comment (min 5 characters)."); return; }
    if (body.trim().length < 5) { setErr("Comment too short."); return; }
    const r = submit(eventId, rating, body);
    if (!r.ok) {
      setErr(r.error);
      return;
    }
    setDone(true);
    setTimeout(() => {
      setDone(false);
      setRating(0); setBody(""); setHover(0);
      onClose();
    }, 1500);
  }

  return (
    <Modal open={open} onClose={onClose} title={done ? "" : "Rate your experience"}>
      {done ? (
        <div className="text-center py-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 grid place-items-center mb-3">
            <CheckCircle2 size={32} className="text-emerald-400" />
          </div>
          <div className="font-display text-lg font-semibold">Thanks for the feedback!</div>
          <div className="text-sm text-white/60 mt-1">The organizer can see your review.</div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-white/65">
            How was <span className="text-white font-medium">"{eventTitle}"</span>?
          </div>

          <div className="flex justify-center gap-1.5 py-2">
            {[1, 2, 3, 4, 5].map((n) => {
              const active = (hover || rating) >= n;
              return (
                <button
                  key={n}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(n)}
                  type="button"
                  className="transition-transform hover:scale-110"
                  aria-label={`${n} stars`}
                >
                  <Star
                    size={36}
                    className={
                      active
                        ? "fill-amber-300 text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                        : "text-white/25"
                    }
                  />
                </button>
              );
            })}
          </div>
          <div className="text-center text-xs text-white/55">
            {rating === 0
              ? "Tap a star"
              : rating === 5
              ? "Amazing! 🎉"
              : rating === 4
              ? "Pretty good!"
              : rating === 3
              ? "Decent"
              : rating === 2
              ? "Could be better"
              : "Not great"}
          </div>

          <div className="field">
            <label className="field-label">Tell us more</label>
            <textarea
              className="textarea min-h-[100px]"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="What worked? What could improve? Helpful for the organizer."
              maxLength={500}
            />
            <div className="field-hint">{body.length}/500 characters</div>
          </div>

          {err && (
            <div className="rounded-xl p-3 bg-rose-500/10 border border-rose-400/30 text-xs text-rose-200 flex items-center gap-2">
              <AlertCircle size={14} className="text-rose-400 shrink-0" />
              {err}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="btn btn-secondary">
              Maybe later
            </button>
            <button onClick={send} className="btn btn-primary">
              <Star size={14} /> Submit review
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
