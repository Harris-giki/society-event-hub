export type Role = "student" | "organizer" | "admin";

/**
 * accountStatus is meaningful for organizers:
 *   - "approved" → can use all organizer features (default for students/admin too)
 *   - "pending"  → waiting on Dean to approve their society / account
 *   - "rejected" → Dean declined; they see a rejection screen and can resubmit or chat
 */
export type AccountStatus = "approved" | "pending" | "rejected";

export interface User {
  id: string;
  name: string;
  email: string;
  regNumber?: string;
  password: string; // demo only — never do this in real apps
  role: Role;
  society?: string; // for organizers
  program?: string;
  avatarSeed: string;
  phone?: string; // every user has a phone for contact

  // organizer account approval flow
  accountStatus?: AccountStatus; // defaults to "approved" for backwards compat
  rejectionReason?: string;      // populated if accountStatus === "rejected"
  appliedAt?: string;
  approvedAt?: string;

  // --- non-GIKI student fields ---
  isGikian?: boolean;          // derived from email but cached for clarity
  cnic?: string;               // 13-digit CNIC, format 12345-1234567-1
  emergencyContact?: string;   // phone of emergency contact
  emergencyContactName?: string;
  universityName?: string;     // for non-GIKI students
  universityIdCardUrl?: string; // base64 data URL of uploaded ID card
}

export type EventStatus =
  | "draft"
  | "pending"      // submitted, awaiting admin approval
  | "approved"     // visible to students
  | "rejected"
  | "completed"
  | "cancelled";

export type EventCategory =
  | "Workshop"
  | "Seminar"
  | "Competition"
  | "Cultural"
  | "Sports"
  | "Tech";

export interface SocietyEvent {
  id: string;
  title: string;
  description: string;
  longDescription?: string;
  organizerId: string;
  society: string;
  category: EventCategory;
  date: string;        // ISO
  endDate?: string;
  venue: string;
  venueIsCustom?: boolean;
  capacity: number;
  ticketPrice: number; // PKR — capped at 15000
  coverHue: string;    // for procedural cover gradient
  coverEmoji: string;
  status: EventStatus;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  budget: number;             // required — even if 0
  facultyAdvisor: string;     // required, alphabet only
  resourcesRequested?: string[];
  createdAt: string;

  // --- new fields ---
  posterUrl?: string;         // base64 data URL of event poster
  pocName?: string;           // point-of-contact name shown to students
  pocPhone: string;           // POC phone shown to students
  allowNonGikian?: boolean;   // organizer toggle to allow outsiders
  submissionNote?: string;    // note from organizer to ADSA at submission

  // sub-organizer access: emails authorized to scan tickets
  subOrganizerEmails?: string[]; // resolved-or-pending GIKI emails
}

export interface Ticket {
  id: string;
  eventId: string;
  userId: string;
  bookedAt: string;
  status: "confirmed" | "scanned" | "cancelled" | "refunded";
  paymentMethod: "online" | "cash";
  amount: number;
  scannedAt?: string;
  scannedBy?: string;
  qrPayload: string;
  ticketCode: string; // 8-char alphanumeric shown on ticket for manual entry
  seatLabel?: string;
  termsAccepted?: boolean; // required for non-GIKIANs

  // refund progress (multi-step)
  refundProgress?: {
    stage: "initiated" | "processing" | "completed";
    initiatedAt?: string;
    processingAt?: string;
    completedAt?: string;
  };
}

export interface Notification {
  id: string;
  userId: string;       // recipient
  scope?: Role;         // optional broad recipient
  title: string;
  body: string;
  link?: string;
  icon?: string;
  read: boolean;
  createdAt: string;
  tone?: "info" | "success" | "warn" | "danger";
}

export interface Payment {
  id: string;
  ticketId: string;
  userId: string;
  amount: number;
  method: "online" | "cash";
  status: "succeeded" | "failed" | "pending" | "refunded";
  cardLast4?: string;
  createdAt: string;
  failureReason?: string;
}

export interface ToastMsg {
  id: string;
  title: string;
  body?: string;
  tone: "info" | "success" | "warn" | "danger";
}

// --- new: sub-organizer invitation (when invitee doesn't have an account) ---
export interface SubOrganizerInvite {
  id: string;
  eventId: string;
  email: string;        // must be @giki.edu.pk
  invitedBy: string;    // user id of organizer
  createdAt: string;
  status: "pending" | "accepted" | "expired";
  acceptedAt?: string;
  acceptedByUserId?: string;
}

// --- new: chat between organizer and admin tied to a specific event ---
export interface ChatMessage {
  id: string;
  eventId: string;        // chat is per-event
  fromUserId: string;
  toUserId: string;       // counterpart (for unread indicators)
  body: string;
  read: boolean;
  createdAt: string;
  // Flag this message as the original rejection note so we can render it specially
  isRejectionNote?: boolean;
}

// --- new: registry of approved societies ---
export interface Society {
  id: string;
  name: string;
  status: "approved" | "pending";
  appliedBy?: string;   // user ID of the organizer who first registered it
  approvedBy?: string;  // user ID of the Dean who approved
  approvedAt?: string;
  createdAt: string;
  description?: string;
}

// --- new: review of an event by an attendee ---
export interface Review {
  id: string;
  eventId: string;
  userId: string;
  rating: number;   // 1-5
  body: string;
  createdAt: string;
}

// --- new: list of canonical GIKI venues ---
export interface VenueOption {
  name: string;
  capacity: number;
}
export const GIKI_VENUES: VenueOption[] = [
  { name: "Main Auditorium", capacity: 600 },
  { name: "CS Auditorium", capacity: 150 },
  { name: "ACB MLH2", capacity: 150 },
  { name: "Seminar Hall, Incubation Center", capacity: 100 },
  { name: "Faculty Lounge", capacity: 100 },
  { name: "Faculty Club", capacity: 600 },
];

export const MAX_TICKET_PRICE = 15000;

// utility helpers
export function isGikiEmail(email: string) {
  return /^[^\s@]+@giki\.edu\.pk$/i.test(email.trim());
}
export function isAlphaOnly(s: string) {
  return /^[a-zA-Z\s.'-]*$/.test(s);
}
export function isValidCnic(s: string) {
  return /^\d{5}-\d{7}-\d$/.test(s);
}
export function isValidPkPhone(s: string) {
  return /^(\+92|0)?[\s-]?3\d{2}[\s-]?\d{7}$/.test(s.replace(/\s/g, ""));
}
