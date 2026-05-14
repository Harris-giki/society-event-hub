"use client";
import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  AlertCircle,
  UserPlus,
  Sparkles,
  ArrowLeft,
  Copy,
  Check,
  GraduationCap,
  Megaphone,
  ShieldCheck,
  Info,
} from "lucide-react";
import { Role, isGikiEmail, isValidCnic, isValidPkPhone, isAlphaOnly } from "@/lib/types";

const roleTabs: { role: Role; label: string; icon: any; hint: string }[] = [
  { role: "student", label: "Student", icon: GraduationCap, hint: "Browse & book events" },
  { role: "organizer", label: "Organizer", icon: Megaphone, hint: "Create & manage events (GIKI email only)" },
  { role: "admin", label: "Dean / Admin", icon: ShieldCheck, hint: "Approve & oversee" },
];

const demoAccounts: { role: Role; name: string; email: string; password: string; sub: string }[] = [
  { role: "student", name: "Mumtaz Ali", email: "mumtaz@giki.edu.pk", password: "demo123", sub: "Primary persona — has tickets" },
  { role: "student", name: "Muhammad Haris", email: "haris@giki.edu.pk", password: "demo123", sub: "Fresh GIKI student account" },
  { role: "student", name: "Zara Khan (Non-GIKI)", email: "zara.khan@nust.edu.pk", password: "demo123", sub: "External student (NUST) — non-GIKI flow demo" },
  { role: "organizer", name: "Ammar Khan", email: "ammar@giki.edu.pk", password: "lds2026", sub: "President — LDS" },
  { role: "organizer", name: "Hamza Faraz", email: "hamza@giki.edu.pk", password: "mlsa2026", sub: "President — MLSA" },
  { role: "admin", name: "Sabir Ahmed (Dean of Student Affairs)", email: "dean.sa@giki.edu.pk", password: "dean2026", sub: "Reviews & approves all society events" },
];

