"use client";
import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import {
  EventCategory,
  GIKI_VENUES,
  MAX_TICKET_PRICE,
  SocietyEvent,
  isAlphaOnly,
  isValidPkPhone,
} from "@/lib/types";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
  Eye,
  MapPin,
  Sparkles,
  Wand2,
  Tag,
  Users,
  Banknote,
  FileText,
  Building,
  ImageIcon,
  Phone,
  StickyNote,
  Globe2,
  X,
} from "lucide-react";
import Link from "next/link";
import { fmtDate, fmtPKR, softGradient } from "@/lib/utils";

const CATS: { c: EventCategory; emoji: string; hueRange: string }[] = [
  { c: "Workshop", emoji: "🎨", hueRange: "320" },
  { c: "Seminar", emoji: "🧠", hueRange: "180" },
  { c: "Competition", emoji: "🏆", hueRange: "260" },
  { c: "Tech", emoji: "💻", hueRange: "200" },
  { c: "Cultural", emoji: "🎭", hueRange: "30" },
  { c: "Sports", emoji: "⚽", hueRange: "120" },
];

interface Props {
  /** If provided, the form starts in edit mode for this event */
  editing?: SocietyEvent;
}

export function EventForm({ editing }: Props) {
  const router = useRouter();
  const createEvent = useStore((s) => s.createEvent);
  const editEvent = useStore((s) => s.editEventByOrganizer);
  const user = useStore((s) => s.currentUser());
  const events = useStore((s) => s.events);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [title, setTitle] = useState(editing?.title ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [longDescription, setLongDescription] = useState(editing?.longDescription ?? "");
  const [category, setCategory] = useState<EventCategory>(editing?.category ?? "Workshop");

  const initDate = editing ? new Date(editing.date) : null;
  const [date, setDate] = useState(initDate ? initDate.toISOString().slice(0, 10) : "");
  const [time, setTime] = useState(initDate ? initDate.toTimeString().slice(0, 5) : "17:00");
  const [duration, setDuration] = useState(() => {
    if (editing?.endDate) {
      const diff =
        (new Date(editing.endDate).getTime() - new Date(editing.date).getTime()) / 3600000;
      return String(diff);
    }
    return "2";
  });

  const [venueChoice, setVenueChoice] = useState(() => {
    if (!editing) return GIKI_VENUES[0].name;
    const match = GIKI_VENUES.find((v) => v.name === editing.venue);
    return match ? match.name : "Other";
  });
  const [otherVenueName, setOtherVenueName] = useState(
    editing && !GIKI_VENUES.find((v) => v.name === editing.venue) ? editing.venue : ""
  );

  const [capacity, setCapacity] = useState(String(editing?.capacity ?? 60));
  const [price, setPrice] = useState(String(editing?.ticketPrice ?? 0));
  const [advisor, setAdvisor] = useState(editing?.facultyAdvisor ?? "");
  const [budget, setBudget] = useState(String(editing?.budget ?? 0));
  const [resources, setResources] = useState<string[]>(editing?.resourcesRequested ?? []);
  const [emoji, setEmoji] = useState(editing?.coverEmoji ?? CATS[0].emoji);
  const [pocName, setPocName] = useState(editing?.pocName ?? user?.name ?? "");
  const [pocPhone, setPocPhone] = useState(editing?.pocPhone ?? user?.phone ?? "");
  const [allowNonGikian, setAllowNonGikian] = useState(editing?.allowNonGikian ?? false);
  const [submissionNote, setSubmissionNote] = useState(editing?.submissionNote ?? "");
  const [posterDataUrl, setPosterDataUrl] = useState(editing?.posterUrl ?? "");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const hue = CATS.find((c) => c.c === category)?.hueRange ?? "260";

  // Resolve actual venue + capacity
  const resolvedVenue =
    venueChoice === "Other" ? otherVenueName.trim() : venueChoice;
  const venueData = GIKI_VENUES.find((v) => v.name === venueChoice);

  // Auto-fill capacity from venue
  useEffect(() => {
    if (venueData) setCapacity(String(venueData.capacity));
  }, [venueChoice]); // eslint-disable-line react-hooks/exhaustive-deps

  // Conflict detector (excluding the event being edited)
  const isoDate = date && time ? new Date(`${date}T${time}:00`).toISOString() : "";
  const venueConflict =
    isoDate && resolvedVenue
      ? events.find(
          (e) =>
            e.id !== editing?.id &&
            e.venue === resolvedVenue &&
            (e.status === "approved" || e.status === "pending") &&
            Math.abs(new Date(e.date).getTime() - new Date(isoDate).getTime()) <
              parseFloat(duration) * 3600_000
        )
      : null;

  function validateStep1() {
    const errs: Record<string, string> = {};
    if (!title.trim() || title.length < 5)
      errs.title = "Title must be at least 5 characters.";
    if (!description.trim() || description.length < 20)
      errs.description = "Short description must be at least 20 characters.";
    if (!category) errs.category = "Pick a category.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateStep2() {
    const errs: Record<string, string> = {};
    if (!date) errs.date = "Date is required.";
    else if (new Date(`${date}T${time}`).getTime() < Date.now() && !editing)
      errs.date = "Event must be in the future.";
    if (!time) errs.time = "Time is required.";
    if (!resolvedVenue) errs.venue = "Venue is required.";
    if (venueChoice === "Other" && !isAlphaOnly(otherVenueName.replace(/\s/g, " ")))
      errs.venue = "Custom venue: alphabets and spaces only.";
    const cap = parseInt(capacity);
    if (!cap || cap < 5) errs.capacity = "Capacity must be at least 5.";
    if (cap > 1000) errs.capacity = "Capacity can't exceed 1000.";
    const pr = parseFloat(price);
    if (isNaN(pr) || pr < 0) errs.price = "Price must be 0 or higher.";
    if (pr > MAX_TICKET_PRICE) errs.price = `Maximum allowed ticket price is PKR ${MAX_TICKET_PRICE}.`;
    if (!advisor.trim()) errs.advisor = "Faculty advisor is required.";
    else if (!isAlphaOnly(advisor)) errs.advisor = "Faculty advisor: alphabets, periods, hyphens only.";
    if (budget === "" || isNaN(parseFloat(budget)) || parseFloat(budget) < 0)
      errs.budget = "Budget is required (enter 0 if none).";
    if (!pocName.trim()) errs.pocName = "POC name is required.";
    if (!pocPhone.trim() || !isValidPkPhone(pocPhone))
      errs.pocPhone = "POC phone must be a valid Pakistani number.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function next() {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  }

  function submit() {
    if (!validateStep1() || !validateStep2()) {
      setStep(1);
      return;
    }
    const iso = new Date(`${date}T${time}:00`).toISOString();
    const end = new Date(`${date}T${time}:00`);
    end.setHours(end.getHours() + parseFloat(duration));

    const payload = {
      title: title.trim(),
      description: description.trim(),
      longDescription: longDescription.trim() || description.trim(),
      category,
      date: iso,
      endDate: end.toISOString(),
      venue: resolvedVenue,
      venueIsCustom: venueChoice === "Other",
      capacity: parseInt(capacity),
      ticketPrice: parseFloat(price),
      coverHue: hue,
      coverEmoji: emoji,
      facultyAdvisor: advisor.trim(),
      budget: parseFloat(budget),
      resourcesRequested: resources,
      posterUrl: posterDataUrl || undefined,
      pocName: pocName.trim(),
      pocPhone: pocPhone.trim(),
      allowNonGikian,
      submissionNote: submissionNote.trim() || undefined,
    };

    if (editing) {
      const res = editEvent(editing.id, payload as Partial<SocietyEvent>);
      if (!res.ok) {
        setErrors({ ...errors, _global: res.error });
        return;
      }
      setSubmitted(true);
      setTimeout(() => router.push(`/organizer/events/${editing.id}`), 1300);
    } else {
      const created = createEvent(payload as any);
      if (created) {
        setSubmitted(true);
        setTimeout(() => router.push("/organizer/events"), 1500);
      }
    }
  }

  function toggleResource(r: string) {
    setResources((rs) => (rs.includes(r) ? rs.filter((x) => x !== r) : [...rs, r]));
  }

  function onPosterChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) {
      setErrors({ ...errors, poster: "Poster must be under 2 MB." });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPosterDataUrl(reader.result as string);
    reader.readAsDataURL(f);
  }

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto modal-panel rounded-2xl p-10 text-center animate-fadeIn">
        <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 grid place-items-center mb-4">
          <CheckCircle2 size={40} className="text-emerald-400" />
        </div>
        <div className="font-display text-2xl font-bold mb-1">
          {editing ? "Event updated!" : "Event submitted!"}
        </div>
        <div className="text-white/65 text-sm mb-4">
          {editing
            ? "Your changes have been saved."
            : "Your event has been sent to the Dean for approval. You'll get a notification once it's reviewed."}
        </div>
        <div className="text-xs text-white/45">Redirecting…</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link href="/organizer/events" className="btn btn-ghost text-sm -ml-3 w-fit">
        <ArrowLeft size={14} /> Back to my events
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">
            {editing ? "Edit event" : "Create event"}
          </h1>
          <p className="text-white/55 text-sm mt-1">
            {editing
              ? "Material changes (date/venue/price/capacity) require Dean re-approval."
              : "Fill out the form — once submitted, the Dean will review and approve."}
          </p>
        </div>
        <div className="hide-mobile text-xs text-white/55">
          Step {step} of 3
        </div>
      </div>

      {/* progress */}
      <div className="flex items-center gap-1 sm:gap-2">
        {[1, 2, 3].map((n) => (
          <div key={n} className="flex-1">
            <div
              className={`h-1.5 rounded-full transition ${
                step >= n
                  ? "bg-gradient-to-r from-violet-500 to-fuchsia-500"
                  : "bg-white/8"
              }`}
            />
            <div className="text-[10px] mt-1.5 text-white/55">
              {n === 1 ? "Basics" : n === 2 ? "Schedule & Details" : "Review"}
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6">
        <div className="space-y-5">
          {step === 1 && (
            <div className="gradient-border-card p-6 space-y-4 animate-fadeIn">
              <div className="field">
                <label className="field-label">
                  <FileText size={12} className="inline mr-1" /> Event title *
                </label>
                <input
                  className={`input ${errors.title ? "input-error" : ""}`}
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); setErrors({ ...errors, title: "" }); }}
                  placeholder="Enter event title"
                  maxLength={80}
                />
                <div className="flex items-center justify-between">
                  <div className="field-hint">{title.length}/80 characters</div>
                  {errors.title && (
                    <div className="field-error">
                      <AlertCircle size={12} /> {errors.title}
                    </div>
                  )}
                </div>
              </div>

              <div className="field">
                <label className="field-label">Short description *</label>
                <textarea
                  className={`textarea min-h-[80px] ${errors.description ? "input-error" : ""}`}
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); setErrors({ ...errors, description: "" }); }}
                  placeholder="One sentence that hooks students — appears on event cards."
                  maxLength={150}
                />
                <div className="flex items-center justify-between">
                  <div className="field-hint">{description.length}/150 characters</div>
                  {errors.description && (
                    <div className="field-error">
                      <AlertCircle size={12} /> {errors.description}
                    </div>
                  )}
                </div>
              </div>

              <div className="field">
                <label className="field-label">Full description (optional)</label>
                <textarea
                  className="textarea min-h-[120px]"
                  value={longDescription}
                  onChange={(e) => setLongDescription(e.target.value)}
                  placeholder="What can attendees expect? Schedule, speakers, prizes…"
                />
              </div>

              <div className="field">
                <label className="field-label">
                  <Tag size={12} className="inline mr-1" /> Category *
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {CATS.map((c) => {
                    const active = category === c.c;
                    return (
                      <button
                        key={c.c}
                        type="button"
                        onClick={() => { setCategory(c.c); setEmoji(c.emoji); }}
                        className={`rounded-xl p-3 border text-center transition ${
                          active
                            ? "border-fuchsia-400/60 bg-fuchsia-500/15"
                            : "border-white/10 hover:bg-white/5"
                        }`}
                      >
                        <div className="text-2xl mb-1">{c.emoji}</div>
                        <div className="text-[11px]">{c.c}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="field">
                <label className="field-label">
                  <Wand2 size={12} className="inline mr-1" /> Cover emoji
                </label>
                <input
                  className="input"
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value.slice(0, 4))}
                  placeholder="Pick an emoji that represents your event"
                />
                <div className="field-hint">Appears on event cards.</div>
              </div>

              <div className="field">
                <label className="field-label">
                  <ImageIcon size={12} className="inline mr-1" /> Event poster / banner
                </label>
                <label className="rounded-xl p-4 border border-dashed border-white/15 bg-white/[0.03] text-center cursor-pointer block hover:bg-white/[0.06] transition relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onPosterChange}
                    className="sr-only"
                  />
                  {posterDataUrl ? (
                    <div className="flex items-center justify-center gap-3">
                      <img src={posterDataUrl} alt="poster preview" className="h-20 object-cover rounded-lg" />
                      <div className="text-xs text-white/65">Tap to replace</div>
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); setPosterDataUrl(""); }}
                        className="absolute top-2 right-2 p-1 rounded-md bg-black/40 hover:bg-black/60"
                        aria-label="Remove poster"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs text-white/55">Tap to upload (max 2 MB) — appears on event cover</div>
                  )}
                </label>
                {errors.poster && (
                  <div className="field-error">
                    <AlertCircle size={12} /> {errors.poster}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="gradient-border-card p-6 space-y-4 animate-fadeIn">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="field">
                  <label className="field-label">
                    <CalendarIcon size={12} className="inline mr-1" /> Date *
                  </label>
                  <input
                    type="date"
                    className={`input ${errors.date ? "input-error" : ""}`}
                    value={date}
                    onChange={(e) => { setDate(e.target.value); setErrors({ ...errors, date: "" }); }}
                    min={editing ? undefined : today}
                  />
                  {errors.date && (
                    <div className="field-error">
                      <AlertCircle size={12} /> {errors.date}
                    </div>
                  )}
                </div>
                <div className="field">
                  <label className="field-label">Start time *</label>
                  <input
                    type="time"
                    className={`input ${errors.time ? "input-error" : ""}`}
                    value={time}
                    onChange={(e) => { setTime(e.target.value); setErrors({ ...errors, time: "" }); }}
                  />
                </div>
              </div>

              <div className="field">
                <label className="field-label">Duration (hours)</label>
                <select className="select" value={duration} onChange={(e) => setDuration(e.target.value)}>
                  <option value="1">1 hour</option>
                  <option value="1.5">1.5 hours</option>
                  <option value="2">2 hours</option>
                  <option value="3">3 hours</option>
                  <option value="4">4 hours</option>
                  <option value="6">Half day (6 hours)</option>
                  <option value="12">Full day (12 hours)</option>
                  <option value="24">24 hours (overnight)</option>
                </select>
              </div>

              <div className="field">
                <label className="field-label">
                  <MapPin size={12} className="inline mr-1" /> Venue *
                </label>
                <select
                  className="select"
                  value={venueChoice}
                  onChange={(e) => setVenueChoice(e.target.value)}
                >
                  {GIKI_VENUES.map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name} (capacity: {v.capacity})
                    </option>
                  ))}
                  <option value="Other">Other (specify)</option>
                </select>
                {venueChoice === "Other" && (
                  <input
                    className={`input mt-2 ${errors.venue ? "input-error" : ""}`}
                    value={otherVenueName}
                    onChange={(e) => {
                      // alphabets, spaces, dot, hyphen only
                      const v = e.target.value;
                      if (/^[a-zA-Z\s.\-']*$/.test(v)) setOtherVenueName(v);
                    }}
                    placeholder="Enter venue name (alphabets only)"
                    maxLength={50}
                  />
                )}
                {errors.venue && (
                  <div className="field-error">
                    <AlertCircle size={12} /> {errors.venue}
                  </div>
                )}
                {venueConflict && (
                  <div className="rounded-xl p-3 bg-amber-500/10 border border-amber-400/30 text-xs text-amber-200 flex items-start gap-2 mt-2">
                    <AlertCircle size={14} className="text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Venue conflict:</span> "{venueConflict.title}" is also scheduled here around the same time. The Dean may reject this — consider another slot or venue.
                    </div>
                  </div>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="field">
                  <label className="field-label">
                    <Users size={12} className="inline mr-1" /> Capacity *
                  </label>
                  <input
                    type="number"
                    className={`input ${errors.capacity ? "input-error" : ""}`}
                    value={capacity}
                    onChange={(e) => { setCapacity(e.target.value); setErrors({ ...errors, capacity: "" }); }}
                    min={5} max={venueData?.capacity ?? 1000}
                  />
                  <div className="field-hint">
                    {venueData
                      ? `Max for ${venueData.name}: ${venueData.capacity}`
                      : "Custom venue — set whatever fits"}
                  </div>
                  {errors.capacity && (
                    <div className="field-error">
                      <AlertCircle size={12} /> {errors.capacity}
                    </div>
                  )}
                </div>
                <div className="field">
                  <label className="field-label">
                    <Banknote size={12} className="inline mr-1" /> Ticket price (PKR)
                  </label>
                  <input
                    type="number"
                    className={`input ${errors.price ? "input-error" : ""}`}
                    value={price}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/[^\d.]/g, "");
                      setPrice(digits); setErrors({ ...errors, price: "" });
                    }}
                    min={0} max={MAX_TICKET_PRICE} step={50}
                    inputMode="numeric"
                  />
                  <div className="field-hint">0 = free. Max PKR {MAX_TICKET_PRICE.toLocaleString()}.</div>
                  {errors.price && (
                    <div className="field-error">
                      <AlertCircle size={12} /> {errors.price}
                    </div>
                  )}
                </div>
              </div>

              <div className="field">
                <label className="field-label">
                  <Building size={12} className="inline mr-1" /> Faculty advisor *
                </label>
                <input
                  className={`input ${errors.advisor ? "input-error" : ""}`}
                  value={advisor}
                  onChange={(e) => {
                    const v = e.target.value;
                    // Allow letters, spaces, periods, hyphens, apostrophes
                    if (/^[a-zA-Z\s.\-']*$/.test(v)) {
                      setAdvisor(v);
                      setErrors({ ...errors, advisor: "" });
                    }
                  }}
                  placeholder="Enter faculty advisor name"
                />
                {errors.advisor && (
                  <div className="field-error">
                    <AlertCircle size={12} /> {errors.advisor}
                  </div>
                )}
              </div>

              <div className="field">
                <label className="field-label">Budget request (PKR) *</label>
                <input
                  type="number"
                  className={`input ${errors.budget ? "input-error" : ""}`}
                  value={budget}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/[^\d.]/g, "");
                    setBudget(digits);
                    setErrors({ ...errors, budget: "" });
                  }}
                  min={0}
                  inputMode="numeric"
                  placeholder="Enter 0 if no budget needed"
                />
                <div className="field-hint">Required. Enter 0 for self-funded events.</div>
                {errors.budget && (
                  <div className="field-error">
                    <AlertCircle size={12} /> {errors.budget}
                  </div>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="field">
                  <label className="field-label">
                    <Phone size={12} className="inline mr-1" /> Event POC name *
                  </label>
                  <input
                    className={`input ${errors.pocName ? "input-error" : ""}`}
                    value={pocName}
                    onChange={(e) => {
                      if (/^[a-zA-Z\s.\-']*$/.test(e.target.value)) {
                        setPocName(e.target.value);
                        setErrors({ ...errors, pocName: "" });
                      }
                    }}
                    placeholder="Who students contact"
                  />
                  {errors.pocName && (
                    <div className="field-error">
                      <AlertCircle size={12} /> {errors.pocName}
                    </div>
                  )}
                </div>
                <div className="field">
                  <label className="field-label">
                    <Phone size={12} className="inline mr-1" /> Event POC phone *
                  </label>
                  <input
                    className={`input ${errors.pocPhone ? "input-error" : ""}`}
                    value={pocPhone}
                    onChange={(e) => { setPocPhone(e.target.value); setErrors({ ...errors, pocPhone: "" }); }}
                    placeholder="+92 3XX XXXXXXX"
                    inputMode="tel"
                  />
                  <div className="field-hint">Shown to students on event details.</div>
                  {errors.pocPhone && (
                    <div className="field-error">
                      <AlertCircle size={12} /> {errors.pocPhone}
                    </div>
                  )}
                </div>
              </div>

              <div className="field">
                <label className="field-label">Resources requested</label>
                <div className="flex flex-wrap gap-2">
                  {["Sound system", "Stage lighting", "Projector", "WiFi boost", "Refreshments", "Security", "Carpets", "Whiteboards"].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => toggleResource(r)}
                      className={`chip cursor-pointer ${
                        resources.includes(r)
                          ? "chip-violet"
                          : ""
                      }`}
                    >
                      {resources.includes(r) ? "✓ " : "+ "}{r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="field">
                <label className="cursor-pointer flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] transition">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={allowNonGikian}
                    onChange={(e) => setAllowNonGikian(e.target.checked)}
                  />
                  <div>
                    <div className="text-sm font-medium flex items-center gap-1.5">
                      <Globe2 size={14} /> Allow non-GIKI students to register
                    </div>
                    <div className="text-[11px] text-white/55 mt-0.5">
                      External students must provide CNIC, emergency contact, university ID card,
                      and accept event-day terms & conditions before booking.
                    </div>
                  </div>
                </label>
              </div>

              <div className="field">
                <label className="field-label">
                  <StickyNote size={12} className="inline mr-1" /> Note for the Dean (optional)
                </label>
                <textarea
                  className="textarea min-h-[80px]"
                  value={submissionNote}
                  onChange={(e) => setSubmissionNote(e.target.value)}
                  placeholder="Any context the Dean should consider when reviewing — sponsors, urgency, special arrangements…"
                  maxLength={400}
                />
                <div className="field-hint">{submissionNote.length}/400</div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="gradient-border-card p-6 space-y-4 animate-fadeIn">
              <div className="flex items-center gap-2 text-emerald-300 text-sm">
                <CheckCircle2 size={16} /> Review and {editing ? "save changes" : "submit"}
              </div>
              <ul className="text-sm text-white/70 space-y-2">
                <li>• <span className="text-white font-medium">{title}</span> ({category}) on <span className="text-white">{date && fmtDate(`${date}T${time}:00`, "EEE d MMM, h:mm a")}</span></li>
                <li>• Venue: <span className="text-white">{resolvedVenue}</span> — capacity {capacity}, price {fmtPKR(parseFloat(price) || 0)}</li>
                <li>• Faculty advisor: <span className="text-white">{advisor}</span>, budget PKR {parseFloat(budget).toLocaleString()}</li>
                <li>• POC: <span className="text-white">{pocName}</span> ({pocPhone})</li>
                <li>• Non-GIKI students: <span className="text-white">{allowNonGikian ? "allowed" : "not allowed"}</span></li>
              </ul>
              <div className="rounded-xl p-3 bg-white/5 border border-white/10 text-xs text-white/65">
                {editing ? (
                  <>
                    <span className="font-medium text-white">Note:</span> material changes (date,
                    venue, capacity, price) will reset this event to "pending" and require Dean
                    re-approval.
                  </>
                ) : (
                  <>
                    <span className="font-medium text-white">Heads up:</span> once submitted you can
                    edit until approval, after that material changes reset to pending again.
                  </>
                )}
              </div>
              {errors._global && (
                <div className="rounded-xl p-3 bg-rose-500/10 border border-rose-400/30 text-xs text-rose-200 flex items-start gap-2">
                  <AlertCircle size={14} className="text-rose-400 shrink-0 mt-0.5" />
                  {errors._global}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between items-center">
            <button
              onClick={() => step > 1 && setStep((step - 1) as any)}
              disabled={step === 1}
              className="btn btn-ghost"
            >
              <ArrowLeft size={14} /> Previous
            </button>
            {step < 3 ? (
              <button onClick={next} className="btn btn-primary">
                Continue →
              </button>
            ) : (
              <button onClick={submit} className="btn btn-primary">
                <Sparkles size={15} />{" "}
                {editing ? "Save changes" : "Submit for approval"}
              </button>
            )}
          </div>
        </div>

        {/* live preview */}
        <div className="lg:sticky lg:top-24 h-fit">
          <div className="text-xs text-white/55 mb-2 flex items-center gap-1.5">
            <Eye size={12} /> Live preview
          </div>
          <div className="glass rounded-2xl overflow-hidden">
            <div
              className="h-44 relative"
              style={{
                background: posterDataUrl ? undefined : softGradient(hue),
              }}
            >
              {posterDataUrl ? (
                <img src={posterDataUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
              ) : null}
              <div className="absolute top-3 left-3 chip chip-cyan backdrop-blur-md">
                {category}
              </div>
              {!posterDataUrl && (
                <div className="absolute right-3 bottom-3 text-5xl drop-shadow-lg">
                  {emoji}
                </div>
              )}
              {allowNonGikian && (
                <div className="absolute top-3 right-3 chip chip-emerald text-[10px] backdrop-blur-md">
                  <Globe2 size={10} /> Open to all
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="text-[11px] text-white/50">{user?.society ?? "Your society"}</div>
              <div className="font-display font-semibold leading-tight mt-1">
                {title || "Your event title"}
              </div>
              <div className="text-xs text-white/55 mt-1.5">
                {description || "Short description appears here."}
              </div>
              <div className="text-xs text-white/60 mt-3 flex items-center gap-1.5">
                <CalendarIcon size={11} />
                {date && time ? fmtDate(new Date(`${date}T${time}`).toISOString(), "EEE, d MMM • h:mm a") : "Date & time"}
              </div>
              <div className="text-xs text-white/60 flex items-center gap-1.5 mt-1">
                <MapPin size={11} /> {resolvedVenue || "Venue"}
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/8">
                <span className="text-sm font-semibold">{price ? fmtPKR(parseFloat(price)) : "Free"}</span>
                <span className="chip chip-emerald text-[10px]">
                  {capacity} seats
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
