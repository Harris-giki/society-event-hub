"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  ChatMessage,
  Notification,
  Payment,
  Review,
  Role,
  Society,
  SocietyEvent,
  SubOrganizerInvite,
  Ticket,
  ToastMsg,
  User,
  isGikiEmail,
} from "./types";
import {
  seedChatMessages,
  seedEvents,
  seedInvitations,
  seedNotifications,
  seedReviews,
  seedSocieties,
  seedTickets,
  seedUsers,
} from "./seed";

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now()
    .toString(36)
    .slice(-3)}`;
}

function shortCode() {
  // 8-char alphanumeric code formatted XXXX-XXXX
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 8; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s.slice(0, 4) + "-" + s.slice(4);
}

interface State {
  users: User[];
  events: SocietyEvent[];
  tickets: Ticket[];
  payments: Payment[];
  notifications: Notification[];
  invitations: SubOrganizerInvite[];
  chatMessages: ChatMessage[];
  societies: Society[];
  reviews: Review[];
  toasts: ToastMsg[];

  currentUserId: string | null;
  hydrated: boolean;

  // ---- auth ----
  login: (
    email: string,
    password: string,
    role: Role
  ) => { ok: true; user: User } | { ok: false; error: string };
  register: (
    user: Omit<User, "id" | "avatarSeed"> & { avatarSeed?: string }
  ) => { ok: true; user: User } | { ok: false; error: string };
  logout: () => void;

  // ---- events ----
  createEvent: (
    e: Omit<
      SocietyEvent,
      "id" | "status" | "createdAt" | "organizerId" | "society"
    >
  ) => SocietyEvent | null;
  updateEvent: (id: string, patch: Partial<SocietyEvent>) => void;
  editEventByOrganizer: (
    id: string,
    patch: Partial<SocietyEvent>
  ) => { ok: true } | { ok: false; error: string };
  approveEvent: (id: string) => void;
  rejectEvent: (id: string, reason: string) => void;
  cancelEvent: (id: string) => void;
  deleteEvent: (id: string) => boolean; // permanent delete; only allowed on cancelled/rejected/draft

  // ---- tickets ----
  bookTicket: (
    eventId: string,
    paymentMethod: "online" | "cash",
    cardData?: { number: string; cvv: string; expiry: string; name: string },
    termsAccepted?: boolean
  ) =>
    | { ok: true; ticket: Ticket }
    | { ok: false; error: string; field?: string };

  // scanner — accepts a QR payload OR a ticket-code (manual entry)
  scanTicket: (
    code: string,
    scannerId: string
  ) =>
    | { ok: true; ticket: Ticket; event: SocietyEvent; user: User }
    | { ok: false; error: string };

  refundTicket: (ticketId: string) => boolean;

  // ---- sub-organizer ----
  inviteSubOrganizer: (
    eventId: string,
    email: string
  ) => { ok: true; existing: boolean } | { ok: false; error: string };
  removeSubOrganizer: (eventId: string, email: string) => void;

  // ---- chat ----
  sendChat: (
    eventId: string,
    toUserId: string,
    body: string,
    opts?: { isRejectionNote?: boolean }
  ) => ChatMessage | null;
  markChatRead: (eventId: string, fromUserId: string, toUserId: string) => void;

  // ---- notifications ----
  pushNotification: (n: Omit<Notification, "id" | "createdAt" | "read">) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: (userId: string) => void;

  // ---- toasts ----
  pushToast: (t: Omit<ToastMsg, "id">) => void;
  dismissToast: (id: string) => void;

  // ---- profile ----
  updateProfile: (
    userId: string,
    patch: Partial<User>
  ) => { ok: true } | { ok: false; error: string };

  // ---- society approval ----
  approveSociety: (id: string) => void;
  rejectSocietyApplication: (
    organizerUserId: string,
    reason: string
  ) => void;
  approveOrganizer: (userId: string) => void;
  rejectOrganizer: (userId: string, reason: string) => void;

  // ---- reviews ----
  submitReview: (
    eventId: string,
    rating: number,
    body: string
  ) => { ok: true; review: Review } | { ok: false; error: string };

  // ---- resubmit rejected event ----
  resubmitEvent: (id: string) => { ok: true } | { ok: false; error: string };

  // ---- selectors helpers ----
  currentUser: () => User | null;
  canUserScanEvent: (userId: string, eventId: string) => boolean;

  // ---- testing / reset ----
  resetAll: () => void;
}

function notifyByRole(
  state: State,
  scope: Role,
  payload: Omit<Notification, "id" | "createdAt" | "read" | "userId">
) {
  const recipients = state.users.filter((u) => u.role === scope);
  const newNotifs: Notification[] = recipients.map((u) => ({
    ...payload,
    id: uid("n"),
    userId: u.id,
    read: false,
    createdAt: new Date().toISOString(),
  }));
  return newNotifs;
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      users: seedUsers,
      events: seedEvents,
      tickets: seedTickets,
      payments: [],
      notifications: seedNotifications,
      invitations: seedInvitations,
      chatMessages: seedChatMessages,
      societies: seedSocieties,
      reviews: seedReviews,
      toasts: [],
      currentUserId: null,
      hydrated: false,

      currentUser: () => {
        const id = get().currentUserId;
        if (!id) return null;
        return get().users.find((u) => u.id === id) ?? null;
      },

      canUserScanEvent: (userId, eventId) => {
        const u = get().users.find((x) => x.id === userId);
        if (!u) return false;
        if (u.role === "admin") return true;
        const ev = get().events.find((e) => e.id === eventId);
        if (!ev) return false;
        if (ev.organizerId === userId) return true;
        // sub-organizer email match
        if (
          ev.subOrganizerEmails?.some(
            (e) => e.toLowerCase() === u.email.toLowerCase()
          )
        ) {
          return true;
        }
        return false;
      },

      // ---------- AUTH ----------
      login: (email, password, role) => {
        const trimmedEmail = email.trim().toLowerCase();
        const user = get().users.find(
          (u) => u.email.toLowerCase() === trimmedEmail
        );
        if (!user) {
          return { ok: false, error: "No account found with that email." };
        }
        if (user.role !== role) {
          return {
            ok: false,
            error: `This account is registered as ${user.role}, not ${role}. Switch the role tab.`,
          };
        }
        if (user.password !== password) {
          return { ok: false, error: "Incorrect password. Please try again." };
        }
        set({ currentUserId: user.id });
        get().pushToast({
          tone: "success",
          title: `Welcome back, ${user.name.split(" ")[0]} 👋`,
          body: `Signed in as ${user.role}.`,
        });
        // After successful login, auto-accept any pending sub-organizer invites
        // whose email matches this user.
        const invites = get().invitations.filter(
          (i) => i.email.toLowerCase() === user.email.toLowerCase() && i.status === "pending"
        );
        if (invites.length) {
          set((s) => ({
            invitations: s.invitations.map((i) =>
              invites.some((x) => x.id === i.id)
                ? { ...i, status: "accepted", acceptedAt: new Date().toISOString(), acceptedByUserId: user.id }
                : i
            ),
            events: s.events.map((e) => {
              const inv = invites.find((x) => x.eventId === e.id);
              if (!inv) return e;
              const existing = e.subOrganizerEmails ?? [];
              return existing.includes(user.email)
                ? e
                : { ...e, subOrganizerEmails: [...existing, user.email] };
            }),
          }));
          get().pushToast({
            tone: "info",
            title: "Sub-organizer access granted",
            body: `You can now scan tickets for ${invites.length} event(s).`,
          });
        }
        return { ok: true, user };
      },

      register: (input) => {
        const exists = get().users.some(
          (u) => u.email.toLowerCase() === input.email.toLowerCase()
        );
        if (exists) {
          return { ok: false, error: "An account with this email already exists." };
        }
        if (input.password.length < 6) {
          return {
            ok: false,
            error: "Password must be at least 6 characters.",
          };
        }
        // Organizer accounts must use @giki.edu.pk emails AND specify a society
        if (input.role === "organizer") {
          if (!isGikiEmail(input.email)) {
            return {
              ok: false,
              error: "Organizer accounts must use a @giki.edu.pk email address.",
            };
          }
          if (!input.society || !input.society.trim()) {
            return {
              ok: false,
              error: "Society name is required for organizers.",
            };
          }
        }
        // Non-GIKI students must provide CNIC, emergency contact, university name
        const gikian = isGikiEmail(input.email);
        if (input.role === "student" && !gikian) {
          if (!input.cnic) {
            return { ok: false, error: "CNIC is required for non-GIKI students." };
          }
          if (!input.emergencyContact) {
            return {
              ok: false,
              error: "Emergency contact phone is required for non-GIKI students.",
            };
          }
          if (!input.universityName) {
            return {
              ok: false,
              error: "University name is required for non-GIKI students.",
            };
          }
        }
        // For organizers, determine accountStatus based on whether the society
        // is already approved in the registry.
        let accountStatus: "approved" | "pending" = "approved";
        let societyAlreadyExists = false;
        if (input.role === "organizer") {
          const norm = input.society!.trim().toLowerCase();
          const existing = get().societies.find(
            (s) => s.name.trim().toLowerCase() === norm
          );
          if (existing && existing.status === "approved") {
            accountStatus = "approved";
            societyAlreadyExists = true;
          } else {
            accountStatus = "pending";
          }
        }

        const u: User = {
          ...input,
          id: uid("u"),
          avatarSeed:
            input.avatarSeed ?? input.name.replace(/\s/g, "").toLowerCase(),
          isGikian: gikian,
          accountStatus:
            input.role === "organizer" ? accountStatus : "approved",
          appliedAt: input.role === "organizer" ? new Date().toISOString() : undefined,
          approvedAt:
            input.role === "organizer" && accountStatus === "approved"
              ? new Date().toISOString()
              : undefined,
        };
        set((s) => ({ users: [...s.users, u], currentUserId: u.id }));

        // If organizer applied with a brand-new society, register it as pending
        // and notify the Dean.
        if (input.role === "organizer" && !societyAlreadyExists) {
          const newSoc: Society = {
            id: uid("soc"),
            name: input.society!.trim(),
            status: "pending",
            appliedBy: u.id,
            createdAt: new Date().toISOString(),
          };
          set((s) => ({ societies: [...s.societies, newSoc] }));
          const admins = get().users.filter((x) => x.role === "admin");
          const notifs: Notification[] = admins.map((a) => ({
            id: uid("n"),
            userId: a.id,
            title: "🏛️ New society application",
            body: `${u.name} wants to register "${newSoc.name}" — review needed.`,
            tone: "warn",
            icon: "🏛️",
            read: false,
            link: "/admin/approvals",
            createdAt: new Date().toISOString(),
          }));
          set((s) => ({ notifications: [...notifs, ...s.notifications] }));
        }

        if (input.role === "organizer" && accountStatus === "pending") {
          get().pushToast({
            tone: "info",
            title: "Account submitted",
            body: "The Dean will review your society & account application.",
          });
        } else {
          get().pushToast({
            tone: "success",
            title: "Account created 🎉",
            body: "You're signed in.",
          });
        }
        // accept any pending sub-organizer invites for this email
        const invites = get().invitations.filter(
          (i) => i.email.toLowerCase() === u.email.toLowerCase() && i.status === "pending"
        );
        if (invites.length) {
          set((s) => ({
            invitations: s.invitations.map((i) =>
              invites.some((x) => x.id === i.id)
                ? { ...i, status: "accepted", acceptedAt: new Date().toISOString(), acceptedByUserId: u.id }
                : i
            ),
            events: s.events.map((e) => {
              const inv = invites.find((x) => x.eventId === e.id);
              if (!inv) return e;
              const existing = e.subOrganizerEmails ?? [];
              return existing.includes(u.email)
                ? e
                : { ...e, subOrganizerEmails: [...existing, u.email] };
            }),
          }));
        }
        return { ok: true, user: u };
      },

      logout: () => {
        // Pure state update — no side effects that could throw client-side.
        set({ currentUserId: null, toasts: [] });
      },

      // ---------- EVENTS ----------
      createEvent: (e) => {
        const user = get().currentUser();
        if (!user || user.role !== "organizer") {
          get().pushToast({
            tone: "danger",
            title: "Not authorized",
            body: "Only organizers can create events.",
          });
          return null;
        }
        const ev: SocietyEvent = {
          ...e,
          id: uid("evt"),
          organizerId: user.id,
          society: user.society ?? "Independent",
          status: "pending",
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ events: [...s.events, ev] }));

        // notify admins
        const admins = get().users.filter((u) => u.role === "admin");
        const notifs: Notification[] = admins.map((a) => ({
          id: uid("n"),
          userId: a.id,
          title: "New event awaiting approval",
          body: `${ev.title} — submitted by ${user.society}.`,
          icon: "📨",
          read: false,
          tone: "warn",
          link: `/admin/approvals`,
          createdAt: new Date().toISOString(),
        }));
        set((s) => ({ notifications: [...notifs, ...s.notifications] }));

        get().pushToast({
          tone: "success",
          title: "Event submitted",
          body: "Awaiting Dean approval.",
        });
        return ev;
      },

      updateEvent: (id, patch) => {
        set((s) => ({
          events: s.events.map((e) => (e.id === id ? { ...e, ...patch } : e)),
        }));
      },

      editEventByOrganizer: (id, patch) => {
        const user = get().currentUser();
        if (!user || user.role !== "organizer") {
          return { ok: false, error: "Only organizers can edit events." };
        }
        const ev = get().events.find((e) => e.id === id);
        if (!ev) return { ok: false, error: "Event not found." };
        if (ev.organizerId !== user.id) {
          return { ok: false, error: "You can only edit your own events." };
        }
        if (ev.status === "completed" || ev.status === "cancelled") {
          return {
            ok: false,
            error: "Completed or cancelled events can't be edited.",
          };
        }
        // Material edits (date/venue/price/capacity) reset status to pending
        const materialKeys: (keyof SocietyEvent)[] = [
          "date",
          "endDate",
          "venue",
          "capacity",
          "ticketPrice",
        ];
        const materialChange = materialKeys.some(
          (k) =>
            patch[k] !== undefined &&
            JSON.stringify(patch[k]) !== JSON.stringify(ev[k])
        );
        const newStatus =
          materialChange && ev.status === "approved" ? "pending" : ev.status;
        set((s) => ({
          events: s.events.map((e) =>
            e.id === id
              ? { ...e, ...patch, status: newStatus }
              : e
          ),
        }));

        if (materialChange && ev.status === "approved") {
          // Notify admins that re-approval needed
          const admins = get().users.filter((u) => u.role === "admin");
          const notifs: Notification[] = admins.map((a) => ({
            id: uid("n"),
            userId: a.id,
            title: "Event edited — re-approval needed",
            body: `"${ev.title}" was edited and now needs your review again.`,
            tone: "warn",
            icon: "✏️",
            read: false,
            createdAt: new Date().toISOString(),
            link: "/admin/approvals",
          }));
          set((s) => ({ notifications: [...notifs, ...s.notifications] }));
          get().pushToast({
            tone: "warn",
            title: "Resubmitted for approval",
            body: "Material changes mean the Dean needs to re-approve.",
          });
        } else {
          get().pushToast({
            tone: "success",
            title: "Event updated",
            body: "Changes saved.",
          });
        }
        return { ok: true };
      },

      approveEvent: (id) => {
        const user = get().currentUser();
        if (!user || user.role !== "admin") return;
        const ev = get().events.find((e) => e.id === id);
        if (!ev) return;

        set((s) => ({
          events: s.events.map((e) =>
            e.id === id
              ? {
                  ...e,
                  status: "approved",
                  approvedBy: user.id,
                  approvedAt: new Date().toISOString(),
                }
              : e
          ),
        }));

        // Notify organizer
        const orgNotif: Notification = {
          id: uid("n"),
          userId: ev.organizerId,
          title: "✅ Event approved",
          body: `Your event "${ev.title}" is now live to students.`,
          read: false,
          tone: "success",
          icon: "✅",
          link: `/organizer/events`,
          createdAt: new Date().toISOString(),
        };
        // Notify all students (broadcast)
        const studentNotifs = notifyByRole(get(), "student", {
          title: "🎟️ New event live",
          body: `${ev.title} is now open for bookings.`,
          tone: "info",
          icon: "🎟️",
          link: `/student/events`,
          scope: "student",
        });
        set((s) => ({
          notifications: [orgNotif, ...studentNotifs, ...s.notifications],
        }));
        get().pushToast({
          tone: "success",
          title: "Event approved",
          body: `"${ev.title}" is now live.`,
        });
      },

      rejectEvent: (id, reason) => {
        const user = get().currentUser();
        if (!user || user.role !== "admin") return;
        const ev = get().events.find((e) => e.id === id);
        if (!ev) return;
        set((s) => ({
          events: s.events.map((e) =>
            e.id === id ? { ...e, status: "rejected", rejectionReason: reason } : e
          ),
        }));
        // Create a chat message from admin to organizer with this rejection reason
        const msg: ChatMessage = {
          id: uid("chat"),
          eventId: ev.id,
          fromUserId: user.id,
          toUserId: ev.organizerId,
          body: reason,
          read: false,
          createdAt: new Date().toISOString(),
          isRejectionNote: true,
        };
        const notif: Notification = {
          id: uid("n"),
          userId: ev.organizerId,
          title: "❌ Event rejected",
          body: `"${ev.title}" — reply in chat to discuss with the Dean.`,
          tone: "danger",
          read: false,
          icon: "❌",
          link: `/organizer/events/${ev.id}`,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          chatMessages: [...s.chatMessages, msg],
          notifications: [notif, ...s.notifications],
        }));
        get().pushToast({
          tone: "warn",
          title: "Event rejected",
          body: "A chat thread has been opened with the organizer.",
        });
      },

      cancelEvent: (id) => {
        const ev = get().events.find((e) => e.id === id);
        if (!ev) return;
        set((s) => ({
          events: s.events.map((e) =>
            e.id === id ? { ...e, status: "cancelled" } : e
          ),
        }));
        // Refund all confirmed tickets
        const refundedIds: string[] = [];
        set((s) => ({
          tickets: s.tickets.map((t) => {
            if (t.eventId === id && t.status === "confirmed") {
              refundedIds.push(t.id);
              return {
                ...t,
                status: "refunded",
                refundProgress: {
                  stage: "completed",
                  initiatedAt: new Date().toISOString(),
                  processingAt: new Date().toISOString(),
                  completedAt: new Date().toISOString(),
                },
              };
            }
            return t;
          }),
        }));
        // Notify all booked users
        const ticketUserIds = Array.from(
          new Set(
            get()
              .tickets.filter((t) => t.eventId === id)
              .map((t) => t.userId)
          )
        );
        const notifs: Notification[] = ticketUserIds.map((uid_) => ({
          id: uid("n"),
          userId: uid_,
          title: "Event cancelled — refund issued",
          body: `"${ev.title}" was cancelled by the organizer. Your payment has been refunded.`,
          tone: "warn",
          read: false,
          icon: "💸",
          link: "/student/tickets",
          createdAt: new Date().toISOString(),
        }));
        set((s) => ({ notifications: [...notifs, ...s.notifications] }));
        get().pushToast({
          tone: "warn",
          title: "Event cancelled",
          body: `${refundedIds.length} ticket(s) refunded.`,
        });
      },

      deleteEvent: (id) => {
        const user = get().currentUser();
        const ev = get().events.find((e) => e.id === id);
        if (!ev) return false;
        // only organizer of event or admin can delete
        if (!user || (user.role !== "admin" && ev.organizerId !== user.id)) {
          return false;
        }
        // safety: only allow deletion of cancelled/rejected/draft events
        if (!["cancelled", "rejected", "draft"].includes(ev.status)) {
          get().pushToast({
            tone: "danger",
            title: "Can't delete",
            body: "Only cancelled, rejected, or draft events can be deleted.",
          });
          return false;
        }
        set((s) => ({
          events: s.events.filter((e) => e.id !== id),
          // also clean up linked records to avoid dangling references
          tickets: s.tickets.filter((t) => t.eventId !== id),
          payments: s.payments.filter((p) => {
            const tk = s.tickets.find((t) => t.id === p.ticketId);
            return tk ? tk.eventId !== id : true;
          }),
          chatMessages: s.chatMessages.filter((c) => c.eventId !== id),
          invitations: s.invitations.filter((i) => i.eventId !== id),
        }));
        get().pushToast({
          tone: "success",
          title: "Event deleted",
          body: `"${ev.title}" has been removed from your dashboard.`,
        });
        return true;
      },

      // ---------- TICKETS ----------
      bookTicket: (eventId, paymentMethod, cardData, termsAccepted) => {
        const user = get().currentUser();
        if (!user) return { ok: false, error: "Please log in first." };
        const event = get().events.find((e) => e.id === eventId);
        if (!event) return { ok: false, error: "Event not found." };
        if (event.status !== "approved") {
          return { ok: false, error: "This event is not open for bookings." };
        }
        if (new Date(event.date).getTime() < Date.now()) {
          return { ok: false, error: "This event has already started/passed." };
        }
        // non-GIKIAN gating
        if (!user.isGikian) {
          if (!event.allowNonGikian) {
            return {
              ok: false,
              error: "This event is open to GIKI students only.",
            };
          }
          if (!termsAccepted) {
            return {
              ok: false,
              error: "Please accept the terms & conditions to continue.",
              field: "terms",
            };
          }
        }
        const alreadyBooked = get().tickets.find(
          (t) =>
            t.eventId === eventId &&
            t.userId === user.id &&
            (t.status === "confirmed" || t.status === "scanned")
        );
        if (alreadyBooked) {
          return {
            ok: false,
            error: "You already have a ticket for this event.",
          };
        }
        const sold = get().tickets.filter(
          (t) =>
            t.eventId === eventId &&
            (t.status === "confirmed" || t.status === "scanned")
        ).length;
        if (sold >= event.capacity) {
          return { ok: false, error: "Sold out — no seats remaining." };
        }

        // Card validation (mock) — used to demo error handling
        if (paymentMethod === "online" && event.ticketPrice > 0) {
          if (!cardData) {
            return {
              ok: false,
              error: "Please enter your card details.",
              field: "card.number",
            };
          }
          const digits = cardData.number.replace(/\s/g, "");
          if (!/^\d{16}$/.test(digits)) {
            return {
              ok: false,
              error: "Card number must be exactly 16 digits.",
              field: "card.number",
            };
          }
          if (!/^\d{3,4}$/.test(cardData.cvv)) {
            return {
              ok: false,
              error: "CVV must be 3 or 4 digits.",
              field: "card.cvv",
            };
          }
          if (!/^\d{2}\/\d{2}$/.test(cardData.expiry)) {
            return {
              ok: false,
              error: "Expiry must be in MM/YY format.",
              field: "card.expiry",
            };
          }
          // Demo: card 4000000000000002 = decline
          if (digits === "4000000000000002") {
            const p: Payment = {
              id: uid("pay"),
              ticketId: "",
              userId: user.id,
              amount: event.ticketPrice,
              method: "online",
              status: "failed",
              createdAt: new Date().toISOString(),
              failureReason: "Card declined by issuer.",
            };
            set((s) => ({ payments: [p, ...s.payments] }));
            return {
              ok: false,
              error: "Card declined by issuer. Try another card.",
              field: "card.number",
            };
          }
          if (!cardData.name.trim()) {
            return { ok: false, error: "Cardholder name required.", field: "card.name" };
          }
        }

        const ticket: Ticket = {
          id: uid("tkt"),
          eventId,
          userId: user.id,
          bookedAt: new Date().toISOString(),
          status: "confirmed",
          paymentMethod,
          amount: event.ticketPrice,
          qrPayload: `GIKI-EVENT|${eventId}|${uid("q")}|${user.id}`,
          ticketCode: shortCode(),
          seatLabel: "Open seating",
          termsAccepted: termsAccepted ?? undefined,
        };
        set((s) => ({ tickets: [ticket, ...s.tickets] }));

        // payment record
        const payment: Payment = {
          id: uid("pay"),
          ticketId: ticket.id,
          userId: user.id,
          amount: event.ticketPrice,
          method: paymentMethod,
          status: paymentMethod === "online" ? "succeeded" : "pending",
          cardLast4:
            paymentMethod === "online" && cardData
              ? cardData.number.replace(/\s/g, "").slice(-4)
              : undefined,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ payments: [payment, ...s.payments] }));

        // notify organizer
        const orgNotif: Notification = {
          id: uid("n"),
          userId: event.organizerId,
          title: "🎟️ New ticket sold",
          body: `${user.name} booked "${event.title}" — PKR ${event.ticketPrice}.`,
          tone: "info",
          read: false,
          icon: "🎟️",
          link: "/organizer/events",
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ notifications: [orgNotif, ...s.notifications] }));

        return { ok: true, ticket };
      },

      scanTicket: (code, scannerId) => {
        const trimmed = code.trim();
        if (!trimmed) {
          return { ok: false, error: "Please enter a ticket code or scan QR." };
        }
        // accept either full QR payload OR short ticket code
        let ticket: Ticket | undefined;
        if (trimmed.startsWith("GIKI-EVENT|")) {
          ticket = get().tickets.find((t) => t.qrPayload === trimmed);
        } else {
          // try by ticket code (case-insensitive)
          const lc = trimmed.toUpperCase().replace(/\s/g, "");
          ticket = get().tickets.find(
            (t) =>
              t.ticketCode.toUpperCase().replace(/\s/g, "") === lc ||
              t.id.toLowerCase() === trimmed.toLowerCase()
          );
        }
        if (!ticket) {
          return { ok: false, error: "Ticket not found in the system." };
        }
        if (ticket.status === "scanned") {
          return { ok: false, error: "This ticket has already been used." };
        }
        if (ticket.status === "cancelled" || ticket.status === "refunded") {
          return { ok: false, error: "This ticket has been cancelled or refunded." };
        }
        const event = get().events.find((e) => e.id === ticket.eventId);
        if (!event) return { ok: false, error: "Linked event missing." };
        // only authorized scanner can scan
        if (!get().canUserScanEvent(scannerId, event.id)) {
          return {
            ok: false,
            error: "You're not authorised to scan tickets for this event.",
          };
        }
        set((s) => ({
          tickets: s.tickets.map((t) =>
            t.id === ticket!.id
              ? {
                  ...t,
                  status: "scanned",
                  scannedAt: new Date().toISOString(),
                  scannedBy: scannerId,
                }
              : t
          ),
        }));
        const ticketUser = get().users.find((u) => u.id === ticket.userId)!;
        // Notify the student
        const notif: Notification = {
          id: uid("n"),
          userId: ticket.userId,
          title: "✅ Checked in",
          body: `You've been checked in to "${event.title}". Enjoy!`,
          tone: "success",
          read: false,
          icon: "✅",
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ notifications: [notif, ...s.notifications] }));
        return {
          ok: true,
          ticket: { ...ticket, status: "scanned" },
          event,
          user: ticketUser,
        };
      },

      refundTicket: (ticketId) => {
        const ticket = get().tickets.find((t) => t.id === ticketId);
        if (!ticket || ticket.status !== "confirmed") return false;
        const event = get().events.find((e) => e.id === ticket.eventId);
        const now = new Date().toISOString();

        // Stage 1: initiated
        set((s) => ({
          tickets: s.tickets.map((t) =>
            t.id === ticketId
              ? {
                  ...t,
                  refundProgress: {
                    stage: "initiated",
                    initiatedAt: now,
                  },
                }
              : t
          ),
        }));

        // Stage 2: processing (after ~700ms)
        setTimeout(() => {
          set((s) => ({
            tickets: s.tickets.map((t) =>
              t.id === ticketId
                ? {
                    ...t,
                    refundProgress: {
                      ...(t.refundProgress ?? { initiatedAt: now }),
                      stage: "processing",
                      processingAt: new Date().toISOString(),
                    },
                  }
                : t
            ),
          }));
        }, 700);

        // Stage 3: completed (after ~1800ms total)
        setTimeout(() => {
          set((s) => ({
            tickets: s.tickets.map((t) =>
              t.id === ticketId
                ? {
                    ...t,
                    status: "refunded",
                    refundProgress: {
                      ...(t.refundProgress ?? {}),
                      stage: "completed",
                      completedAt: new Date().toISOString(),
                    },
                  }
                : t
            ),
            payments: s.payments.map((p) =>
              p.ticketId === ticketId ? { ...p, status: "refunded" } : p
            ),
          }));
          // Push notifications to student + organizer
          const studentNotif: Notification = {
            id: uid("n"),
            userId: ticket.userId,
            title: "💸 Refund completed",
            body: `Refund issued for "${event?.title ?? "your ticket"}".`,
            tone: "success",
            icon: "💸",
            read: false,
            createdAt: new Date().toISOString(),
            link: "/student/tickets",
          };
          set((s) => ({ notifications: [studentNotif, ...s.notifications] }));
          if (event) {
            const orgNotif: Notification = {
              id: uid("n"),
              userId: event.organizerId,
              title: "Ticket refunded",
              body: `A ticket for "${event.title}" was cancelled & refunded.`,
              tone: "warn",
              icon: "↩️",
              read: false,
              createdAt: new Date().toISOString(),
              link: `/organizer/events/${event.id}`,
            };
            set((s) => ({ notifications: [orgNotif, ...s.notifications] }));
          }
          get().pushToast({
            tone: "success",
            title: "Refund completed",
            body: "Funds reflect in 3–5 working days.",
          });
        }, 1800);

        return true;
      },

      // ---------- SUB-ORGANIZER ----------
      inviteSubOrganizer: (eventId, email) => {
        const user = get().currentUser();
        if (!user || user.role !== "organizer") {
          return { ok: false, error: "Only organizers can invite." };
        }
        const trimmed = email.trim().toLowerCase();
        if (!isGikiEmail(trimmed)) {
          return {
            ok: false,
            error: "Sub-organizer email must be a @giki.edu.pk address.",
          };
        }
        const ev = get().events.find((e) => e.id === eventId);
        if (!ev) return { ok: false, error: "Event not found." };
        if (ev.organizerId !== user.id) {
          return { ok: false, error: "You can only invite for your own events." };
        }
        if (
          (ev.subOrganizerEmails ?? [])
            .map((e) => e.toLowerCase())
            .includes(trimmed)
        ) {
          return { ok: false, error: "Already a sub-organizer for this event." };
        }
        const existing = get().users.find(
          (u) => u.email.toLowerCase() === trimmed
        );
        // Always update the event's sub-organizer list so scan check works either way
        set((s) => ({
          events: s.events.map((e) =>
            e.id === eventId
              ? {
                  ...e,
                  subOrganizerEmails: [
                    ...(e.subOrganizerEmails ?? []),
                    trimmed,
                  ],
                }
              : e
          ),
        }));
        // Also create an invitation record so the system can show "pending" until they sign up
        const invite: SubOrganizerInvite = {
          id: uid("inv"),
          eventId,
          email: trimmed,
          invitedBy: user.id,
          createdAt: new Date().toISOString(),
          status: existing ? "accepted" : "pending",
          acceptedAt: existing ? new Date().toISOString() : undefined,
          acceptedByUserId: existing?.id,
        };
        set((s) => ({ invitations: [...s.invitations, invite] }));

        if (existing) {
          // Notify the user
          const notif: Notification = {
            id: uid("n"),
            userId: existing.id,
            title: "📣 You're a sub-organizer",
            body: `${user.name} has given you scan access for "${ev.title}".`,
            tone: "info",
            icon: "📣",
            read: false,
            createdAt: new Date().toISOString(),
            link: `/organizer/scanner`,
          };
          set((s) => ({ notifications: [notif, ...s.notifications] }));
          get().pushToast({
            tone: "success",
            title: "Sub-organizer added",
            body: `${existing.name} can now scan tickets for this event.`,
          });
        } else {
          get().pushToast({
            tone: "info",
            title: "Invitation pending",
            body: `${trimmed} doesn't have an account yet — they'll get access automatically after sign-up.`,
          });
        }
        return { ok: true, existing: !!existing };
      },

      removeSubOrganizer: (eventId, email) => {
        const trimmed = email.toLowerCase();
        set((s) => ({
          events: s.events.map((e) =>
            e.id === eventId
              ? {
                  ...e,
                  subOrganizerEmails: (e.subOrganizerEmails ?? []).filter(
                    (x) => x.toLowerCase() !== trimmed
                  ),
                }
              : e
          ),
          invitations: s.invitations.filter(
            (i) => !(i.eventId === eventId && i.email.toLowerCase() === trimmed)
          ),
        }));
        get().pushToast({
          tone: "info",
          title: "Sub-organizer removed",
        });
      },

      // ---------- CHAT ----------
      sendChat: (eventId, toUserId, body, opts) => {
        const user = get().currentUser();
        if (!user) return null;
        if (!body.trim()) return null;
        const msg: ChatMessage = {
          id: uid("chat"),
          eventId,
          fromUserId: user.id,
          toUserId,
          body: body.trim(),
          read: false,
          createdAt: new Date().toISOString(),
          isRejectionNote: opts?.isRejectionNote,
        };
        set((s) => ({ chatMessages: [...s.chatMessages, msg] }));
        // notify recipient
        const ev = get().events.find((e) => e.id === eventId);
        const recipient = get().users.find((u) => u.id === toUserId);
        if (recipient) {
          const notif: Notification = {
            id: uid("n"),
            userId: recipient.id,
            title: `💬 New message: ${user.name}`,
            body: body.length > 80 ? body.slice(0, 80) + "…" : body,
            tone: "info",
            icon: "💬",
            read: false,
            createdAt: new Date().toISOString(),
            link:
              recipient.role === "admin"
                ? `/admin/approvals`
                : `/organizer/events/${eventId}`,
          };
          set((s) => ({ notifications: [notif, ...s.notifications] }));
        }
        return msg;
      },

      markChatRead: (eventId, fromUserId, toUserId) => {
        set((s) => ({
          chatMessages: s.chatMessages.map((m) =>
            m.eventId === eventId &&
            m.fromUserId === fromUserId &&
            m.toUserId === toUserId
              ? { ...m, read: true }
              : m
          ),
        }));
      },

      // ---------- NOTIFICATIONS ----------
      pushNotification: (n) => {
        const notif: Notification = {
          ...n,
          id: uid("n"),
          read: false,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ notifications: [notif, ...s.notifications] }));
      },
      markNotificationRead: (id) => {
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }));
      },
      markAllNotificationsRead: (userId) => {
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.userId === userId ? { ...n, read: true } : n
          ),
        }));
      },

      // ---------- TOASTS ----------
      pushToast: (t) => {
        const toast: ToastMsg = { ...t, id: uid("t") };
        set((s) => ({ toasts: [...s.toasts, toast] }));
        setTimeout(() => {
          set((s) => ({ toasts: s.toasts.filter((x) => x.id !== toast.id) }));
        }, 4000);
      },
      dismissToast: (id) => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
      },

      // ---------- PROFILE ----------
      updateProfile: (userId, patch) => {
        const u = get().users.find((x) => x.id === userId);
        if (!u) return { ok: false, error: "User not found." };
        // Validate email change if any
        if (patch.email && patch.email.toLowerCase() !== u.email.toLowerCase()) {
          const exists = get().users.find(
            (x) => x.email.toLowerCase() === patch.email!.toLowerCase()
          );
          if (exists) return { ok: false, error: "Email already in use." };
          if (u.role === "organizer" && !isGikiEmail(patch.email)) {
            return {
              ok: false,
              error: "Organizers must use a @giki.edu.pk email.",
            };
          }
        }
        if (patch.password && patch.password.length < 6) {
          return { ok: false, error: "Password must be 6+ characters." };
        }
        set((s) => ({
          users: s.users.map((x) => (x.id === userId ? { ...x, ...patch } : x)),
        }));
        get().pushToast({
          tone: "success",
          title: "Profile updated",
        });
        return { ok: true };
      },

      // ---------- SOCIETY + ORGANIZER APPROVAL ----------
      approveSociety: (id) => {
        const user = get().currentUser();
        if (!user || user.role !== "admin") return;
        const soc = get().societies.find((s) => s.id === id);
        if (!soc) return;
        set((s) => ({
          societies: s.societies.map((x) =>
            x.id === id
              ? {
                  ...x,
                  status: "approved",
                  approvedBy: user.id,
                  approvedAt: new Date().toISOString(),
                }
              : x
          ),
        }));
        // Approve ALL pending organizers tied to this society (multiple
        // organizers can belong to one society).
        const norm = soc.name.trim().toLowerCase();
        const affected = get().users.filter(
          (u) =>
            u.role === "organizer" &&
            (u.accountStatus === "pending" || u.accountStatus === undefined) &&
            (u.society ?? "").trim().toLowerCase() === norm
        );
        affected.forEach((aff) => {
          set((s) => ({
            users: s.users.map((u) =>
              u.id === aff.id
                ? {
                    ...u,
                    accountStatus: "approved",
                    approvedAt: new Date().toISOString(),
                  }
                : u
            ),
          }));
          const n: Notification = {
            id: uid("n"),
            userId: aff.id,
            title: "✅ Account approved",
            body: `Your society "${soc.name}" has been approved by the Dean. Full access unlocked.`,
            tone: "success",
            icon: "✅",
            read: false,
            link: "/organizer/dashboard",
            createdAt: new Date().toISOString(),
          };
          set((s) => ({ notifications: [n, ...s.notifications] }));
        });
        get().pushToast({
          tone: "success",
          title: "Society approved",
          body: `${affected.length} organizer(s) for "${soc.name}" unlocked.`,
        });
      },

      rejectSocietyApplication: (organizerUserId, reason) => {
        const user = get().currentUser();
        if (!user || user.role !== "admin") return;
        const org = get().users.find((u) => u.id === organizerUserId);
        if (!org) return;
        const socName = (org.society ?? "").trim();
        // mark society pending entry as rejected (delete it)
        set((s) => ({
          societies: s.societies.filter(
            (x) =>
              !(
                x.status === "pending" &&
                x.name.trim().toLowerCase() === socName.toLowerCase()
              )
          ),
        }));
        // reject the organizer
        set((s) => ({
          users: s.users.map((u) =>
            u.id === organizerUserId
              ? { ...u, accountStatus: "rejected", rejectionReason: reason }
              : u
          ),
        }));
        // open chat thread between admin and organizer (no event yet, use a synthetic id)
        const syntheticEventId = `account:${organizerUserId}`;
        const msg: ChatMessage = {
          id: uid("chat"),
          eventId: syntheticEventId,
          fromUserId: user.id,
          toUserId: organizerUserId,
          body: reason,
          read: false,
          createdAt: new Date().toISOString(),
          isRejectionNote: true,
        };
        set((s) => ({ chatMessages: [...s.chatMessages, msg] }));
        const notif: Notification = {
          id: uid("n"),
          userId: organizerUserId,
          title: "❌ Application rejected",
          body: `Your organizer account was declined — open chat to discuss with the Dean.`,
          tone: "danger",
          icon: "❌",
          read: false,
          link: "/organizer/dashboard",
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ notifications: [notif, ...s.notifications] }));
        get().pushToast({
          tone: "warn",
          title: "Organizer rejected",
          body: "They've been notified.",
        });
      },

      approveOrganizer: (userId) => {
        // Convenience wrapper — approves an organizer regardless of society state.
        const admin = get().currentUser();
        if (!admin || admin.role !== "admin") return;
        const u = get().users.find((x) => x.id === userId);
        if (!u) return;
        set((s) => ({
          users: s.users.map((x) =>
            x.id === userId
              ? { ...x, accountStatus: "approved", approvedAt: new Date().toISOString() }
              : x
          ),
        }));
        // Also approve the society if it was pending
        const socName = (u.society ?? "").trim().toLowerCase();
        if (socName) {
          set((s) => ({
            societies: s.societies.map((soc) =>
              soc.name.trim().toLowerCase() === socName && soc.status === "pending"
                ? {
                    ...soc,
                    status: "approved",
                    approvedBy: admin.id,
                    approvedAt: new Date().toISOString(),
                  }
                : soc
            ),
          }));
        }
        const n: Notification = {
          id: uid("n"),
          userId,
          title: "✅ Account approved",
          body: "Welcome aboard! You can now create events.",
          tone: "success",
          icon: "✅",
          read: false,
          link: "/organizer/dashboard",
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ notifications: [n, ...s.notifications] }));
        get().pushToast({
          tone: "success",
          title: "Organizer approved",
        });
      },

      rejectOrganizer: (userId, reason) => {
        get().rejectSocietyApplication(userId, reason);
      },

      // ---------- REVIEWS ----------
      submitReview: (eventId, rating, body) => {
        const user = get().currentUser();
        if (!user) return { ok: false, error: "Please log in." };
        if (rating < 1 || rating > 5) return { ok: false, error: "Rating must be 1-5." };
        if (!body.trim()) return { ok: false, error: "Please write a quick comment." };
        const event = get().events.find((e) => e.id === eventId);
        if (!event) return { ok: false, error: "Event not found." };
        // must have a scanned ticket
        const ticket = get().tickets.find(
          (t) => t.eventId === eventId && t.userId === user.id && t.status === "scanned"
        );
        if (!ticket) {
          return {
            ok: false,
            error: "You can only review events you actually attended.",
          };
        }
        const existing = get().reviews.find(
          (r) => r.eventId === eventId && r.userId === user.id
        );
        if (existing) return { ok: false, error: "You've already reviewed this event." };
        const review: Review = {
          id: uid("rev"),
          eventId,
          userId: user.id,
          rating,
          body: body.trim(),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ reviews: [review, ...s.reviews] }));
        // notify organizer
        const orgNotif: Notification = {
          id: uid("n"),
          userId: event.organizerId,
          title: `⭐ New review (${rating}/5)`,
          body: `${user.name} reviewed "${event.title}" — "${body.slice(0, 50)}${body.length > 50 ? "…" : ""}"`,
          tone: "info",
          icon: "⭐",
          read: false,
          link: `/organizer/events/${eventId}`,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ notifications: [orgNotif, ...s.notifications] }));
        get().pushToast({
          tone: "success",
          title: "Thanks for the review! ⭐",
        });
        return { ok: true, review };
      },

      // ---------- RESUBMIT EVENT ----------
      resubmitEvent: (id) => {
        const user = get().currentUser();
        if (!user || user.role !== "organizer") {
          return { ok: false, error: "Only organizers can resubmit." };
        }
        const ev = get().events.find((e) => e.id === id);
        if (!ev) return { ok: false, error: "Event not found." };
        if (ev.organizerId !== user.id) {
          return { ok: false, error: "Not your event." };
        }
        if (ev.status !== "rejected") {
          return {
            ok: false,
            error: "Only rejected events can be resubmitted (use Edit otherwise).",
          };
        }
        set((s) => ({
          events: s.events.map((e) =>
            e.id === id
              ? { ...e, status: "pending", rejectionReason: undefined }
              : e
          ),
        }));
        const admins = get().users.filter((x) => x.role === "admin");
        const notifs: Notification[] = admins.map((a) => ({
          id: uid("n"),
          userId: a.id,
          title: "🔁 Event resubmitted",
          body: `"${ev.title}" has been resubmitted by ${user.name} for review.`,
          tone: "warn",
          icon: "🔁",
          read: false,
          link: "/admin/approvals",
          createdAt: new Date().toISOString(),
        }));
        set((s) => ({ notifications: [...notifs, ...s.notifications] }));
        get().pushToast({
          tone: "success",
          title: "Event resubmitted",
          body: "The Dean has been notified.",
        });
        return { ok: true };
      },

      resetAll: () => {
        set({
          users: seedUsers,
          events: seedEvents,
          tickets: seedTickets,
          payments: [],
          notifications: seedNotifications,
          invitations: seedInvitations,
          chatMessages: seedChatMessages,
          societies: seedSocieties,
          reviews: seedReviews,
          toasts: [],
          currentUserId: null,
        });
      },
    }),
    {
      name: "giki-event-hub",
      // Bump this whenever seed/types change so old localStorage gets discarded
      // and the new seed loads automatically (instead of keeping stale users).
      version: 4,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        users: state.users,
        events: state.events,
        tickets: state.tickets,
        payments: state.payments,
        notifications: state.notifications,
        invitations: state.invitations,
        chatMessages: state.chatMessages,
        societies: state.societies,
        reviews: state.reviews,
      }),
      migrate: (_persistedState: any, _version: number) => {
        return {
          users: seedUsers,
          events: seedEvents,
          tickets: seedTickets,
          payments: [],
          notifications: seedNotifications,
          invitations: seedInvitations,
          chatMessages: seedChatMessages,
          societies: seedSocieties,
          reviews: seedReviews,
        } as any;
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.hydrated = true;
          state.currentUserId = null;
          state.toasts = [];
        }
      },
    }
  )
);

// helper hook to compute booked seat count
export function useEventStats(eventId: string) {
  return useStore((s) => {
    const sold = s.tickets.filter(
      (t) =>
        t.eventId === eventId &&
        (t.status === "confirmed" || t.status === "scanned")
    ).length;
    const scanned = s.tickets.filter(
      (t) => t.eventId === eventId && t.status === "scanned"
    ).length;
    const revenue = s.tickets
      .filter(
        (t) =>
          t.eventId === eventId &&
          (t.status === "confirmed" || t.status === "scanned")
      )
      .reduce((sum, t) => sum + t.amount, 0);
    return { sold, scanned, revenue };
  });
}
