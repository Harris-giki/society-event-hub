"use client";
import { useStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { EventForm } from "@/components/EventForm";
import { useEffect, useState } from "react";

export default function EditEventPage({ params }: { params: { id: string } }) {
  const event = useStore((s) => s.events.find((e) => e.id === params.id));
  const user = useStore((s) => s.currentUser());
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (!event || event.organizerId !== user.id) {
      router.replace("/organizer/events");
      return;
    }
    if (event.status === "cancelled" || event.status === "completed") {
      router.replace(`/organizer/events/${event.id}`);
      return;
    }
    setReady(true);
  }, [event, user, router]);

  if (!ready || !event) {
    return (
      <div className="text-center py-20">
        <div className="w-8 h-8 mx-auto rounded-full border-2 border-white/20 border-t-fuchsia-400 animate-spin" />
        <div className="text-sm text-white/55 mt-3">Loading event…</div>
      </div>
    );
  }
  return <EventForm editing={event} />;
}
