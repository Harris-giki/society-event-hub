# GIKI Society Event & Ticketing Hub

> **CS324 — Human Computer Interaction · Milestone 3 Demo**
> A complete, end-to-end Next.js prototype of a campus event management platform.
>
> **Team:** Raja Bilal Khurram (2023591) · M. Haris (2023428) · M. Ammar Saleem (2023378) · M. Bilal Shaikh (2023802)

---

## What's new in this iteration

- **Dean of Student Affairs** persona (Sabir Ahmed) replaces the older ADSA role.
- **Login fixes** — one-click autofill works reliably, no nested-button bug; email/password fields use plain placeholder text; logout no longer crashes any dashboard.
- **Profile + Edit profile** available on every role (Student / Organizer / Dean).
- **Event creation overhaul** — fixed venue dropdown (Main Auditorium 600, CS Auditorium 150, ACB MLH2 150, Seminar Hall Incubation 100, Faculty Lounge 100, Faculty Club 600, plus alphabet-only "Other"); auto-fills capacity from venue; faculty advisor (alphabet only) and budget (numeric, even 0) required; max ticket PKR 15,000; **poster/banner upload**; required **POC name + phone**; **submission note for the Dean**; **"Allow non-GIKI students" checkbox**.
- **Edit events** — organizers can edit any non-completed event. Material edits (date / venue / price / capacity) automatically reset to "pending" for Dean re-approval.
- **Delete cancelled events** — trash icon on cancelled / rejected / draft events to remove from the dashboard (with confirmation).
- **Sub-organizer delegation** — organizers invite a `@giki.edu.pk` email per event. If the user exists, instant scan access. If not, the invite stays pending and auto-activates the moment they sign up.
- **Real camera QR scanner** — `getUserMedia` + `jsQR` on laptop and phone, with manual ticket-code fallback (`XXXX-XXXX`), live verified-list sidebar, and per-event scan authorization.
- **Refund flow with progress** — three-stage progress UI (initiated → processing → completed), push notifications to both student and organizer.
- **Reject-with-feedback + Chat** — Dean's rejection opens a chat thread tied to that event. Both sides reply in-app; unread indicators bubble up to the notification bell.
- **Non-GIKI student flow** — non-`@giki.edu.pk` sign-up triggers extra required fields (CNIC, phone, emergency contact name + phone, university name, ID card photo). Non-GIKI users can only book events the organizer has opened to outsiders, and must accept event-day terms & conditions.
- **POC on event details** — students see the event point-of-contact phone, not the organizer's personal phone. Admins and organizers see student phones; students never see organizer personal contact.
- **Filters & sort dropdowns** — proper filter+sort pickers on My Events, Approvals, and Finance, plus a **"View all transactions"** modal with a full ledger.
- **Revenue removed from admin analytics** — Dean's view shows event/ticket activity, society leaderboard by tickets, attendance rate. Financial detail stays per-organizer.
- **Darker modal + notification panels** — high-contrast `modal-panel` and `popover-panel` styles fix legibility over busy backgrounds.
- **Bigger desktop typography** — base font scales up at ≥1024px and ≥1440px.
- **First-run guided tour** per role (Student / Organizer / Dean) walks new users through the key actions.

---

## What this is

A live, multi-role web application that demonstrates the full flow of a university event management system — from creation and approval, through booking and payment, to QR-based check-in at the door.

There is **no real backend or database**. State is held in a Zustand store with `localStorage` persistence so the demo feels exactly like a real product (data survives reloads, actions ripple between every dashboard in real time), without the operational overhead.

---

## Quick start

```bash
cd society-event-hub

# If a partial node_modules exists from before, remove it first:
rm -rf node_modules

npm install         # installs jsqr (for the real camera scanner) too
npm run dev
```

Open <http://localhost:3000>.

The first thing you'll see is a landing page. Click **Sign in**, pick a role, and click any of the pre-seeded demo accounts on the left to autofill credentials.

> **Verified:** `npm run build` produces a clean production build with 23 routes (zero TypeScript errors). The full bundle is ~122 kB on the heaviest page.

**Camera scanner note:** the real camera scanner uses `navigator.mediaDevices.getUserMedia` and `jsQR`. It works on:
- Localhost (`http://localhost:3000`) — always.
- HTTPS — required for non-localhost devices.
- Both **laptop webcams** and **phone cameras** (back-camera preferred, with a Switch button).
- Falls back gracefully to "Camera not supported" + manual ticket-code entry if access is denied.

---

## Demo accounts

| Role | Name | Email | Password |
|---|---|---|---|
| **Student** | Mumtaz Ali (primary persona — has tickets) | `mumtaz@giki.edu.pk` | `demo123` |
| Student | Muhammad Haris (fresh GIKI account) | `haris@giki.edu.pk` | `demo123` |
| Student | **Zara Khan (Non-GIKI)** | `zara.khan@nust.edu.pk` | `demo123` |
| **Organizer** | Ammar Khan — President, LDS | `ammar@giki.edu.pk` | `lds2026` |
| Organizer | Hamza Faraz — President, MLSA | `hamza@giki.edu.pk` | `mlsa2026` |
| **Dean / Admin** | **Sabir Ahmed — Dean of Student Affairs** | `dean.sa@giki.edu.pk` | `dean2026` |

The login page shows these by default, including a **one-click autofill**.

### Payment test cards
| Card number | Behaviour |
|---|---|
| `4242 4242 4242 4242` | Accepted (any expiry, any CVV) |
| `4000 0000 0000 0002` | **Declined** — for demoing error handling |

---

## Three dashboards, one source of truth

Every action ripples through every dashboard, in real time, via a shared Zustand store.