export default function LoginPage() {
  const [tab, setTab] = useState<Role>("student");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState("");
  const [emailErr, setEmailErr] = useState("");
  const [pwErr, setPwErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState("");

  // register state
  const [regName, setRegName] = useState("");
  const [regRoll, setRegRoll] = useState("");
  const [regSociety, setRegSociety] = useState("");
  const [regProgram, setRegProgram] = useState("");
  const [regPhone, setRegPhone] = useState("");
  // non-GIKIAN extras
  const [regCnic, setRegCnic] = useState("");
  const [regEmergencyName, setRegEmergencyName] = useState("");
  const [regEmergency, setRegEmergency] = useState("");
  const [regUniName, setRegUniName] = useState("");
  const [regIdCardName, setRegIdCardName] = useState("");
  const [regIdCardData, setRegIdCardData] = useState("");

  const login = useStore((s) => s.login);
  const register = useStore((s) => s.register);
  const approvedSocieties = useStore((s) =>
    s.societies.filter((soc) => soc.status === "approved")
  );
  const router = useRouter();
  const user = useStore((s) => s.currentUser());
  const hydrated = useStore((s) => s.hydrated);

  useEffect(() => {
    if (hydrated && user) router.replace(`/${user.role}/dashboard`);
  }, [hydrated, user, router]);

  // Detect non-GIKI email in student-register mode
  const looksLikeNonGikian =
    tab === "student" &&
    mode === "register" &&
    email.length > 3 &&
    email.includes("@") &&
    !isGikiEmail(email);

  function validateLogin() {
    let ok = true;
    setEmailErr(""); setPwErr("");
    if (!email.trim()) {
      setEmailErr("Email is required.");
      ok = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailErr("Please enter a valid email address.");
      ok = false;
    }
    if (!password) {
      setPwErr("Password is required.");
      ok = false;
    }
    return ok;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (mode === "login") {
      if (!validateLogin()) return;
      setLoading(true);
      setTimeout(() => {
        const res = login(email, password, tab);
        setLoading(false);
        if (!res.ok) {
          setErr(res.error);
        } else {
          router.replace(`/${res.user.role}/dashboard`);
        }
      }, 400);
    } else {
      // register
      let ok = true; setEmailErr(""); setPwErr(""); setErr("");
      if (!regName.trim()) { setErr("Full name is required."); return; }
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setEmailErr("Please enter a valid email address."); ok = false;
      }
      if (password.length < 6) {
        setPwErr("Password must be at least 6 characters."); ok = false;
      }
      if (tab === "organizer" && !isGikiEmail(email)) {
        setEmailErr("Organizers must use a @giki.edu.pk email.");
        ok = false;
      }
      if (tab === "student" && !isGikiEmail(email)) {
        if (!regCnic || !isValidCnic(regCnic)) { setErr("Valid CNIC required (format: 12345-1234567-1)."); ok = false; }
        if (!regPhone || !isValidPkPhone(regPhone)) { setErr("Valid Pakistani phone number required."); ok = false; }
        if (!regEmergency || !isValidPkPhone(regEmergency)) { setErr("Valid emergency contact phone required."); ok = false; }
        if (!regEmergencyName.trim()) { setErr("Emergency contact name required."); ok = false; }
        if (!regUniName.trim()) { setErr("University name required."); ok = false; }
        if (!regIdCardData) { setErr("Please upload a photo of your university ID card."); ok = false; }
      }
      if (!ok) return;
      setLoading(true);
      setTimeout(() => {
        const isNonGikiStudent = tab === "student" && !isGikiEmail(email);
        const res = register({
          name: regName.trim(),
          email: email.trim(),
          password,
          role: tab,
          regNumber: regRoll || undefined,
          program: regProgram || undefined,
          society: tab === "organizer" ? regSociety || "Independent Society" : undefined,
          phone: regPhone || undefined,
          cnic: isNonGikiStudent ? regCnic : undefined,
          emergencyContact: isNonGikiStudent ? regEmergency : undefined,
          emergencyContactName: isNonGikiStudent ? regEmergencyName : undefined,
          universityName: isNonGikiStudent ? regUniName : undefined,
          universityIdCardUrl: isNonGikiStudent ? regIdCardData : undefined,
        });
        setLoading(false);
        if (!res.ok) setErr(res.error);
        else router.replace(`/${res.user.role}/dashboard`);
      }, 400);
    }
  }

  // Outer is a DIV (not a button) to avoid nested-button bugs that broke the autofill.
  function quickFill(acc: typeof demoAccounts[0]) {
    setTab(acc.role);
    setEmail(acc.email);
    setPassword(acc.password);
    setMode("login");
    setErr(""); setEmailErr(""); setPwErr("");
  }

  function copy(text: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopied(text);
    setTimeout(() => setCopied(""), 1200);
  }

  function onIdCardChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) {
      setErr("ID card must be under 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setRegIdCardData(reader.result as string);
      setRegIdCardName(f.name);
    };
    reader.readAsDataURL(f);
  }

  const visibleAccounts = demoAccounts.filter((a) => a.role === tab);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-5xl grid lg:grid-cols-[1fr_1.15fr] gap-6 lg:gap-10 items-center">
        {/* left — branding & demo accounts */}
        <div className="space-y-5">
          <Link href="/" className="btn btn-ghost text-xs w-fit -ml-3">
            <ArrowLeft size={14} /> Back home
          </Link>
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 grid place-items-center font-bold text-ink-900 text-xl">
                G
              </div>
              <div className="font-display font-semibold text-lg">GIKI Event Hub</div>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2">
              Welcome <span className="text-gradient">back</span>.
            </h1>
            <p className="text-white/65 text-sm max-w-md">
              Sign in to discover, book, or manage society events at GIKI. Pick the right tab
              for your role.
            </p>
          </div>

          <div className="glass rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-fuchsia-300" />
              <div className="font-semibold text-sm">Demo accounts</div>
              <span className="chip text-[10px] ml-auto">click to autofill</span>
            </div>
            <div className="text-[11px] text-white/55 mb-3">
              Pre-seeded for the demo. Try a wrong password to see error handling.
            </div>
            <div className="flex flex-col gap-1.5">
              {visibleAccounts.map((acc) => {
                const accKey = `${acc.email} / ${acc.password}`;
                return (
                  <div
                    key={acc.email}
                    role="button"
                    tabIndex={0}
                    onClick={() => quickFill(acc)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        quickFill(acc);
                      }
                    }}
                    className="w-full text-left rounded-xl p-2.5 hover:bg-white/[0.08] transition flex items-center gap-3 border border-white/8 cursor-pointer focus:outline-none focus:ring-2 focus:ring-fuchsia-400/40"
                  >
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500/40 to-fuchsia-500/40 grid place-items-center text-xs font-bold shrink-0">
                      {acc.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{acc.name}</div>
                      <div className="text-[11px] text-white/55 truncate">{acc.sub}</div>
                      <div className="text-[10px] font-mono text-white/45 mt-0.5 truncate">
                        {acc.email}  •  pw: {acc.password}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        copy(accKey);
                      }}
                      className="p-1.5 rounded-md hover:bg-white/10 shrink-0"
                      aria-label="Copy credentials"
                    >
                      {copied === accKey ? (
                        <Check size={14} className="text-emerald-400" />
                      ) : (
                        <Copy size={14} className="text-white/50" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-[11px] text-white/45 leading-relaxed">
            Tip: <span className="font-mono text-white/70">4000 0000 0000 0002</span> as a card
            number simulates a declined payment so you can demonstrate failure handling.
          </div>
        </div>

        {/* right — form */}
        <div className="gradient-border-card p-6 sm:p-8">
          <div className="flex gap-1.5 p-1 bg-white/5 rounded-xl mb-5 border border-white/8">
            {roleTabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.role;
              return (
                <button
                  key={t.role}
                  type="button"
                  onClick={() => { setTab(t.role); setErr(""); }}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition ${
                    active
                      ? "bg-gradient-to-br from-violet-500/80 to-fuchsia-500/80 text-white shadow-lg"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  <Icon size={14} />
                  {t.label}
                </button>
              );
            })}
          </div>
          <div className="text-xs text-white/55 mb-5">
            {roleTabs.find((t) => t.role === tab)?.hint}
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "register" && (
              <>
                <div className="field">
                  <label className="field-label">Full name</label>
                  <input
                    className="input"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="field">
                    <label className="field-label">
                      {tab === "admin" ? "Designation" : "Reg / Roll #"}
                    </label>
                    <input
                      className="input"
                      value={regRoll}
                      onChange={(e) => setRegRoll(e.target.value)}
                      placeholder={tab === "admin" ? "Enter designation" : "Enter reg number"}
                    />
                  </div>
                  <div className="field">
                    <label className="field-label">
                      {tab === "organizer" ? "Society" : "Program / Department"}
                    </label>
                    {tab === "organizer" ? (
                      <>
                        <input
                          className="input"
                          value={regSociety}
                          onChange={(e) => setRegSociety(e.target.value)}
                          list="society-options"
                          placeholder="Pick or type new"
                        />
                        <datalist id="society-options">
                          {approvedSocieties.map((s) => (
                            <option key={s.id} value={s.name} />
                          ))}
                        </datalist>
                      </>
                    ) : (
                      <input
                        className="input"
                        value={regProgram}
                        onChange={(e) => setRegProgram(e.target.value)}
                        placeholder="e.g., BSCS"
                      />
                    )}
                  </div>
                </div>
                {tab === "organizer" && (
                  <div className="rounded-xl p-3 bg-violet-500/8 border border-violet-400/25 text-xs text-violet-100 flex items-start gap-2">
                    <Info size={14} className="shrink-0 mt-0.5 text-violet-300" />
                    <div>
                      Pick an existing approved society to be auto-activated.
                      Registering a <span className="text-white font-medium">new</span>{" "}
                      society requires Dean approval — you'll see a waiting screen until
                      they verify your application.
                    </div>
                  </div>
                )}
                <div className="field">
                  <label className="field-label">Phone number</label>
                  <input
                    className="input"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="Enter phone (+92 3XX XXXXXXX)"
                    inputMode="tel"
                  />
                  <div className="field-hint">Required for contact and emergencies.</div>
                </div>
              </>
            )}

            <div className="field">
              <label className="field-label">Email address</label>
              <input
                type="email"
                className={`input ${emailErr ? "input-error" : ""}`}
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailErr(""); }}
                placeholder={tab === "organizer" ? "Enter your @giki.edu.pk email" : "Enter email"}
                autoComplete="email"
              />
              {emailErr && (
                <div className="field-error">
                  <AlertCircle size={12} /> {emailErr}
                </div>
              )}
              {tab === "organizer" && mode === "register" && (
                <div className="field-hint flex items-center gap-1">
                  <Info size={11} /> Organizer accounts require a GIKI institutional email.
                </div>
              )}
            </div>

            <div className="field">
              <div className="flex items-center justify-between">
                <label className="field-label">Password</label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() =>
                      setErr(
                        "Password recovery isn't part of this demo. Use the demo credentials on the left."
                      )
                    }
                    className="text-[11px] text-fuchsia-300 hover:text-fuchsia-200"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  className={`input pr-10 ${pwErr ? "input-error" : ""}`}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setPwErr(""); }}
                  placeholder="Enter password"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-white/50 hover:bg-white/10"
                  aria-label="Toggle visibility"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {pwErr && (
                <div className="field-error">
                  <AlertCircle size={12} /> {pwErr}
                </div>
              )}
            </div>

            {/* Non-GIKIAN extras */}
            {looksLikeNonGikian && (
              <div className="rounded-xl p-4 bg-amber-500/8 border border-amber-400/25 space-y-3 animate-slideUp">
                <div className="text-xs text-amber-200 flex items-start gap-2">
                  <Info size={14} className="shrink-0 mt-0.5" />
                  <span>
                    You're signing up with a non-GIKI email. We need a few extra details for
                    your safety on campus. You'll only be able to register for events the
                    organizer has opened to outsiders.
                  </span>
                </div>
                <div className="field">
                  <label className="field-label">CNIC *</label>
                  <input
                    className="input font-mono"
                    value={regCnic}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 13);
                      let formatted = digits;
                      if (digits.length > 5) formatted = digits.slice(0, 5) + "-" + digits.slice(5);
                      if (digits.length > 12) formatted = digits.slice(0, 5) + "-" + digits.slice(5, 12) + "-" + digits.slice(12);
                      setRegCnic(formatted);
                    }}
                    placeholder="12345-1234567-1"
                  />
                </div>
                <div className="field">
                  <label className="field-label">University name *</label>
                  <input
                    className="input"
                    value={regUniName}
                    onChange={(e) => setRegUniName(e.target.value)}
                    placeholder="e.g., NUST Islamabad"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="field">
                    <label className="field-label">Emergency contact name *</label>
                    <input
                      className="input"
                      value={regEmergencyName}
                      onChange={(e) => {
                        if (isAlphaOnly(e.target.value)) setRegEmergencyName(e.target.value);
                      }}
                      placeholder="Alphabets only"
                    />
                  </div>
                  <div className="field">
                    <label className="field-label">Emergency contact phone *</label>
                    <input
                      className="input"
                      value={regEmergency}
                      onChange={(e) => setRegEmergency(e.target.value)}
                      placeholder="+92 3XX XXXXXXX"
                      inputMode="tel"
                    />
                  </div>
                </div>
                <div className="field">
                  <label className="field-label">University ID card (photo) *</label>
                  <label className="rounded-xl p-4 border border-dashed border-white/15 bg-white/[0.03] text-center cursor-pointer block hover:bg-white/[0.06] transition">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={onIdCardChange}
                      className="sr-only"
                    />
                    {regIdCardData ? (
                      <div className="flex items-center justify-center gap-3">
                        <img src={regIdCardData} alt="ID preview" className="w-14 h-14 object-cover rounded-lg" />
                        <div className="text-xs text-white/75 truncate">{regIdCardName}</div>
                      </div>
                    ) : (
                      <div className="text-xs text-white/55">Tap to upload (max 2 MB)</div>
                    )}
                  </label>
                </div>
              </div>
            )}

            {err && (
              <div className="rounded-xl p-3 bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 animate-slideUp">
                <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
                <div className="text-xs text-rose-200">{err}</div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Signing in…
                </>
              ) : mode === "login" ? (
                <>Sign in as {tab === "admin" ? "Dean / Admin" : tab}</>
              ) : (
                <>
                  <UserPlus size={15} /> Create {tab === "admin" ? "admin" : tab} account
                </>
              )}
            </button>

            <div className="text-center text-xs text-white/55 pt-1">
              {mode === "login" ? (
                <>
                  New here?{" "}
                  <button
                    type="button"
                    onClick={() => { setMode("register"); setErr(""); }}
                    className="text-fuchsia-300 hover:text-fuchsia-200 font-medium"
                  >
                    Create an account
                  </button>
                </>
              ) : (
                <>
                  Already registered?{" "}
                  <button
                    type="button"
                    onClick={() => { setMode("login"); setErr(""); }}
                    className="text-fuchsia-300 hover:text-fuchsia-200 font-medium"
                  >
                    Sign in instead
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
