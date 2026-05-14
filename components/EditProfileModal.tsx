"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { Modal } from "./Modal";
import { User, isAlphaOnly, isValidPkPhone } from "@/lib/types";
import { AlertCircle, Save } from "lucide-react";

export function EditProfileModal({
  open,
  onClose,
  user,
}: {
  open: boolean;
  onClose: () => void;
  user: User;
}) {
  const update = useStore((s) => s.updateProfile);

  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [program, setProgram] = useState(user.program ?? "");
  const [society, setSociety] = useState(user.society ?? "");
  const [emergencyName, setEmergencyName] = useState(user.emergencyContactName ?? "");
  const [emergencyPhone, setEmergencyPhone] = useState(user.emergencyContact ?? "");
  const [newPassword, setNewPassword] = useState("");
  const [err, setErr] = useState("");
  const [errs, setErrs] = useState<Record<string, string>>({});

  function save() {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Name is required.";
    if (!isAlphaOnly(name)) e.name = "Letters only.";
    if (phone && !isValidPkPhone(phone)) e.phone = "Use +92 3XX XXXXXXX format.";
    if (emergencyPhone && !isValidPkPhone(emergencyPhone)) e.emerg = "Invalid phone.";
    if (newPassword && newPassword.length < 6) e.password = "Must be 6+ characters.";
    setErrs(e); setErr("");
    if (Object.keys(e).length) return;

    const patch: Partial<User> = {
      name: name.trim(),
      phone: phone || undefined,
    };
    if (user.role === "student") {
      patch.program = program || undefined;
      patch.emergencyContact = emergencyPhone || undefined;
      patch.emergencyContactName = emergencyName || undefined;
    }
    if (user.role === "organizer") patch.society = society || undefined;
    if (newPassword) patch.password = newPassword;

    const res = update(user.id, patch);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit profile">
      <div className="space-y-3">
        <div className="field">
          <label className="field-label">Full name</label>
          <input
            className={`input ${errs.name ? "input-error" : ""}`}
            value={name}
            onChange={(e) => { if (isAlphaOnly(e.target.value)) setName(e.target.value); }}
          />
          {errs.name && (<div className="field-error"><AlertCircle size={12} />{errs.name}</div>)}
        </div>

        <div className="field">
          <label className="field-label">Phone number</label>
          <input
            className={`input ${errs.phone ? "input-error" : ""}`}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+92 3XX XXXXXXX"
            inputMode="tel"
          />
          {errs.phone && (<div className="field-error"><AlertCircle size={12} />{errs.phone}</div>)}
        </div>

        {user.role === "student" && (
          <>
            <div className="field">
              <label className="field-label">Program / Department</label>
              <input
                className="input"
                value={program}
                onChange={(e) => setProgram(e.target.value)}
                placeholder="e.g., BS Computer Science"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="field">
                <label className="field-label">Emergency contact name</label>
                <input
                  className="input"
                  value={emergencyName}
                  onChange={(e) => { if (isAlphaOnly(e.target.value)) setEmergencyName(e.target.value); }}
                />
              </div>
              <div className="field">
                <label className="field-label">Emergency contact phone</label>
                <input
                  className={`input ${errs.emerg ? "input-error" : ""}`}
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  placeholder="+92 3XX XXXXXXX"
                  inputMode="tel"
                />
                {errs.emerg && (<div className="field-error"><AlertCircle size={12} />{errs.emerg}</div>)}
              </div>
            </div>
          </>
        )}

        {user.role === "organizer" && (
          <div className="field">
            <label className="field-label">Society</label>
            <input
              className="input"
              value={society}
              onChange={(e) => setSociety(e.target.value)}
            />
          </div>
        )}

        <div className="field">
          <label className="field-label">New password (optional)</label>
          <input
            type="password"
            className={`input ${errs.password ? "input-error" : ""}`}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Leave blank to keep current"
          />
          {errs.password && (<div className="field-error"><AlertCircle size={12} />{errs.password}</div>)}
        </div>

        {err && (
          <div className="rounded-xl p-3 bg-rose-500/10 border border-rose-400/30 text-xs text-rose-200 flex items-start gap-2">
            <AlertCircle size={14} className="text-rose-400 shrink-0 mt-0.5" /> {err}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button onClick={save} className="btn btn-primary"><Save size={15} />Save changes</button>
        </div>
      </div>
    </Modal>
  );
}