### Student
`/student/dashboard`
- Personalised home with featured event, week-at-a-glance, your active tickets
- `/student/events` — filter feed (category, price, search, sort)
- `/student/events/[id]` — full event details, capacity bar, low-stock warning
- Booking flow with online/cash payment, card validation, simulated decline
- `/student/tickets` — active vs. past vs. all tabs
- `/student/tickets/[id]` — printable QR ticket, refund, save
- `/student/profile` — preferences, demo reset button

### Organizer
`/organizer/dashboard`
- KPI tiles: live events, tickets sold, revenue, week ahead
- `/organizer/events` — pending/approved/rejected with reason
- `/organizer/events/new` — 3-step wizard with live preview, venue conflict detection
- `/organizer/events/[id]` — attendee list, CSV export, live progress, cancel-with-refund
- `/organizer/scanner` — QR validator (paste or one-tap from confirmed tickets)
- `/organizer/finance` — revenue per event, transaction ledger, CSV export

### Admin (ADSA)
`/admin/dashboard`
- Approval queue, schedule-conflict alerts, week ahead
- `/admin/approvals` — approve / reject with reason chooser
- `/admin/analytics` — events by category, monthly trend, society leaderboard
- `/admin/users` — directory of students, organizers, admins

---

## HCI principles applied

| Principle | Where to see it |
|---|---|
| **Learnability** | Familiar card-based feed, three-tab login, recognisable affordances |
| **Visibility of system status** | Toasts on every state change, progress bars, notification bell |
| **Feedback** | Inline field errors, loading spinners, success modals |
| **Error prevention** | Disabled buttons when invalid, conflict warnings at form time |
| **Error recovery** | Refund button, help center, retry on error page, demo reset |
| **Consistency** | Single design system (`globals.css`), shared glass primitives |
| **Recognition over recall** | Demo accounts panel, autocomplete venue dropdown |
| **Aesthetic & minimalist design** | Glassmorphism + aurora gradients, breathing whitespace |
| **Help & documentation** | Full `/help` center with FAQs, contact channels |
| **Accessibility** | Keyboard navigable, semantic HTML, focus rings, sufficient contrast |

---

## Cross-dashboard flow (the killer demo)

1. **Ammar** (organizer) creates "UI/UX Workshop" → it lands in **Tahir's** approval queue + Tahir gets a notification.
2. **Tahir** approves → **Ammar** gets a success notification + every **student** account gets a "new event live" notification.
3. **Mumtaz** opens his feed, sees the new event, books a ticket, pays online with a test card.
4. **Ammar's** organizer dashboard live-updates: 1 ticket sold, revenue counter ticks up, Mumtaz appears in attendees list. Ammar also gets a notification.
5. On event day, **Ammar** opens `/organizer/scanner`, taps Mumtaz's ticket in the side panel → "Check-in successful".
6. **Mumtaz** receives a "Checked in" notification on his side.

Every step is visible across every account. To see it: open three browser tabs (or three browsers) signed in as Mumtaz, Ammar, and Tahir, and watch the dashboards update.

---

## Edge cases handled

- ❌ Wrong password → inline error
- ❌ Email already exists on register → toast + form error
- ❌ Email in wrong role tab → "This account is registered as…"
- ❌ Card with non-16 digits → field error
- ❌ Card decline (`4000 0000 0000 0002`) → "Card declined by issuer"
- ❌ Sold-out event → button disabled, chip changes to "Sold out"
- ❌ Already-booked event → button replaced with "You're booked" + view ticket
- ❌ Event past → bookings closed message
- ❌ Already-scanned QR → "This ticket has already been used"
- ❌ Unauthorized scan attempt → "You can only scan tickets for events you organize"
- ❌ Venue conflict → warning surfaced at form-time AND on approval queue
- ❌ Event cancelled → all confirmed tickets auto-refunded, all attendees notified
- ❌ 404 page, error boundary

---

## File layout

```
society-event-hub/
├── app/
│   ├── layout.tsx          # root layout with aurora + grid noise
│   ├── globals.css         # design system (glass, aurora, typography)
│   ├── page.tsx            # landing page
│   ├── login/page.tsx      # 3-role login + register + demo accounts
│   ├── help/page.tsx       # help center (FAQs + contact)
│   ├── not-found.tsx       # 404
│   ├── error.tsx           # error boundary
│   ├── student/...         # 6 student pages
│   ├── organizer/...       # 6 organizer pages
│   └── admin/...           # 5 admin pages
├── components/
│   ├── NavBar.tsx          # responsive nav with role-aware links
│   ├── NotificationBell.tsx# realtime notif center
│   ├── QRCode.tsx          # QR generator
│   ├── Avatar.tsx, Toaster, Modal, Empty, RoleGuard...
├── lib/
│   ├── types.ts            # User/Event/Ticket/etc
│   ├── seed.ts             # pre-seeded users, events, tickets
│   ├── store.ts            # Zustand store + persistence + notif engine
│   └── utils.ts            # date/price formatters, conflict detection
├── public/                 # static assets
└── package.json
```

---

## Tech

- **Next.js 14** (App Router, RSC where possible, client where state)
- **TypeScript** — strict-off for velocity, types everywhere
- **Tailwind CSS** — with custom design tokens
- **Zustand** — global store + localStorage persistence
- **qrcode.react** — SVG QR generation
- **lucide-react** — iconography
- **date-fns** — date formatting

No backend. No database. No deployments to configure. Just `npm run dev` and demo away.

---

## Reset between demo runs

The Student → Profile page has a **"Reset demo data"** button that wipes everything and restores the original seed state. Use this between presentations.

---

## License

MIT. Built for CS324 at GIKI by Batch 33.
