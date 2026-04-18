"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type StaffRole = "Dentist" | "Admin" | "Nurse";

type AuthedStaff = {
  id: string;
  name: string;
  role: StaffRole;
  email: string;
  avatar: string;
};

type Patient = {
  id: string;
  name: string;
  dob: string; // YYYY-MM-DD
  phone: string;
  email?: string;
  address?: string;
  job?: string;
  blood?: string;
  allergies: string;
  medical?: string;
  smoker?: string;
  alcohol?: string;
  gender?: string;
  status: "active" | "inactive";
  balance: number;
  lastVisit?: string;
};

type ClinicalNote = {
  id: string;
  date: string;
  dentist: string;
  procedure: string;
  teeth?: string;
  description?: string;
  medications?: string;
  followUp?: string;
};

type ClinicalRecord = {
  odontogram: Record<string, string[]>;
  complaint: string;
  bp: string;
  pulse: string;
  temp: string;
  resp: string;
  extraOral: string;
  intraOral: string;
  occlusion: string;
  notes: ClinicalNote[];
  photos?: string[]; // base64 data URLs
};

type Appointment = {
  id: string;
  pid: string;
  pname: string;
  date: string; // YYYY-MM-DD
  time: string;
  type: string;
  dentist: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  notes?: string;
};

type Invoice = {
  id: string;
  pid: string;
  pname: string;
  date: string;
  total: number;
  paid: number;
  status: "unpaid" | "partial" | "paid";
};

type Task = {
  id: string;
  title: string;
  priority: "high" | "medium" | "low";
  due: string;
  done: boolean;
  who: string;
};

type Message = {
  id: string;
  patientId: string;
  patient: string;
  type: "Reminder" | "Follow-up" | "Payment" | "General";
  content: string;
  date: string;
  sender: string;
};

type Bootstrap = {
  user: AuthedStaff;
  staff: Array<{ id: string; name: string; role: StaffRole; email: string; avatar: string }>;
  patients: Patient[];
  clinical: Record<string, ClinicalRecord>;
  appts: Appointment[];
  invoices: Invoice[];
  tasks: Task[];
  messages: Message[];
};

const DEMO = [
  { email: "doctor@yinlade.ng", password: "doctor123", name: "Dr Adeyinka Lawal", role: "Dentist", avatar: "AL" },
  { email: "admin@yinlade.ng", password: "admin123", name: "Kemi Adebayo", role: "Admin", avatar: "KA" },
  { email: "nurse@yinlade.ng", password: "nurse123", name: "Nurse Bola", role: "Nurse", avatar: "NB" },
];

const G = "#1a6b4a", GL = "#e6f4ee", GM = "#3d9e72";
const BL = "#1056a0", BLL = "#e8f1fb";
const AM = "#b45309", AML = "#fef6e4";
const RD = "#c0392b", RDL = "#fdecea";
const PU = "#6d28d9", PUL = "#ede9fe";
const TX = "#0e1f30", TM = "#4a6277", TL = "#8fa3b3";
const SU = "#ffffff", SA = "#f8fafc", BG = "#f4f7f9", BR = "#e2e9f0";
const SH = "0 1px 4px rgba(14,31,48,0.07)";
const SHM = "0 4px 18px rgba(14,31,48,0.10)";
const SHL = "0 12px 48px rgba(14,31,48,0.15)";

function MON(d: string) { return new Date(d+"T12:00").toLocaleDateString("en-NG",{month:"short"}); }

function Ico({ n, s = 18 }: { n: string; s?: number }) {
  const w: any = { width: s, height: s, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" };
  const icons: Record<string, React.ReactElement> = {
    dash:   <svg {...w}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>,
    pts:    <svg {...w}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    cal:    <svg {...w}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    bill:   <svg {...w}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    msg:    <svg {...w}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    task:   <svg {...w}><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
    tooth:  <svg {...w}><path d="M12 2C8.5 2 5.5 4.5 5.5 8.5c0 2.5.8 4.5 2 6L9 22h6l1.5-7.5c1.2-1.5 2-3.5 2-6C18.5 4.5 15.5 2 12 2z"/></svg>,
    plus:   <svg {...w} strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    search: <svg {...w}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    x:      <svg {...w} strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    edit:   <svg {...w}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    del:    <svg {...w}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
    chk:    <svg {...w} strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>,
    send:   <svg {...w}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
    phone:  <svg {...w}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.38 2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.78a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
    logout: <svg {...w}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    eye:    <svg {...w}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
    eyeoff: <svg {...w}><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
    lock:   <svg {...w}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    mail:   <svg {...w}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
    menu:   <svg {...w}><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
    chev:   <svg {...w}><polyline points="9 18 15 12 9 6"/></svg>,
    bar:    <svg {...w}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    back:   <svg {...w}><polyline points="15 18 9 12 15 6"/></svg>,
    file:   <svg {...w}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    pulse:  <svg {...w}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    grid:   <svg {...w}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
    save:   <svg {...w}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
    notes:  <svg {...w}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
    ai:     <svg {...w}><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.38-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 0 2h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1 0-2h1a7 7 0 0 1 7-7h1V5.73A2 2 0 0 1 10 4a2 2 0 0 1 2-2z"/><circle cx="9" cy="14" r="1"/><circle cx="15" cy="14" r="1"/></svg>,
    spark:  <svg {...w} fill="currentColor" stroke="none"><path d="M12 1l2.5 7.5H22l-6.5 4.7 2.5 7.5L12 16l-6 4.7 2.5-7.5L3 8.5h7.5z"/></svg>,

  };
  return icons[n] || null;
}

function Btn({ children, onClick, variant = "primary", disabled, type = "button", icon, sz }: {
  children: React.ReactNode; onClick?: () => void;
  variant?: "primary"|"ghost"|"accent"|"warn"|"danger";
  disabled?: boolean; type?: "button"|"submit"; icon?: string; sz?: "sm"|"lg";
}) {
  const map: Record<string, { bg: string; c: string; border?: string }> = {
    primary: { bg: G, c: "#fff" },
    accent:  { bg: BL, c: "#fff" },
    warn:    { bg: AM, c: "#fff" },
    danger:  { bg: RD, c: "#fff" },
    ghost:   { bg: "transparent", c: TM, border: `1.5px solid ${BR}` },
  };
  const s = map[variant] || map.primary;
  const pad = sz === "sm" ? "5px 12px" : sz === "lg" ? "11px 24px" : "8px 17px";
  const fs  = sz === "sm" ? "12px" : "14px";
  return (
    <button type={type} disabled={disabled} onClick={disabled ? undefined : onClick}
      style={{ background: disabled ? "#94a3b8" : s.bg, color: s.c, border: s.border || "none", borderRadius: 9, padding: pad, fontSize: fs, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "inherit", transition: "opacity 0.15s", opacity: disabled ? 0.6 : 1 }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.opacity = "0.85"; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
    >
      {icon && <Ico n={icon} s={13} />}{children}
    </button>
  );
}

function Modal({ title, mw = 600, onClose, children }: { title: string; mw?: number; onClose: () => void; children: React.ReactNode }) {
  const mobile = typeof window !== "undefined" && window.innerWidth < 768;
  return (
    <div className="modal-backdrop" style={{ position: "fixed", inset: 0, background: "rgba(14,31,48,0.42)", backdropFilter: "blur(6px)", zIndex: 1000, display: "flex", alignItems: mobile ? "flex-end" : "center", justifyContent: "center", padding: mobile ? 0 : 16 }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-inner" style={{ background: SU, borderRadius: mobile ? "20px 20px 0 0" : 20, width: "100%", maxWidth: mobile ? "100%" : mw, maxHeight: mobile ? "92dvh" : "92vh", overflow: "auto", boxShadow: SHL, border: `1px solid ${BR}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: mobile ? "18px 20px 14px" : "20px 26px 16px", borderBottom: `1px solid ${BR}` }}>
          <h3 style={{ margin: 0, color: TX, fontSize: 17, fontFamily: "Lora,Georgia,serif", fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: SA, border: "none", color: TM, cursor: "pointer", padding: 6, borderRadius: 8, display: "flex" }}><Ico n="x" s={15} /></button>
        </div>
        <div style={{ padding: mobile ? "18px 20px" : "22px 26px" }}>{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 13 }}>
      <label style={{ display: "block", color: TM, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  );
}

function Bdg({ label, color }: { label: string; color: string }) {
  const m: Record<string, { bg: string; c: string; b: string }> = {
    green:  { bg: "#dcfce7", c: "#166534", b: "#bbf7d0" },
    red:    { bg: "#fee2e2", c: "#991b1b", b: "#fca5a5" },
    yellow: { bg: "#fef9c3", c: "#854d0e", b: "#fde68a" },
    blue:   { bg: "#dbeafe", c: "#1e40af", b: "#bfdbfe" },
    gray:   { bg: "#f1f5f9", c: "#475569", b: "#e2e8f0" },
    purple: { bg: "#ede9fe", c: "#5b21b6", b: "#ddd6fe" },
  };
  const v = m[color] || m.gray;
  return <span style={{ background: v.bg, color: v.c, border: `1px solid ${v.b}`, borderRadius: 20, padding: "3px 9px", fontSize: 11, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{label}</span>;
}

function StatCard({ label, value, sub, icon, ac, acBg }: { label: string; value: string | number; sub?: string; icon: string; ac: string; acBg: string }) {
  return (
    <div style={{ background: SU, border: `1px solid ${BR}`, borderRadius: 15, padding: "18px 20px", boxShadow: SH, display: "flex", gap: 14 }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: acBg, display: "flex", alignItems: "center", justifyContent: "center", color: ac, flexShrink: 0 }}>
        <Ico n={icon} s={19} />
      </div>
      <div>
        <div style={{ color: TL, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 3 }}>{label}</div>
        <div style={{ color: TX, fontSize: 22, fontWeight: 800, fontFamily: "Lora,Georgia,serif", lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ color: TL, fontSize: 12, marginTop: 3 }}>{sub}</div>}
      </div>
    </div>
  );
}

function money(n: number) {
  const x = Number(n) || 0;
  return `₦${x.toLocaleString("en-NG")}`;
}

function todayYMD() {
  return new Date().toISOString().slice(0, 10);
}

function ageFromDob(dob: string) {
  if (!dob) return "";
  const b = new Date(dob);
  const t = new Date();
  let a = t.getFullYear() - b.getFullYear();
  if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--;
  return String(a);
}

function parseNumberInput(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function uid(prefix: string) {
  return `${prefix}${Date.now().toString(36).toUpperCase()}`;
}

// Odontogram bits (ported from your original)
const COND: Record<string, { color: string; label: string; sh: string }> = {
  caries: { color: "#dc2626", label: "Caries", sh: "C" },
  filling: { color: "#2563eb", label: "Filling", sh: "F" },
  crown: { color: "#d97706", label: "Crown", sh: "Cr" },
  rootCanal: { color: "#7c3aed", label: "Root Canal", sh: "RC" },
  extraction: { color: "#374151", label: "Extracted", sh: "Ex" },
  implant: { color: "#059669", label: "Implant", sh: "Im" },
  impacted: { color: "#b45309", label: "Impacted", sh: "Ip" },
  bridge: { color: "#0284c7", label: "Bridge", sh: "Br" },
  veneer: { color: "#db2777", label: "Veneer", sh: "V" },
  fractured: { color: "#991b1b", label: "Fractured", sh: "Fr" },
  absent: { color: "#9ca3af", label: "Absent", sh: "Ab" },
  healthy: { color: "#16a34a", label: "Healthy", sh: "H" },
};

const UPPER_R = [18, 17, 16, 15, 14, 13, 12, 11];
const UPPER_L = [21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_L = [31, 32, 33, 34, 35, 36, 37, 38];
const LOWER_R = [48, 47, 46, 45, 44, 43, 42, 41];

function OdontogramEditor({
  data,
  onChange,
  readOnly,
}: {
  data: Record<string, string[]>;
  onChange: (next: Record<string, string[]>) => void;
  readOnly: boolean;
}) {
  const [active, setActive] = useState("caries");
  const [erase, setErase] = useState(false);

  function handleTooth(id: number) {
    if (readOnly) return;
    const k = String(id);
    const cur = data[k] || [];
    if (erase) {
      const next = { ...data };
      delete next[k];
      onChange(next);
      return;
    }
    if (cur.includes(active)) {
      const filtered = cur.filter((c) => c !== active);
      if (filtered.length === 0) {
        const next = { ...data };
        delete next[k];
        onChange(next);
      } else {
        onChange({ ...data, [k]: filtered });
      }
    } else {
      onChange({ ...data, [k]: [...cur, active] });
    }
  }

  function ToothCell({ id }: { id: number }) {
    const k = String(id);
    const conds = data[k] || [];
    const gone = conds.includes("extraction") || conds.includes("absent");
    const primary = conds[0];
    const col = primary && COND[primary] ? COND[primary].color : G;
    return (
      <div
        onClick={() => handleTooth(id)}
        title={`Tooth ${id}${conds.length ? ": " + conds.map((c) => COND[c]?.label || c).join(", ") : ""}`}
        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, cursor: readOnly ? "default" : "pointer" }}
      >
        <div style={{ fontSize: 8, color: TM, fontWeight: 800, lineHeight: 1 }}>{id}</div>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            background: gone ? SA : conds.length > 0 ? `${col}20` : GL,
            border: `1.5px solid ${gone ? "#e2e8f0" : conds.length > 0 ? col : BR}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {gone ? (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="3">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : conds.length > 0 ? (
            <span style={{ fontSize: 8, fontWeight: 900, color: col, letterSpacing: "-0.02em" }}>
              {conds.slice(0, 2).map((c) => COND[c]?.sh || "?").join(",")}
            </span>
          ) : (
            <Ico n="tooth" s={12} />
          )}
        </div>
      </div>
    );
  }

  function Row({ teeth }: { teeth: number[] }) {
    return <div style={{ display: "flex", gap: 2 }}>{teeth.map((t) => <ToothCell key={t} id={t} />)}</div>;
  }

  const used = [...new Set(Object.values(data).flat())];

  return (
    <div>
      {!readOnly && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: TM, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
            Select condition then click a tooth
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
            {Object.entries(COND).map(([k, v]) => (
              <button
                key={k}
                onClick={() => { setActive(k); setErase(false); }}
                style={{
                  padding: "6px 10px",
                  borderRadius: 10,
                  border: `1.5px solid ${active === k && !erase ? v.color : BR}`,
                  background: active === k && !erase ? `${v.color}18` : "transparent",
                  color: active === k && !erase ? v.color : TM,
                  fontWeight: 900,
                  cursor: "pointer",
                  fontSize: "11px",
                  fontFamily: "inherit",
                }}
              >
                {v.label}
              </button>
            ))}
            <button
              onClick={() => setErase((e) => !e)}
              style={{
                padding: "6px 10px",
                borderRadius: 10,
                border: `1.5px solid ${erase ? RD : BR}`,
                background: erase ? RDL : "transparent",
                color: erase ? RD : TM,
                fontWeight: 900,
                cursor: "pointer",
                fontSize: "11px",
                fontFamily: "inherit",
              }}
            >
              ✕ Clear
            </button>
          </div>
        </div>
      )}

      <div style={{ background: SA, border: `1px solid ${BR}`, borderRadius: 14, padding: 16, overflowX: "auto" }}>
        <div style={{ minWidth: 520 }}>
          <div style={{ textAlign: "center", fontSize: 10, color: TM, fontWeight: 800, letterSpacing: "0.07em", paddingBottom: 6, borderBottom: `1.5px dashed ${BR}` }}>
            UPPER / MAXILLA
          </div>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 6, marginBottom: 4 }}>
            <div style={{ fontSize: 9, color: TM, fontWeight: 900, marginBottom: 4 }}>R</div>
            <Row teeth={UPPER_R} />
            <div style={{ width: 1, background: BR, alignSelf: "stretch", margin: "0 3px" }} />
            <Row teeth={UPPER_L} />
            <div style={{ fontSize: 9, color: TM, fontWeight: 900, marginBottom: 4 }}>L</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, margin: "6px 0" }}>
            <div style={{ flex: 1, height: 1, background: BR }} />
            <span style={{ fontSize: 9, color: TM, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", padding: "2px 8px", background: SU, border: `1px solid ${BR}`, borderRadius: 20 }}>
              MIDLINE
            </span>
            <div style={{ flex: 1, height: 1, background: BR }} />
          </div>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-start", gap: 6, marginBottom: 6 }}>
            <div style={{ fontSize: 9, color: TM, fontWeight: 900, marginTop: 4 }}>R</div>
            <Row teeth={LOWER_R} />
            <div style={{ width: 1, background: BR, alignSelf: "stretch", margin: "0 3px" }} />
            <Row teeth={LOWER_L} />
            <div style={{ fontSize: 9, color: TM, fontWeight: 900, marginTop: 4 }}>L</div>
          </div>
          <div style={{ textAlign: "center", fontSize: 10, color: TM, fontWeight: 800, letterSpacing: "0.07em", paddingTop: 6, borderTop: `1.5px dashed ${BR}` }}>
            LOWER / MANDIBLE
          </div>
        </div>
      </div>

      {used.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
          {used.map((k) => (
            <span key={k} style={{ padding: "4px 10px", borderRadius: 20, background: `${COND[k]?.color || G}14`, border: `1px solid ${COND[k]?.color || G}44`, color: COND[k]?.color || G, fontWeight: 900, fontSize: 11 }}>
              {COND[k]?.label || k}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ClinicalRecordView({
  patient,
  record,
  onSave,
  onBack,
  user,
}: {
  patient: Patient;
  record: ClinicalRecord;
  onSave: (next: ClinicalRecord) => Promise<void>;
  onBack: () => void;
  user: AuthedStaff;
}) {
  const [tab, setTab] = useState<"overview" | "exam" | "odo" | "history">("overview");
  const canEdit = user.role === "Dentist";

  const [odontogram, setOdontogram] = useState<Record<string, string[]>>(record.odontogram || {});
  const [complaint, setComplaint] = useState(record.complaint || "");
  const [bp, setBp] = useState(record.bp || "");
  const [pulse, setPulse] = useState(record.pulse || "");
  const [temp, setTemp] = useState(record.temp || "");
  const [resp, setResp] = useState(record.resp || "");
  const [extraOral, setExtraOral] = useState(record.extraOral || "");
  const [intraOral, setIntraOral] = useState(record.intraOral || "");
  const [occlusion, setOcclusion] = useState(record.occlusion || "");
  const [notes, setNotes] = useState<ClinicalNote[]>(record.notes || []);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);

  // AI assistant
  const [aiOpen, setAiOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const aiEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (aiOpen) aiEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [aiMessages, aiOpen]);

  async function sendAiMessage(text?: string) {
    const msg = (text ?? aiInput).trim();
    if (!msg || aiLoading) return;
    const nextHistory = [...aiMessages, { role: "user" as const, content: msg }];
    setAiMessages(nextHistory);
    setAiInput("");
    setAiLoading(true);
    const patientContext = {
      name: patient.name,
      dob: patient.dob,
      gender: patient.gender || null,
      blood: patient.blood || null,
      allergies: patient.allergies,
      medicalHistory: patient.medical || null,
      smoker: patient.smoker || null,
      alcohol: patient.alcohol || null,
      lastVisit: patient.lastVisit || null,
      balance: patient.balance,
      odontogram: Object.entries(odontogram).filter(([, v]) => v.length > 0).map(([t, c]) => `Tooth ${t}: ${c.join(", ")}`).join("; ") || "No conditions recorded",
      vitals: { bp, pulse, temp, resp },
      complaint,
      extraOral, intraOral, occlusion,
      recentNotes: notes.slice(0, 6).map(n => ({ date: n.date, procedure: n.procedure, teeth: n.teeth, description: n.description, medications: n.medications, followUp: n.followUp })),
    };
    try {
      const r = await fetch("/api/ai", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, patientContext, history: aiMessages }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "AI error");
      setAiMessages([...nextHistory, { role: "assistant", content: data.reply }]);
    } catch (e: any) {
      setAiMessages([...nextHistory, { role: "assistant", content: `⚠️ ${e.message}` }]);
    } finally {
      setAiLoading(false);
    }
  }

  // Photos stored in localStorage keyed by patient id (decoupled from the API)
  const photoKey = `photos_${patient.id}`;
  const [photos, setPhotos] = useState<string[]>([]);
  useEffect(() => {
    try {
      const stored = localStorage.getItem(photoKey);
      if (stored) setPhotos(JSON.parse(stored));
    } catch {}
  }, [photoKey]);
  function savePhotos(next: string[]) {
    setPhotos(next);
    try { localStorage.setItem(photoKey, JSON.stringify(next)); } catch {}
  }

  const [noteModal, setNoteModal] = useState(false);
  const [nf, setNf] = useState<{ procedure: string; teeth: string; description: string; medications: string; followUp: string }>({
    procedure: "",
    teeth: "",
    description: "",
    medications: "",
    followUp: "",
  });

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({ odontogram, complaint, bp, pulse, temp, resp, extraOral, intraOral, occlusion, notes });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  const TABS = [
    { id: "overview",  icon: "pts",   label: "Overview" },
    { id: "exam",      icon: "pulse", label: "Clinical Exam" },
    { id: "odo",       icon: "grid",  label: "Odontogram" },
    { id: "history",   icon: "notes", label: "Tx History" },
  ] as const;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18, flexWrap: "wrap" }}>
        <Btn variant="ghost" onClick={onBack} icon="back"><span>Patients</span></Btn>
        <div style={{ flex: 1, minWidth: 260 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 999, background: `linear-gradient(135deg,${G},${GM})`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>
              {patient.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
            </div>
            <div>
              <div style={{ color: TX, fontSize: 18, fontWeight: 900 }}>{patient.name}</div>
              <div style={{ color: TM, fontSize: 12 }}>
                {patient.id} · {patient.gender || "—"} · Age {ageFromDob(patient.dob) || "—"} · {patient.blood || ""} · Allergies: <span style={{ color: patient.allergies !== "None" ? RD : TM, fontWeight: 600 }}>{patient.allergies || "None"}</span>
              </div>
            </div>
          </div>
        </div>
        {canEdit && (
          <Btn onClick={handleSave} disabled={saving} variant="primary">
            {saved ? "✓ Saved" : saving ? "Saving..." : "Save Record"}
          </Btn>
        )}
        <button onClick={() => setAiOpen(o => !o)}
          style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 16px", borderRadius: 10, border: `1.5px solid ${aiOpen ? G : BR}`, background: aiOpen ? GL : SU, color: aiOpen ? G : TM, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>
          <Ico n="spark" s={15} /> AI Assistant
        </button>
      </div>

      <div className="tab-bar" style={{ display: "flex", gap: 6, marginBottom: 16, background: SU, border: `1px solid ${BR}`, borderRadius: 12, padding: 6 }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: "1 0 auto",
              background: tab === t.id ? G : "transparent",
              color: tab === t.id ? "#fff" : TX,
              border: "none",
              borderRadius: 10,
              padding: "10px 12px",
              cursor: "pointer",
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              fontFamily: "inherit",
              fontSize: 13,
              whiteSpace: "nowrap",
            }}
          >
            <Ico n={t.icon} s={14} />{t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="form-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ background: SU, border: `1px solid ${BR}`, borderRadius: 14, padding: 18 }}>
            <div style={{ fontSize: 11, color: TM, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Personal Info</div>
            {[
              ["Full Name", patient.name],
              ["Date of Birth", patient.dob],
              ["Age", ageFromDob(patient.dob) ? `${ageFromDob(patient.dob)} yrs` : "—"],
              ["Gender", patient.gender || "—"],
              ["Phone", patient.phone],
              ["Email", patient.email || "—"],
              ["Address", patient.address || "—"],
              ["Occupation", patient.job || "—"],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${BR}` }}>
                <span style={{ color: TM, fontSize: 13 }}>{k}</span>
                <span style={{ color: TX, fontSize: 13, fontWeight: 700 }}>{v as any}</span>
              </div>
            ))}
          </div>

          <div style={{ background: SU, border: `1px solid ${BR}`, borderRadius: 14, padding: 18 }}>
            <div style={{ fontSize: 11, color: TM, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Medical History</div>
            {[
              ["Blood Group", patient.blood || "—"],
              ["Allergies", patient.allergies || "None"],
              ["Medical Hx", patient.medical || "None"],
              ["Smoker", patient.smoker || "No"],
              ["Alcohol", patient.alcohol || "None"],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${BR}` }}>
                <span style={{ color: TM, fontSize: 13 }}>{k}</span>
                <span style={{ color: k === "Allergies" && (v as string) !== "None" ? RD : TX, fontSize: 13, fontWeight: 800 }}>{v as any}</span>
              </div>
            ))}
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 11, color: TM, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Last Vitals (edit in Clinical Exam)</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  ["BP", bp, "mmHg"],
                  ["Pulse", pulse, "bpm"],
                  ["Temp", temp, "C"],
                  ["Resp", resp, "/min"],
                ].map(([k, v, u]) => (
                  <div key={k as string} style={{ background: SA, borderRadius: 10, padding: "10px 12px", border: `1px solid ${BR}` }}>
                    <div style={{ color: TM, fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>{k as any}</div>
                    <div style={{ color: TX, fontSize: 16, fontWeight: 900 }}>{(v as any) || "—"} {v ? <span style={{ color: TM, fontSize: 9, fontWeight: 800, marginLeft: 2 }}>{u}</span> : null}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ gridColumn: "1 / -1", background: SU, border: `1px solid ${BR}`, borderRadius: 14, padding: 18 }}>
            <div style={{ fontSize: 11, color: TM, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Chief Complaint</div>
            <div style={{ color: TX, fontSize: 14, lineHeight: 1.7, fontStyle: complaint ? "normal" : "italic" }}>{complaint || "No complaint recorded."}</div>
          </div>

          <div style={{ gridColumn: "1 / -1", background: SU, border: `1px solid ${BR}`, borderRadius: 14, padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: TM, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase" }}>Recent Treatments</div>
              <button onClick={() => setTab("history")} style={{ background: "transparent", border: "none", color: BL, cursor: "pointer", fontWeight: 900 }}>
                View all
              </button>
            </div>
            {notes.slice(0, 4).map((n) => (
              <div key={n.id} style={{ padding: "10px 0", borderBottom: `1px solid ${BR}`, display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 56, background: GL, borderRadius: 10, padding: "8px 10px", textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 900 }}>{n.date.split("-")[2] || "—"}</div>
                  <div style={{ fontSize: 10, color: TM, fontWeight: 900, textTransform: "uppercase" }}>{n.date.split("-")[0] || ""}</div>
                </div>
                <div>
                  <div style={{ color: TX, fontWeight: 900 }}>{n.procedure}</div>
                  <div style={{ color: TM, fontSize: 12, fontWeight: 700 }}>Teeth: {n.teeth || "—"} · {n.dentist}</div>
                </div>
              </div>
            ))}
            {notes.length === 0 && <div style={{ color: TM, fontWeight: 800 }}>No treatment notes recorded.</div>}
          </div>
        </div>
      )}

      {tab === "exam" && (
        <div className="form-grid-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ background: SU, border: `1px solid ${BR}`, borderRadius: 14, padding: 18 }}>
            <div style={{ fontSize: 11, color: TM, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>Vital Signs</div>
            {(
              [
                ["BP", bp, setBp],
                ["Pulse", pulse, setPulse],
                ["Temp", temp, setTemp],
                ["Resp Rate", resp, setResp],
              ] as Array<[string, string, (v: string) => void]>
            ).map(([lbl, val, setter]) => (
              <div key={lbl as string} style={{ marginBottom: 10 }}>
                <div style={{ color: TM, fontSize: 12, fontWeight: 900, marginBottom: 6 }}>{lbl}</div>
                <input
                  disabled={!canEdit}
                  value={val as string}
                  onChange={(e) => setter(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${BR}`, background: canEdit ? SU : SA, color: TX, fontWeight: 800 }}
                />
              </div>
            ))}
          </div>

          <div style={{ background: SU, border: `1px solid ${BR}`, borderRadius: 14, padding: 18 }}>
            <div style={{ fontSize: 11, color: TM, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Chief Complaint</div>
            <textarea
              disabled={!canEdit}
              value={complaint}
              onChange={(e) => setComplaint(e.target.value)}
              rows={7}
              placeholder="Patient's presenting complaint..."
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${BR}`, background: canEdit ? SU : SA, color: TX, fontWeight: 700, lineHeight: 1.5, resize: "vertical" }}
            />
          </div>

          <div style={{ background: SU, border: `1px solid ${BR}`, borderRadius: 14, padding: 18 }}>
            <div style={{ fontSize: 11, color: TM, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Extra-Oral Examination</div>
            <textarea
              disabled={!canEdit}
              value={extraOral}
              onChange={(e) => setExtraOral(e.target.value)}
              rows={6}
              placeholder="Facial symmetry, swelling, TMJ, lips..."
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${BR}`, background: canEdit ? SU : SA, color: TX, fontWeight: 700, lineHeight: 1.5, resize: "vertical" }}
            />
          </div>

          <div style={{ background: SU, border: `1px solid ${BR}`, borderRadius: 14, padding: 18 }}>
            <div style={{ fontSize: 11, color: TM, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Intra-Oral Examination</div>
            <textarea
              disabled={!canEdit}
              value={intraOral}
              onChange={(e) => setIntraOral(e.target.value)}
              rows={6}
              placeholder="Soft tissues, gingiva, plaque, calculus..."
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${BR}`, background: canEdit ? SU : SA, color: TX, fontWeight: 700, lineHeight: 1.5, resize: "vertical" }}
            />
          </div>

          <div style={{ gridColumn: "1 / -1", background: SU, border: `1px solid ${BR}`, borderRadius: 14, padding: 18 }}>
            <div style={{ fontSize: 11, color: TM, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Occlusion & Radiographic Findings</div>
            <textarea
              disabled={!canEdit}
              value={occlusion}
              onChange={(e) => setOcclusion(e.target.value)}
              rows={3}
              placeholder="Angle's classification, overjet/overbite, radiographic findings..."
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${BR}`, background: canEdit ? SU : SA, color: TX, fontWeight: 700, lineHeight: 1.5, resize: "vertical" }}
            />
          </div>

          {!canEdit && <div style={{ gridColumn: "1 / -1", color: TM, fontWeight: 800 }}>Read-only (Dentist can edit).</div>}
        </div>
      )}

      {tab === "odo" && (
        <div style={{ background: SU, border: `1px solid ${BR}`, borderRadius: 14, padding: 16 }}>
          <div style={{ marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <div>
              <div style={{ color: TX, fontWeight: 900, fontSize: 16, marginBottom: 2 }}>Digital Odontogram</div>
              <div style={{ color: TM, fontWeight: 800, fontSize: 12 }}>FDI notation</div>
            </div>
            {canEdit && (
              <Btn onClick={handleSave} disabled={saving} variant="primary">
                {saving ? "Saving..." : "Save Odontogram"}
              </Btn>
            )}
          </div>
          <OdontogramEditor data={odontogram} onChange={setOdontogram} readOnly={!canEdit} />
          <div style={{ marginTop: 14, color: TM, fontWeight: 800 }}>
            Tip: toggle conditions at the top, then click teeth. Use “Clear” to erase.
          </div>
        </div>
      )}

      {tab === "history" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
            <div>
              <div style={{ color: TX, fontWeight: 900, fontSize: 16, marginBottom: 2 }}>Treatment History</div>
              <div style={{ color: TM, fontWeight: 800, fontSize: 12 }}>{notes.length} session(s) recorded</div>
            </div>
            {canEdit && (
              <Btn
                variant="primary"
                onClick={() => {
                  setNf({ procedure: "", teeth: "", description: "", medications: "", followUp: "" });
                  setNoteModal(true);
                }}
              >
                Add Treatment Note
              </Btn>
            )}
          </div>

          {notes.length === 0 ? (
            <div style={{ background: SA, border: `1px dashed ${BR}`, borderRadius: 14, padding: 26, textAlign: "center", color: TM, fontWeight: 900 }}>
              No treatment notes recorded.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {notes.map((n) => (
                <div key={n.id} style={{ background: SU, border: `1px solid ${BR}`, borderRadius: 14, padding: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <div>
                      <div style={{ color: TX, fontWeight: 900 }}>{n.procedure}</div>
                      <div style={{ color: TM, fontWeight: 800, fontSize: 12 }}>
                        {n.date} · Teeth: <span style={{ color: TX, fontWeight: 900 }}>{n.teeth || "—"}</span> · {n.dentist || user.name}
                      </div>
                    </div>
                    {canEdit && (
                      <button
                        onClick={() => setNotes((prev) => prev.filter((x) => x.id !== n.id))}
                        style={{ background: "transparent", border: "none", color: RD, cursor: "pointer", fontWeight: 900 }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  {n.description ? <div style={{ marginTop: 10, color: TX, lineHeight: 1.6, background: SA, padding: 12, borderRadius: 10 }}>{n.description}</div> : null}
                  {n.medications ? <div style={{ marginTop: 10, color: TX, background: "#fef6e4", padding: 12, borderRadius: 10, border: "1px solid #fde68a" }}>Medications: {n.medications}</div> : null}
                  {n.followUp ? <div style={{ marginTop: 10, color: TX, background: "#e8f1fb", padding: 12, borderRadius: 10, border: "1px solid #bfdbfe" }}>Follow-up: {n.followUp}</div> : null}
                </div>
              ))}
            </div>
          )}

          {!canEdit && <div style={{ marginTop: 14, color: TM, fontWeight: 800 }}>Read-only (Dentist can edit).</div>}

          {canEdit && (
            <div style={{ marginTop: 18 }}>
              <Btn onClick={handleSave} disabled={saving} variant="primary">
                {saving ? "Saving..." : "Save Notes"}
              </Btn>
            </div>
          )}

          {/* Photos */}
          <div style={{ marginTop: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ color: TX, fontWeight: 800, fontSize: 13 }}>Clinical Photos</div>
              {canEdit && (
                <label style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", background: BLL, border: `1.5px solid ${BL}33`, borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700, color: BL, fontFamily: "inherit" }}>
                  <Ico n="plus" s={13} /> Add Photo
                  <input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    const readers: Promise<string>[] = files.map(file => new Promise(resolve => {
                      const reader = new FileReader();
                      reader.onload = ev => resolve(ev.target?.result as string);
                      reader.readAsDataURL(file);
                    }));
                    Promise.all(readers).then(b64s => savePhotos([...photos, ...b64s]));
                    e.target.value = "";
                  }} />
                </label>
              )}
            </div>
            {photos.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", background: SA, borderRadius: 10, border: `1px dashed ${BR}`, color: TL, fontSize: 12 }}>No photos attached yet</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 10 }}>
                {photos.map((src, idx) => (
                  <div key={idx} onClick={() => setPreviewSrc(src)} style={{ position: "relative", borderRadius: 10, overflow: "hidden", border: `1px solid ${BR}`, aspectRatio: "1", background: SA, cursor: "pointer" }}>
                    <img src={src} alt={`Photo ${idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    {canEdit && (
                      <button onClick={(e) => { e.stopPropagation(); savePhotos(photos.filter((_, i) => i !== idx)); }}
                        style={{ position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: "50%", background: "rgba(192,57,43,0.85)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, lineHeight: 1 }}>×</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {previewSrc && (
        <div onClick={() => setPreviewSrc(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", cursor: "zoom-out" }}>
          <img src={previewSrc} alt="Preview"
            style={{ maxWidth: "90vw", maxHeight: "90vh", borderRadius: 12, boxShadow: "0 8px 40px rgba(0,0,0,0.5)", objectFit: "contain" }} />
          <button onClick={() => setPreviewSrc(null)}
            style={{ position: "absolute", top: 20, right: 20, background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", borderRadius: "50%", width: 36, height: 36, cursor: "pointer", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>
      )}

      {noteModal && (
        <Modal title="New Treatment Note" mw={720} onClose={() => setNoteModal(false)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Procedure / Treatment">
              <input value={nf.procedure} onChange={(e) => setNf((p) => ({ ...p, procedure: e.target.value }))} style={inputStyle} />
            </Field>
            <Field label="Teeth Involved">
              <input value={nf.teeth} onChange={(e) => setNf((p) => ({ ...p, teeth: e.target.value }))} style={inputStyle} />
            </Field>
          </div>
          <Field label="Clinical Description">
            <textarea value={nf.description} onChange={(e) => setNf((p) => ({ ...p, description: e.target.value }))} rows={5} style={{ ...inputStyle, resize: "vertical", minHeight: 110 }} />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field label="Medications Prescribed">
              <textarea value={nf.medications} onChange={(e) => setNf((p) => ({ ...p, medications: e.target.value }))} rows={3} style={{ ...inputStyle, resize: "vertical", minHeight: 90 }} />
            </Field>
            <Field label="Follow-up Plan">
              <textarea value={nf.followUp} onChange={(e) => setNf((p) => ({ ...p, followUp: e.target.value }))} rows={3} style={{ ...inputStyle, resize: "vertical", minHeight: 90 }} />
            </Field>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
            <Btn variant="ghost" onClick={() => setNoteModal(false)}>
              Cancel
            </Btn>
            <Btn
              onClick={() => {
                if (!nf.procedure.trim() || !nf.description.trim()) return;
                const nextNote: ClinicalNote = {
                  id: uid("TN"),
                  date: todayYMD(),
                  dentist: user.name,
                  procedure: nf.procedure,
                  teeth: nf.teeth,
                  description: nf.description,
                  medications: nf.medications,
                  followUp: nf.followUp,
                };
                setNotes((prev) => [nextNote, ...prev]);
                setNoteModal(false);
                setNf({ procedure: "", teeth: "", description: "", medications: "", followUp: "" });
              }}
              variant="primary"
            >
              Save Note
            </Btn>
          </div>
        </Modal>
      )}

      {/* AI Assistant panel */}
      {aiOpen && (
        <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 380, background: SU, borderLeft: `1px solid ${BR}`, boxShadow: "-4px 0 24px rgba(14,31,48,0.10)", zIndex: 900, display: "flex", flexDirection: "column", fontFamily: "inherit" }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", borderBottom: `1px solid ${BR}`, background: GL }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: G, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}><Ico n="spark" s={15} /></div>
              <div>
                <div style={{ color: TX, fontWeight: 800, fontSize: 14 }}>AI Clinical Assistant</div>
                <div style={{ color: TM, fontSize: 11 }}>{patient.name}</div>
              </div>
            </div>
            <button onClick={() => setAiOpen(false)} style={{ background: "none", border: "none", color: TM, cursor: "pointer", padding: 6, borderRadius: 8, display: "flex" }}><Ico n="x" s={15} /></button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
            {aiMessages.length === 0 && (
              <div style={{ textAlign: "center", paddingTop: 24 }}>
                <div style={{ color: TL, fontSize: 13, marginBottom: 18 }}>Ask me anything about this patient or use a quick prompt below.</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[
                    "Draft a clinical note for today's visit",
                    "Summarise this patient's treatment history",
                    "Suggest a follow-up treatment plan",
                    "Are there any drug interactions to be aware of?",
                  ].map(p => (
                    <button key={p} onClick={() => sendAiMessage(p)}
                      style={{ background: GL, border: `1px solid ${G}44`, borderRadius: 10, padding: "9px 12px", color: G, fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {aiMessages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "88%", padding: "10px 13px", borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                  background: m.role === "user" ? G : SA, color: m.role === "user" ? "#fff" : TX,
                  fontSize: 13, lineHeight: 1.55, whiteSpace: "pre-wrap", wordBreak: "break-word",
                  boxShadow: SH,
                }}>
                  {m.content}
                </div>
              </div>
            ))}
            {aiLoading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{ background: SA, padding: "10px 14px", borderRadius: "14px 14px 14px 4px", color: TM, fontSize: 13, boxShadow: SH }}>
                  <span style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: TL, animation: "pulse 1s infinite" }} />
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: TL, animation: "pulse 1s 0.2s infinite" }} />
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: TL, animation: "pulse 1s 0.4s infinite" }} />
                  </span>
                </div>
              </div>
            )}
            <div ref={aiEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "12px 14px", borderTop: `1px solid ${BR}`, display: "flex", gap: 8 }}>
            <textarea
              value={aiInput}
              onChange={e => setAiInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendAiMessage(); } }}
              placeholder="Ask about this patient… (Enter to send)"
              rows={2}
              style={{ flex: 1, border: `1.5px solid ${BR}`, borderRadius: 10, padding: "9px 11px", fontSize: 13, color: TX, fontFamily: "inherit", resize: "none", outline: "none", background: SA, lineHeight: 1.5 }}
            />
            <button onClick={() => sendAiMessage()} disabled={aiLoading || !aiInput.trim()}
              style={{ width: 40, borderRadius: 10, border: "none", background: aiLoading || !aiInput.trim() ? BR : G, color: "#fff", cursor: aiLoading || !aiInput.trim() ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Ico n="send" s={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Module-level inputStyle used by ClinicalRecordView (static colors; Page overrides with theme-aware version)
const inputStyle: React.CSSProperties = {
  width: "100%",
  background: SU,
  border: `1.5px solid ${BR}`,
  borderRadius: 10,
  color: TX,
  padding: "10px 12px",
  fontWeight: 800,
  outline: "none",
  fontFamily: "inherit",
};

const TREATMENTS = ["Cleaning", "Filling", "Extraction", "Root Canal", "Braces Consult", "Whitening", "Implant Consult", "Crown", "Bridge", "Scaling", "Emergency", "Checkup", "X-Ray"];

export default function Page() {
  const [user, setUser] = useState<AuthedStaff | null>(null);
  const [staff, setStaff] = useState<Bootstrap["staff"]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [clinical, setClinical] = useState<Record<string, ClinicalRecord>>({});
  const [appts, setAppts] = useState<Appointment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  const [tab, setTab] = useState<"dashboard" | "patients" | "appointments" | "billing" | "communications" | "tasks">("dashboard");

  const [loginEmail, setLoginEmail] = useState(DEMO[0].email);
  const [loginPw, setLoginPw] = useState(DEMO[0].password);
  const [loginErr, setLoginErr] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [mini, setMini] = useState(false);
  const [usrMenu, setUsrMenu] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setDrawerOpen(false);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  async function refresh() {
    const r = await fetch("/api/bootstrap", { credentials: "include" });
    if (!r.ok) {
      setUser(null);
      setTab("dashboard");
      return;
    }
    const data = (await r.json()) as Bootstrap;
    setUser(data.user);
    setStaff(data.staff);
    setPatients(data.patients);
    setClinical(data.clinical);
    setAppts(data.appts);
    setInvoices(data.invoices);
    setTasks(data.tasks);
    setMessages(data.messages);
  }

  useEffect(() => {
    // Attempt silent auth on load
    refresh().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function doLogin() {
    setLoginErr("");
    setLoginLoading(true);
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: loginEmail, password: loginPw }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => null);
        setLoginErr(j?.error || "Login failed");
        return;
      }
      await refresh();
    } finally {
      setLoginLoading(false);
    }
  }

  async function doLogout() {
    if (!confirm("Sign out of Yinlade Clinic?")) return;
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setUser(null);
    setTab("dashboard");
  }


  // Patients view local state
  const [openPatientId, setOpenPatientId] = useState<string | null>(null);
  const [patientModal, setPatientModal] = useState<null | "add" | "edit">(null);
  const [patientForm, setPatientForm] = useState<any>({});
  const currentPatient = patients.find((p) => p.id === openPatientId) || null;

  const [patientQueryRaw, setPatientQueryRaw] = useState("");
  const [patientQuery, setPatientQuery] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setPatientQuery(patientQueryRaw), 200);
    return () => clearTimeout(t);
  }, [patientQueryRaw]);

  const [patientStatusFilter, setPatientStatusFilter] = useState<"all"|"active"|"inactive">("all");
  const [patientSortBy, setPatientSortBy] = useState<"name"|"lastVisit"|"balance">("name");
  const [patientSortDir, setPatientSortDir] = useState<"asc"|"desc">("asc");
  const [patientPage, setPatientPage] = useState(1);
  const PATIENT_PAGE_SIZE = 20;

  const filteredPatients = useMemo(() => {
    const q = patientQuery.trim().toLowerCase();
    let list = patients.filter(p => {
      const matchQ = !q || p.name.toLowerCase().includes(q) || p.phone.includes(q) || p.id.includes(q);
      const matchStatus = patientStatusFilter === "all" || p.status === patientStatusFilter;
      return matchQ && matchStatus;
    });
    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (patientSortBy === "name") cmp = a.name.localeCompare(b.name);
      else if (patientSortBy === "lastVisit") cmp = (a.lastVisit || "").localeCompare(b.lastVisit || "");
      else if (patientSortBy === "balance") cmp = a.balance - b.balance;
      return patientSortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [patients, patientQuery, patientStatusFilter, patientSortBy, patientSortDir]);

  const patientPageCount = Math.max(1, Math.ceil(filteredPatients.length / PATIENT_PAGE_SIZE));
  const paginatedPatients = useMemo(() => {
    const start = (patientPage - 1) * PATIENT_PAGE_SIZE;
    return filteredPatients.slice(start, start + PATIENT_PAGE_SIZE);
  }, [filteredPatients, patientPage]);

  useEffect(() => { setPatientPage(1); }, [patientQuery, patientStatusFilter, patientSortBy, patientSortDir]);

  async function savePatient() {
    const payload = {
      ...patientForm,
      dob: patientForm.dob || "",
      email: patientForm.email || "",
      address: patientForm.address || "",
      job: patientForm.job || "",
      blood: patientForm.blood || "",
      allergies: patientForm.allergies || "None",
      medical: patientForm.medical || "",
      smoker: patientForm.smoker || "",
      alcohol: patientForm.alcohol || "",
      gender: patientForm.gender || "",
      status: patientForm.status || "active",
      phone: patientForm.phone || "",
      name: patientForm.name || "",
    };
    if (!payload.name || !payload.phone) return;

    if (patientModal === "add") {
      const r = await fetch("/api/patients", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!r.ok) return;
    } else if (patientModal === "edit") {
      const id = patientForm.id as string;
      const r = await fetch(`/api/patients/${id}`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!r.ok) return;
    }
    setPatientModal(null);
    await refresh();
  }

  async function deletePatient(id: string) {
    if (!confirm("Delete this patient record? This cannot be undone.")) return;
    const r = await fetch(`/api/patients/${id}`, { method: "DELETE", credentials: "include" });
    if (!r.ok) return;
    setOpenPatientId(null);
    setPatientModal(null);
    await refresh();
  }

  async function saveClinical(next: ClinicalRecord) {
    if (!currentPatient) return;
    const body = next;
    const r = await fetch(`/api/clinical/${currentPatient.id}`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!r.ok) {
      alert("Failed to save clinical record.");
      return;
    }
    await refresh();
  }

  // Appointment UI state
  const [apptModal, setApptModal] = useState(false);
  const [apptForm, setApptForm] = useState<any>({ type: "Cleaning", status: "pending" });
  const [apptFilter, setApptFilter] = useState<"all" | Appointment["status"]>("all");
  const [apptDateFrom, setApptDateFrom] = useState("");
  const [apptDateTo, setApptDateTo] = useState("");
  const [apptTypeFilter, setApptTypeFilter] = useState("");
  const [apptSortDir, setApptSortDir] = useState<"asc"|"desc">("asc");

  const dentists = useMemo(() => staff.filter((s) => s.role === "Dentist"), [staff]);

  // Billing UI state
  const [invoiceModal, setInvoiceModal] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState<any>({ items: [{ d: "", a: "" }] });
  const [payModal, setPayModal] = useState<Invoice | null>(null);
  const [payAmt, setPayAmt] = useState("");
  const [billDateFrom, setBillDateFrom] = useState("");
  const [billDateTo, setBillDateTo] = useState("");
  const [billStatusFilter, setBillStatusFilter] = useState<"all"|"paid"|"partial"|"unpaid">("all");
  const [billPatientQ, setBillPatientQ] = useState("");
  const [billSortBy, setBillSortBy] = useState<"date"|"total"|"balance">("date");
  const [billSortDir, setBillSortDir] = useState<"asc"|"desc">("desc");
  const [printInvoice, setPrintInvoice] = useState<Invoice | null>(null);

  // Tasks UI state
  const [taskModal, setTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState<any>({ priority: "medium", due: todayYMD() });
  const [taskFilter, setTaskFilter] = useState<"all" | "pending" | "done">("all");

  // Messages UI state
  const [msgModal, setMsgModal] = useState(false);
  const [msgForm, setMsgForm] = useState<any>({ type: "Reminder", content: "" });

  function printInvoicePDF(inv: Invoice) {
    const pt = patients.find(p => p.id === inv.pid);
    const win = window.open("", "_blank", "width=800,height=700");
    if (!win) return;
    const rows = (inv as any).items ? (inv as any).items.map((it: any) => `<tr><td style="padding:8px 12px;border-bottom:1px solid #e2e9f0">${it.d}</td><td style="padding:8px 12px;border-bottom:1px solid #e2e9f0;text-align:right">₦${Number(it.a).toLocaleString("en-NG")}</td></tr>`).join("") : "";
    win.document.write(`<!DOCTYPE html><html><head><title>Invoice ${inv.id}</title>
    <style>
      *{box-sizing:border-box;margin:0;padding:0;}
      body{font-family:'Segoe UI',sans-serif;color:#0e1f30;background:#fff;padding:40px;}
      .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;padding-bottom:20px;border-bottom:2px solid #1a6b4a;}
      .clinic-name{font-size:22px;font-weight:800;color:#1a6b4a;}
      .clinic-sub{color:#8fa3b3;font-size:13px;margin-top:2px;}
      .inv-title{font-size:28px;font-weight:800;color:#0e1f30;}
      .inv-id{color:#8fa3b3;font-size:13px;margin-top:4px;}
      .section{margin-bottom:24px;}
      .section-title{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#4a6277;margin-bottom:8px;}
      table{width:100%;border-collapse:collapse;}
      thead tr{background:#f8fafc;}
      th{padding:10px 12px;text-align:left;font-size:11px;font-weight:700;letter-spacing:.07em;text-transform:uppercase;color:#4a6277;}
      .total-row{background:#e6f4ee;}
      .total-row td{padding:12px;font-weight:800;font-size:16px;color:#1a6b4a;}
      .status{display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;text-transform:uppercase;}
      .paid{background:#dcfce7;color:#166534;} .partial{background:#fef9c3;color:#854d0e;} .unpaid{background:#fee2e2;color:#991b1b;}
      .footer{margin-top:40px;padding-top:16px;border-top:1px solid #e2e9f0;text-align:center;color:#8fa3b3;font-size:12px;}
      @media print{body{padding:20px;} button{display:none;}}
    </style></head><body>
    <div class="header">
      <div><div class="clinic-name">Yinlade Clinic</div><div class="clinic-sub">Abuja, Nigeria · 08031234567</div></div>
      <div style="text-align:right"><div class="inv-title">INVOICE</div><div class="inv-id">${inv.id}</div></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:28px;">
      <div class="section"><div class="section-title">Billed To</div>
        <div style="font-weight:700;font-size:15px">${inv.pname}</div>
        ${pt?.phone ? `<div style="color:#4a6277;font-size:13px;margin-top:3px">${pt.phone}</div>` : ""}
        ${pt?.email ? `<div style="color:#4a6277;font-size:13px">${pt.email}</div>` : ""}
      </div>
      <div class="section" style="text-align:right">
        <div class="section-title">Invoice Details</div>
        <div style="font-size:13px;color:#4a6277">Date: <strong style="color:#0e1f30">${inv.date}</strong></div>
        <div style="margin-top:6px">Status: <span class="status ${inv.status}">${inv.status.toUpperCase()}</span></div>
      </div>
    </div>
    <div class="section">
      <table>
        <thead><tr><th>Description</th><th style="text-align:right">Amount</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr class="total-row"><td>Total</td><td style="text-align:right">₦${Number(inv.total).toLocaleString("en-NG")}</td></tr>
          <tr><td style="padding:8px 12px;color:#4a6277">Amount Paid</td><td style="padding:8px 12px;text-align:right;color:#1a6b4a;font-weight:700">₦${Number(inv.paid).toLocaleString("en-NG")}</td></tr>
          <tr><td style="padding:8px 12px;font-weight:700">Balance Due</td><td style="padding:8px 12px;text-align:right;font-weight:800;color:${inv.total - inv.paid > 0 ? "#b45309" : "#1a6b4a"}">₦${Number(inv.total - inv.paid).toLocaleString("en-NG")}</td></tr>
        </tfoot>
      </table>
    </div>
    <div class="footer">Thank you for choosing Yinlade Clinic · This is a computer-generated invoice</div>
    <script>window.onload = function(){ window.print(); }<\/script>
    </body></html>`);
    win.document.close();
  }

  const owedTotal = useMemo(() => invoices.reduce((sum, i) => sum + (i.total - i.paid), 0), [invoices]);

  const marchRevenue = useMemo(() => {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return invoices.filter((i) => i.date.startsWith(ym)).reduce((sum, i) => sum + i.paid, 0);
  }, [invoices]);

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(145deg,#e9f5ef 0%,#f4f7f9 55%,#e8f1fb 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: isMobile ? 0 : 20, fontFamily: "Outfit,Segoe UI,sans-serif", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -100, left: -100, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(26,107,74,0.08),transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -80, right: -80, width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle,rgba(16,86,160,0.07),transparent 70%)", pointerEvents: "none" }} />
        <div className="login-grid" style={{ width: "100%", maxWidth: 860, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", borderRadius: isMobile ? 0 : 22, overflow: "hidden", boxShadow: SHL, border: `1px solid ${BR}`, minHeight: isMobile ? "100dvh" : undefined }}>
          {/* LEFT */}
          <div className="login-left" style={{ background: "linear-gradient(155deg,#1a6b4a,#0d4232)", padding: "48px 40px", display: isMobile ? "none" : "flex", flexDirection: "column", justifyContent: "space-between", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -50, right: -50, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 40 }}>
                <div style={{ width: 44, height: 44, borderRadius: 13, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}><Ico n="tooth" s={21} /></div>
                <div>
                  <div style={{ color: "#fff", fontWeight: 800, fontSize: 15, fontFamily: "Lora,Georgia,serif" }}>Yinlade</div>
                  <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>Dental Clinic · Abuja</div>
                </div>
              </div>
              <h1 style={{ color: "#fff", fontFamily: "Lora,Georgia,serif", fontSize: 28, fontWeight: 700, lineHeight: 1.3, margin: "0 0 12px" }}>Complete patient<br />care, digitally<br />organised.</h1>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, lineHeight: 1.7, margin: 0 }}>Odontograms, treatment notes, billing and appointments — all in one place.</p>
            </div>
            <div>
              <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 11 }}>Quick demo access</div>
              {DEMO.map((d) => (
                <button key={d.email} onClick={() => { setLoginEmail(d.email); setLoginPw(d.password); }}
                  style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 11, padding: "9px 12px", cursor: "pointer", marginBottom: 6, textAlign: "left", transition: "background 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.14)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(255,255,255,0.17)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{d.avatar}</div>
                  <div>
                    <div style={{ color: "#fff", fontSize: 12, fontWeight: 600 }}>{d.name}</div>
                    <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 11 }}>{d.role}</div>
                  </div>
                </button>
              ))}
              <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 5 }}>Click any profile to autofill</div>
            </div>
          </div>
          {/* RIGHT */}
          <div style={{ background: SU, padding: isMobile ? "40px 24px 32px" : "48px 40px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            {isMobile && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, background: `linear-gradient(135deg,${G},${GM})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}><Ico n="tooth" s={18} /></div>
                <div>
                  <div style={{ color: TX, fontWeight: 800, fontSize: 15, fontFamily: "Lora,Georgia,serif" }}>Yinlade</div>
                  <div style={{ color: TL, fontSize: 11 }}>Dental Clinic · Abuja</div>
                </div>
              </div>
            )}
            <h2 style={{ margin: "0 0 4px", color: TX, fontFamily: "Lora,Georgia,serif", fontSize: 24, fontWeight: 700 }}>Welcome back</h2>
            <p style={{ margin: "0 0 26px", color: TL, fontSize: 13 }}>Sign in to your clinic portal</p>
            {loginErr && (
              <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 9, padding: "9px 12px", color: RD, fontSize: 13, marginBottom: 16, display: "flex", alignItems: "center", gap: 7 }}>
                <Ico n="x" s={13} />{loginErr}
              </div>
            )}
            <div style={{ marginBottom: 13 }}>
              <label style={{ display: "block", color: TM, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>Email Address</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: TL }}><Ico n="mail" s={15} /></span>
                <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="you@yinlade.ng" style={{ width: "100%", border: `1.5px solid ${BR}`, borderRadius: 10, padding: "10px 11px 10px 36px", fontSize: 14, color: TX, outline: "none", boxSizing: "border-box", fontFamily: "inherit", background: SA }} />
              </div>
            </div>
            <div style={{ marginBottom: 22 }}>
              <label style={{ display: "block", color: TM, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>Password</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: TL }}><Ico n="lock" s={15} /></span>
                <input type={showPw ? "text" : "password"} value={loginPw} onChange={e => setLoginPw(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === "Enter" ? doLogin() : null} style={{ width: "100%", border: `1.5px solid ${BR}`, borderRadius: 10, padding: "10px 36px 10px 36px", fontSize: 14, color: TX, outline: "none", boxSizing: "border-box", fontFamily: "inherit", background: SA }} />
                <button onClick={() => setShowPw(s => !s)} style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: TL, cursor: "pointer", display: "flex", padding: 2 }}><Ico n={showPw ? "eyeoff" : "eye"} s={15} /></button>
              </div>
            </div>
            <button onClick={doLogin} disabled={loginLoading} style={{ width: "100%", background: loginLoading ? "#94a3b8" : G, color: "#fff", border: "none", borderRadius: 11, padding: 12, fontSize: 14, fontWeight: 700, cursor: loginLoading ? "not-allowed" : "pointer", fontFamily: "inherit", letterSpacing: "0.02em", transition: "background 0.2s" }}>
              {loginLoading ? "Signing in…" : "Sign In →"}
            </button>
            {isMobile && (
              <div style={{ marginTop: 28 }}>
                <div style={{ color: TL, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10, textAlign: "center" }}>Quick demo access</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {DEMO.map((d) => (
                    <button key={d.email} onClick={() => { setLoginEmail(d.email); setLoginPw(d.password); }}
                      style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", background: SA, border: `1px solid ${BR}`, borderRadius: 10, padding: "9px 12px", cursor: "pointer", textAlign: "left" }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg,${G},${GM})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{d.avatar}</div>
                      <div>
                        <div style={{ color: TX, fontSize: 12, fontWeight: 600 }}>{d.name}</div>
                        <div style={{ color: TL, fontSize: 11 }}>{d.role}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            <p style={{ textAlign: "center", color: TL, fontSize: 11, marginTop: 22, lineHeight: 1.8 }}>Yinlade Clinic · Abuja, Nigeria<br />© 2026 · All rights reserved</p>
          </div>
        </div>
      </div>
    );
  }

  const NAV = [
    { id: "dashboard",      icon: "dash",  label: "Dashboard",      ac: G  },
    { id: "patients",       icon: "pts",   label: "Patients",       ac: BL },
    { id: "appointments",   icon: "cal",   label: "Appointments",   ac: BL },
    { id: "billing",        icon: "bill",  label: "Billing",        ac: AM },
    { id: "communications", icon: "msg",   label: "Communications", ac: AM },
    { id: "tasks",          icon: "task",  label: "Tasks",          ac: G  },
  ];
  const cur = NAV.find(n => n.id === tab);

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div style={{ padding: "16px 12px 13px", borderBottom: `1px solid ${BR}`, display: "flex", alignItems: "center", gap: 10, minHeight: 64 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `linear-gradient(135deg,${G},${GM})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0, boxShadow: `0 3px 10px ${G}44` }}>
          <Ico n="tooth" s={17} />
        </div>
        {(!mini || isMobile) && (
          <div>
            <div style={{ color: TX, fontWeight: 800, fontSize: 14, fontFamily: "Lora,Georgia,serif", whiteSpace: "nowrap" }}>Yinlade</div>
            <div style={{ color: TL, fontSize: 11, whiteSpace: "nowrap" }}>Dental Clinic · Abuja</div>
          </div>
        )}
        {isMobile && (
          <button onClick={() => setDrawerOpen(false)} style={{ marginLeft: "auto", background: SA, border: "none", color: TM, cursor: "pointer", padding: 6, borderRadius: 8, display: "flex" }}>
            <Ico n="x" s={16} />
          </button>
        )}
      </div>
      {/* Nav */}
      <nav style={{ flex: 1, padding: "9px 6px", overflowY: "auto" }}>
        {NAV.map(n => {
          const active = tab === n.id;
          return (
            <button key={n.id} onClick={() => { setTab(n.id as any); setDrawerOpen(false); }} title={mini && !isMobile ? n.label : ""}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "10px 9px", borderRadius: 10, background: active ? `${n.ac}15` : "transparent", border: active ? `1.5px solid ${n.ac}30` : "1.5px solid transparent", color: active ? n.ac : TM, cursor: "pointer", marginBottom: 2, textAlign: "left", transition: "all 0.13s", fontFamily: "inherit" }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = SA; e.currentTarget.style.color = TX; } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = TM; } }}>
              <span style={{ flexShrink: 0 }}><Ico n={n.icon} s={18} /></span>
              {(!mini || isMobile) && <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, whiteSpace: "nowrap" }}>{n.label}</span>}
              {(!mini || isMobile) && active && <span style={{ marginLeft: "auto", width: 5, height: 5, borderRadius: "50%", background: n.ac, flexShrink: 0 }} />}
            </button>
          );
        })}
      </nav>
      {/* User menu */}
      <div style={{ padding: "8px 6px 12px", borderTop: `1px solid ${BR}`, position: "relative" }}>
        <div onClick={() => setUsrMenu(m => !m)}
          style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 9px", borderRadius: 10, background: SA, cursor: "pointer" }}
          onMouseEnter={e => e.currentTarget.style.background = BR}
          onMouseLeave={e => e.currentTarget.style.background = SA}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: `linear-gradient(135deg,${G},${GM})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{user.avatar}</div>
          {(!mini || isMobile) && (
            <>
              <div style={{ flex: 1, overflow: "hidden" }}>
                <div style={{ color: TX, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</div>
                <div style={{ color: TL, fontSize: 10 }}>{user.role}</div>
              </div>
              <Ico n="chev" s={12} />
            </>
          )}
        </div>
        {usrMenu && (
          <div style={{ position: "absolute", bottom: 58, left: 6, right: 6, background: SU, border: `1px solid ${BR}`, borderRadius: 11, padding: 5, boxShadow: SHM, zIndex: 100 }}>
            <button onClick={() => { doLogout(); setUsrMenu(false); }}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 11px", background: "none", border: "none", color: RD, cursor: "pointer", borderRadius: 7, fontSize: 13, fontWeight: 600, fontFamily: "inherit" }}
              onMouseEnter={e => e.currentTarget.style.background = RDL}
              onMouseLeave={e => e.currentTarget.style.background = "none"}>
              <Ico n="logout" s={14} /> Sign Out
            </button>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div style={{ display: "flex", height: "100vh", background: BG, overflow: "hidden", fontFamily: "Outfit,Segoe UI,sans-serif" }}>
      {/* Mobile drawer overlay */}
      {isMobile && drawerOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex" }}
          onClick={e => { if (e.target === e.currentTarget) setDrawerOpen(false); }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(14,31,48,0.4)", backdropFilter: "blur(2px)" }} />
          <div className="mobile-drawer" style={{ position: "relative", width: 260, background: SU, display: "flex", flexDirection: "column", boxShadow: SHL, zIndex: 1 }}>
            <SidebarContent />
          </div>
        </div>
      )}
      {/* Desktop Sidebar */}
      <div style={{ width: mini ? 64 : 232, background: SU, borderRight: `1px solid ${BR}`, display: isMobile ? "none" : "flex", flexDirection: "column", transition: "width 0.22s cubic-bezier(.4,0,.2,1)", overflow: "hidden", flexShrink: 0, boxShadow: "2px 0 10px rgba(14,31,48,0.05)" }}>
        <SidebarContent />
      </div>

      {/* Main */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {/* Topbar */}
        <div style={{ background: SU, borderBottom: `1px solid ${BR}`, padding: isMobile ? "10px 16px" : "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, boxShadow: "0 1px 4px rgba(14,31,48,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => isMobile ? setDrawerOpen(true) : setMini(m => !m)} style={{ background: SA, border: "none", color: TM, cursor: "pointer", padding: 7, borderRadius: 8, display: "flex" }}
              onMouseEnter={e => e.currentTarget.style.background = BR}
              onMouseLeave={e => e.currentTarget.style.background = SA}>
              <Ico n="menu" s={16} />
            </button>
            {isMobile && (
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: `linear-gradient(135deg,${G},${GM})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}><Ico n="tooth" s={13} /></div>
                <span style={{ color: TX, fontWeight: 800, fontSize: 13, fontFamily: "Lora,Georgia,serif" }}>Yinlade</span>
              </div>
            )}
            {!isMobile && <div style={{ color: TX, fontWeight: 700, fontSize: 15, fontFamily: "Lora,Georgia,serif" }}>{cur?.label}</div>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 7 : 11 }}>
            <div style={{ background: GL, border: `1px solid ${G}30`, borderRadius: 20, padding: "4px 10px", color: G, fontSize: isMobile ? 11 : 12, fontWeight: 700 }}>🟢 {isMobile ? "Open" : "Clinic Open"}</div>
            {!isMobile && <div style={{ color: TL, fontSize: 12 }}>{new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</div>}
          </div>
        </div>
        {/* Mobile: page title bar */}
        {isMobile && (
          <div style={{ background: SA, borderBottom: `1px solid ${BR}`, padding: "8px 16px" }}>
            <div style={{ color: TX, fontWeight: 700, fontSize: 14, fontFamily: "Lora,Georgia,serif" }}>{cur?.label}</div>
          </div>
        )}
        <div className="main-content" style={{ flex: 1, overflow: "auto", padding: isMobile ? "14px 14px" : 22, paddingBottom: isMobile ? 80 : 22 }}>

        {tab === "dashboard" && (() => {
          const today = todayYMD();
          const todayAppts = appts.filter(a => a.date === today);
          const pending = tasks.filter(t => !t.done);
          const hr = new Date().getHours();
          const greetMsg = hr < 12 ? "Good morning" : hr < 17 ? "Good afternoon" : "Good evening";
          return (
            <div>
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ margin: "0 0 3px", color: TX, fontSize: 24, fontFamily: "Lora,Georgia,serif", fontWeight: 700 }}>{greetMsg}, {user.name.split(" ")[0]} 👋</h2>
                <p style={{ margin: 0, color: TL, fontSize: 13 }}>{new Date().toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} · Yinlade Clinic, Abuja</p>
              </div>
              <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: isMobile ? 10 : 13, marginBottom: 24 }}>
                <StatCard label="Today's Appts" value={todayAppts.length} sub={`${todayAppts.filter(a => a.status === "confirmed").length} confirmed`} icon="cal" ac={G} acBg={GL} />
                <StatCard label="Total Patients" value={patients.length} sub={`${patients.filter(p => p.status === "active").length} active`} icon="pts" ac={BL} acBg={BLL} />
                <StatCard label="Outstanding" value={money(owedTotal)} sub="Across all patients" icon="bill" ac={AM} acBg={AML} />
                <StatCard label="This Month Revenue" value={money(marchRevenue)} sub="Collected this month" icon="bar" ac={PU} acBg={PUL} />
                <StatCard label="Pending Tasks" value={pending.length} sub={`${pending.filter(t => t.priority === "high").length} high priority`} icon="task" ac={RD} acBg={RDL} />
              </div>
              <div className="widgets-grid" style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
                <div style={{ background: SU, border: `1px solid ${BR}`, borderRadius: 14, padding: 20, boxShadow: SH }}>
                  <div style={{ fontSize: 11, color: TM, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: 14 }}>Upcoming Appointments</div>
                  {appts.filter(a => a.date > today && a.status !== "completed").slice(0, 5).map(a => (
                    <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 0", borderBottom: `1px solid ${BR}` }}>
                      <div style={{ background: GL, borderRadius: 9, padding: "7px 9px", textAlign: "center", minWidth: 46, flexShrink: 0 }}>
                        <div style={{ color: G, fontSize: 16, fontWeight: 800, lineHeight: 1, fontFamily: "Lora,Georgia,serif" }}>{a.date.split("-")[2]}</div>
                        <div style={{ color: GM, fontSize: 9, textTransform: "uppercase", fontWeight: 600 }}>{MON(a.date)}</div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: TX, fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.pname}</div>
                        <div style={{ color: TL, fontSize: 11 }}>{a.type} · {a.time}</div>
                      </div>
                      <Bdg label={a.status} color={a.status === "confirmed" ? "green" : a.status === "completed" ? "blue" : "yellow"} />
                    </div>
                  ))}
                  {appts.filter(a => a.date > today && a.status !== "completed").length === 0 && <p style={{ color: TL, fontSize: 13, margin: 0 }}>No upcoming appointments</p>}
                </div>
                <div style={{ background: SU, border: `1px solid ${BR}`, borderRadius: 14, padding: 20, boxShadow: SH }}>
                  <div style={{ fontSize: 11, color: TM, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: 14 }}>Clinic Tasks</div>
                  {tasks.filter(t => !t.done).slice(0, 5).map(t => (
                    <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: `1px solid ${BR}` }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: t.priority === "high" ? RD : t.priority === "medium" ? AM : GM, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ color: TX, fontSize: 13, fontWeight: 500 }}>{t.title}</div>
                        <div style={{ color: TL, fontSize: 11 }}>Due {t.due} · {t.who}</div>
                      </div>
                      <Bdg label={t.priority} color={t.priority === "high" ? "red" : t.priority === "medium" ? "yellow" : "green"} />
                    </div>
                  ))}
                  {tasks.filter(t => !t.done).length === 0 && <p style={{ color: TL, fontSize: 13, margin: 0 }}>All tasks complete 🎉</p>}
                </div>
              </div>
            </div>
          );
        })()}

        {tab === "patients" && (
          <div>
            {!currentPatient ? (
              <>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                  <h2 style={{ margin: 0, color: TX, fontFamily: "Lora,Georgia,serif", fontSize: 24, fontWeight: 700 }}>Patient Records</h2>
                  <Btn variant="primary" icon="plus" onClick={() => { setPatientForm({ status: "active", allergies: "None", blood: "O+", gender: "Female", smoker: "No", alcohol: "None" }); setPatientModal("add"); }} disabled={user.role !== "Dentist" && user.role !== "Admin"}>Add Patient</Btn>
                </div>

                {/* Search + filters row */}
                <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
                  <div style={{ position: "relative", flex: "1 1 220px", minWidth: 180 }}>
                    <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: TL }}><Ico n="search" s={15} /></span>
                    <input value={patientQueryRaw} onChange={e => setPatientQueryRaw(e.target.value)} placeholder="Search by name, phone or ID…"
                      style={{ width: "100%", background: SU, border: `1.5px solid ${BR}`, borderRadius: 10, color: TX, padding: "9px 11px 9px 36px", fontSize: 14, outline: "none", boxSizing: "border-box" as const, fontFamily: "inherit", boxShadow: SH }} />
                  </div>
                  {/* Status filter */}
                  <div style={{ display: "flex", gap: 4 }}>
                    {(["all","active","inactive"] as const).map(v => (
                      <button key={v} onClick={() => setPatientStatusFilter(v)}
                        style={{ background: patientStatusFilter === v ? G : SU, color: patientStatusFilter === v ? "#fff" : TM, border: `1.5px solid ${patientStatusFilter === v ? G : BR}`, borderRadius: 8, padding: "7px 13px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize" }}>{v}</button>
                    ))}
                  </div>
                  {/* Sort */}
                  <select value={`${patientSortBy}-${patientSortDir}`} onChange={e => { const [by, dir] = e.target.value.split("-"); setPatientSortBy(by as any); setPatientSortDir(dir as any); }}
                    style={{ background: SU, border: `1.5px solid ${BR}`, borderRadius: 8, color: TX, padding: "7px 11px", fontSize: 12, outline: "none", fontFamily: "inherit", cursor: "pointer" }}>
                    <option value="name-asc">Name A→Z</option>
                    <option value="name-desc">Name Z→A</option>
                    <option value="lastVisit-desc">Last Visit (newest)</option>
                    <option value="lastVisit-asc">Last Visit (oldest)</option>
                    <option value="balance-desc">Balance (highest)</option>
                    <option value="balance-asc">Balance (lowest)</option>
                  </select>
                </div>

                {/* Table */}
                <div className="patient-table-wrap" style={{ background: SU, border: `1px solid ${BR}`, borderRadius: 14, overflow: "hidden", boxShadow: SH }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: isMobile ? 640 : undefined }}>
                    <thead>
                      <tr style={{ background: SA, borderBottom: `1.5px solid ${BR}` }}>
                        {["ID", "Patient", "Phone", "Age", "Last Visit", "Balance", "Status", ""].map(h => (
                          <th key={h} style={{ textAlign: "left", padding: "10px 14px", color: TM, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedPatients.map(p => (
                        <tr key={p.id} style={{ borderBottom: `1px solid ${BR}`, cursor: "pointer", transition: "background 0.1s" }}
                          onMouseEnter={e => e.currentTarget.style.background = SA}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                          onClick={() => setOpenPatientId(p.id)}>
                          <td style={{ padding: "12px 14px", color: TL, fontSize: 12, fontFamily: "monospace", fontWeight: 600 }}>{p.id}</td>
                          <td style={{ padding: "12px 14px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                              <div style={{ width: 30, height: 30, borderRadius: "50%", background: `linear-gradient(135deg,${G},${GM})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 10, flexShrink: 0 }}>
                                {p.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("")}
                              </div>
                              <div>
                                <div style={{ color: TX, fontWeight: 700, fontSize: 13 }}>{p.name}</div>
                                <div style={{ color: TL, fontSize: 11 }}>{p.email}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "12px 14px", color: TM, fontSize: 13 }} onClick={e => e.stopPropagation()}>{p.phone}</td>
                          <td style={{ padding: "12px 14px", color: TM, fontSize: 13 }}>{ageFromDob(p.dob) || "—"} yrs</td>
                          <td style={{ padding: "12px 14px", color: TM, fontSize: 13 }}>{p.lastVisit || "—"}</td>
                          <td style={{ padding: "12px 14px", color: p.balance > 0 ? AM : G, fontWeight: 700, fontSize: 13 }}>{money(p.balance)}</td>
                          <td style={{ padding: "12px 14px" }}><Bdg label={p.status} color={p.status === "active" ? "green" : "gray"} /></td>
                          <td style={{ padding: "12px 14px" }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: "flex", gap: 4 }}>
                              <Btn onClick={() => setOpenPatientId(p.id)} sz="sm" icon="file">Record</Btn>
                              <button onClick={() => { if (user.role !== "Dentist" && user.role !== "Admin") return; setPatientForm({ ...p }); setPatientModal("edit"); }}
                                style={{ background: "none", border: "none", color: TM, cursor: "pointer", padding: 5, borderRadius: 6, display: "flex" }}
                                onMouseEnter={e => e.currentTarget.style.background = SA} onMouseLeave={e => e.currentTarget.style.background = "none"}><Ico n="edit" s={13} /></button>
                              <button onClick={() => deletePatient(p.id)}
                                style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: 5, borderRadius: 6, display: "flex" }}
                                onMouseEnter={e => e.currentTarget.style.background = "#fee2e2"} onMouseLeave={e => e.currentTarget.style.background = "none"}><Ico n="del" s={13} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {paginatedPatients.length === 0 && <tr><td colSpan={8} style={{ padding: 36, textAlign: "center", color: TL }}>No patients found</td></tr>}
                    </tbody>
                  </table>
                </div>

                {/* Pagination + count */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, flexWrap: "wrap", gap: 8 }}>
                  <p style={{ color: TL, fontSize: 12, margin: 0 }}>
                    💡 Click any row to open the full clinical record. &nbsp;·&nbsp; Showing {Math.min((patientPage - 1) * PATIENT_PAGE_SIZE + 1, filteredPatients.length)}–{Math.min(patientPage * PATIENT_PAGE_SIZE, filteredPatients.length)} of {filteredPatients.length} patients
                  </p>
                  {patientPageCount > 1 && (
                    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                      <button onClick={() => setPatientPage(p => Math.max(1, p - 1))} disabled={patientPage === 1}
                        style={{ background: patientPage === 1 ? SA : SU, border: `1px solid ${BR}`, borderRadius: 8, padding: "5px 11px", cursor: patientPage === 1 ? "default" : "pointer", color: patientPage === 1 ? TL : TX, fontWeight: 600, fontFamily: "inherit" }}>← Prev</button>
                      {Array.from({ length: patientPageCount }, (_, i) => i + 1).filter(n => n === 1 || n === patientPageCount || Math.abs(n - patientPage) <= 1).reduce<(number|string)[]>((acc, n, idx, arr) => {
                        if (idx > 0 && (n as number) - (arr[idx-1] as number) > 1) acc.push("…");
                        acc.push(n);
                        return acc;
                      }, []).map((n, i) => typeof n === "string"
                        ? <span key={i} style={{ padding: "5px 8px", color: TL }}>…</span>
                        : <button key={n} onClick={() => setPatientPage(n as number)}
                            style={{ background: patientPage === n ? G : SU, color: patientPage === n ? "#fff" : TX, border: `1px solid ${patientPage === n ? G : BR}`, borderRadius: 8, padding: "5px 11px", cursor: "pointer", fontWeight: 600, fontFamily: "inherit" }}>{n}</button>
                      )}
                      <button onClick={() => setPatientPage(p => Math.min(patientPageCount, p + 1))} disabled={patientPage === patientPageCount}
                        style={{ background: patientPage === patientPageCount ? SA : SU, border: `1px solid ${BR}`, borderRadius: 8, padding: "5px 11px", cursor: patientPage === patientPageCount ? "default" : "pointer", color: patientPage === patientPageCount ? TL : TX, fontWeight: 600, fontFamily: "inherit" }}>Next →</button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <ClinicalRecordView
                patient={currentPatient}
                record={
                  clinical[currentPatient.id] || {
                    odontogram: {},
                    complaint: "",
                    bp: "",
                    pulse: "",
                    temp: "",
                    resp: "",
                    extraOral: "",
                    intraOral: "",
                    occlusion: "",
                    notes: [],
                  }
                }
                onBack={() => setOpenPatientId(null)}
                user={user}
                onSave={saveClinical}
              />
            )}

            {patientModal && (
              <Modal title={patientModal === "add" ? "Register New Patient" : "Edit Patient"} mw={760} onClose={() => setPatientModal(null)}>
                <div className="form-grid-2" style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
                  <Field label="Full Name">
                    <input style={inputStyle} value={patientForm.name || ""} onChange={(e) => setPatientForm((p: any) => ({ ...p, name: e.target.value }))} />
                  </Field>
                  <Field label="Date of Birth">
                    <input style={inputStyle} type="date" value={patientForm.dob || ""} onChange={(e) => setPatientForm((p: any) => ({ ...p, dob: e.target.value }))} />
                  </Field>
                  <Field label="Gender">
                    <select style={inputStyle} value={patientForm.gender || "Female"} onChange={(e) => setPatientForm((p: any) => ({ ...p, gender: e.target.value }))}>
                      {["Female", "Male", "Other"].map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Phone Number">
                    <input style={inputStyle} value={patientForm.phone || ""} onChange={(e) => setPatientForm((p: any) => ({ ...p, phone: e.target.value }))} />
                  </Field>
                  <Field label="Email Address">
                    <input style={inputStyle} type="email" value={patientForm.email || ""} onChange={(e) => setPatientForm((p: any) => ({ ...p, email: e.target.value }))} />
                  </Field>
                  <Field label="Occupation">
                    <input style={inputStyle} value={patientForm.job || ""} onChange={(e) => setPatientForm((p: any) => ({ ...p, job: e.target.value }))} />
                  </Field>
                  <Field label="Address">
                    <input style={inputStyle} value={patientForm.address || ""} onChange={(e) => setPatientForm((p: any) => ({ ...p, address: e.target.value }))} />
                  </Field>
                  <Field label="Blood Group">
                    <select style={inputStyle} value={patientForm.blood || "O+"} onChange={(e) => setPatientForm((p: any) => ({ ...p, blood: e.target.value }))}>
                      {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Known Allergies">
                    <input style={inputStyle} value={patientForm.allergies || ""} onChange={(e) => setPatientForm((p: any) => ({ ...p, allergies: e.target.value }))} />
                  </Field>
                  <Field label="Medical History">
                    <input style={inputStyle} value={patientForm.medical || ""} onChange={(e) => setPatientForm((p: any) => ({ ...p, medical: e.target.value }))} placeholder="e.g. Hypertension, Diabetes" />
                  </Field>
                  <Field label="Smoker">
                    <select style={inputStyle} value={patientForm.smoker || "No"} onChange={(e) => setPatientForm((p: any) => ({ ...p, smoker: e.target.value }))}>
                      {["No", "Yes"].map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Alcohol">
                    <select style={inputStyle} value={patientForm.alcohol || "None"} onChange={(e) => setPatientForm((p: any) => ({ ...p, alcohol: e.target.value }))}>
                      {["None", "Occasional", "Social", "Regular"].map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Status">
                    <select style={inputStyle} value={patientForm.status || "active"} onChange={(e) => setPatientForm((p: any) => ({ ...p, status: e.target.value }))}>
                      {["active", "inactive"].map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
                  <Btn variant="ghost" onClick={() => setPatientModal(null)}>
                    Cancel
                  </Btn>
                  <Btn
                    variant="primary"
                    onClick={savePatient}
                    disabled={user.role !== "Dentist" && user.role !== "Admin"}
                  >
                    Save Patient
                  </Btn>
                </div>
              </Modal>
            )}
          </div>
        )}

        {tab === "appointments" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
              <div style={{ color: TX, fontWeight: 900, fontSize: 20 }}>Appointments</div>
              <Btn
                variant="accent"
                onClick={() => {
                  setApptForm({ patientId: patients[0]?.id || "", type: "Cleaning", date: todayYMD(), time: "10:00", dentistId: dentists[0]?.id || "", status: "pending", notes: "" });
                  setApptModal(true);
                }}
              >
                Book
              </Btn>
            </div>

            {/* Status filter pills */}
            <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
              {(["all", "pending", "confirmed", "completed", "cancelled"] as const).map((f) => (
                <button key={f} onClick={() => setApptFilter(f as any)} style={{ padding: "7px 14px", borderRadius: 20, border: `1.5px solid ${apptFilter === f ? G : BR}`, background: apptFilter === f ? GL : SU, color: apptFilter === f ? G : TM, fontWeight: 900, cursor: "pointer", fontSize: 12, textTransform: "capitalize", fontFamily: "inherit" }}>
                  {f}
                </button>
              ))}
            </div>

            {/* Date / type / sort filters */}
            <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: TL, fontSize: 12 }}>From</span>
                <input type="date" value={apptDateFrom} onChange={e => setApptDateFrom(e.target.value)}
                  style={{ border: `1.5px solid ${BR}`, borderRadius: 8, padding: "6px 10px", fontSize: 12, color: TX, outline: "none", fontFamily: "inherit", background: SU }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: TL, fontSize: 12 }}>To</span>
                <input type="date" value={apptDateTo} onChange={e => setApptDateTo(e.target.value)}
                  style={{ border: `1.5px solid ${BR}`, borderRadius: 8, padding: "6px 10px", fontSize: 12, color: TX, outline: "none", fontFamily: "inherit", background: SU }} />
              </div>
              <select value={apptTypeFilter} onChange={e => setApptTypeFilter(e.target.value)}
                style={{ border: `1.5px solid ${BR}`, borderRadius: 8, padding: "6px 10px", fontSize: 12, color: TX, outline: "none", fontFamily: "inherit", background: SU }}>
                <option value="">All treatments</option>
                {TREATMENTS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <button onClick={() => setApptSortDir(d => d === "asc" ? "desc" : "asc")}
                style={{ border: `1.5px solid ${BR}`, borderRadius: 8, padding: "6px 12px", fontSize: 12, color: TM, background: SU, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
                Date {apptSortDir === "asc" ? "↑" : "↓"}
              </button>
              {(apptDateFrom || apptDateTo || apptTypeFilter) && (
                <button onClick={() => { setApptDateFrom(""); setApptDateTo(""); setApptTypeFilter(""); }}
                  style={{ border: `1.5px solid ${RD}44`, borderRadius: 8, padding: "6px 12px", fontSize: 12, color: RD, background: RDL, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
                  Clear filters
                </button>
              )}
            </div>

            {(() => {
              const filtered = appts
                .filter(a => apptFilter === "all" || a.status === apptFilter)
                .filter(a => !apptDateFrom || a.date >= apptDateFrom)
                .filter(a => !apptDateTo || a.date <= apptDateTo)
                .filter(a => !apptTypeFilter || a.type === apptTypeFilter)
                .sort((a, b) => {
                  const cmp = (a.date + a.time).localeCompare(b.date + b.time);
                  return apptSortDir === "asc" ? cmp : -cmp;
                });
              return (
                <>
                  <p style={{ color: TL, fontSize: 12, marginBottom: 12 }}>{filtered.length} appointment{filtered.length !== 1 ? "s" : ""}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {filtered.map((a) => (
                  <div key={a.id} style={{ background: SU, border: `1px solid ${BR}`, borderRadius: 16, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14, boxShadow: SH }}>
                    {/* Calendar date box */}
                    <div style={{ minWidth: 52, height: 56, borderRadius: 12, background: GL, border: `1.5px solid ${G}33`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <div style={{ color: G, fontWeight: 900, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>{MON(a.date)}</div>
                      <div style={{ color: TX, fontWeight: 900, fontSize: 20, lineHeight: 1.1 }}>{new Date(a.date + "T12:00").getDate()}</div>
                    </div>
                    {/* Main info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ color: TX, fontWeight: 900, fontSize: 15 }}>{a.pname}</span>
                        <Bdg label={a.status} color={a.status === "confirmed" ? "green" : a.status === "completed" ? "blue" : a.status === "pending" ? "yellow" : "red"} />
                      </div>
                      <div style={{ color: TM, fontWeight: 800, fontSize: 12, marginTop: 3 }}>{a.type} · {a.time} · {a.dentist}</div>
                    </div>
                    {/* Action buttons */}
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      {a.status === "pending" && (
                        <button
                          onClick={async () => {
                            await fetch(`/api/appointments/${a.id}`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "confirmed" }) });
                            await refresh();
                          }}
                          style={{ padding: "6px 14px", borderRadius: 10, border: `1.5px solid ${G}`, background: GL, color: G, fontWeight: 900, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
                        >
                          Confirm
                        </button>
                      )}
                      {a.status === "confirmed" && (
                        <button
                          onClick={async () => {
                            await fetch(`/api/appointments/${a.id}`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "completed" }) });
                            await refresh();
                          }}
                          style={{ padding: "6px 14px", borderRadius: 10, border: `1.5px solid ${BL}`, background: BLL, color: BL, fontWeight: 900, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
                        >
                          Complete
                        </button>
                      )}
                      <button
                        onClick={async () => {
                          if (!confirm("Delete appointment?")) return;
                          await fetch(`/api/appointments/${a.id}`, { method: "DELETE", credentials: "include" });
                          await refresh();
                        }}
                        style={{ padding: "6px 10px", borderRadius: 10, border: `1.5px solid ${RD}33`, background: RDL, color: RD, fontWeight: 900, fontSize: 12, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4 }}
                      >
                        <Ico n="del" s={13} /> Delete
                      </button>
                    </div>
                  </div>
                ))}
                {filtered.length === 0 && (
                  <div style={{ padding: 48, textAlign: "center", color: TM, fontWeight: 900, background: SU, borderRadius: 16, border: `1px solid ${BR}` }}>No appointments found</div>
                )}
              </div>
            </>
          );
        })()}

            {apptModal && (
              <Modal title="Book Appointment" mw={720} onClose={() => setApptModal(false)}>
                <div className="form-grid-2" style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
                  <Field label="Patient">
                    <select style={inputStyle} value={apptForm.patientId || ""} onChange={(e) => setApptForm((p: any) => ({ ...p, patientId: e.target.value }))}>
                      <option value="">Select...</option>
                      {patients.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Treatment Type">
                    <select style={inputStyle} value={apptForm.type || ""} onChange={(e) => setApptForm((p: any) => ({ ...p, type: e.target.value }))}>
                      {TREATMENTS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Date">
                    <input style={inputStyle} type="date" value={apptForm.date || todayYMD()} onChange={(e) => setApptForm((p: any) => ({ ...p, date: e.target.value }))} />
                  </Field>
                  <Field label="Time">
                    <input style={inputStyle} type="time" value={apptForm.time || "10:00"} onChange={(e) => setApptForm((p: any) => ({ ...p, time: e.target.value }))} />
                  </Field>
                  <Field label="Dentist">
                    <select style={inputStyle} value={apptForm.dentistId || ""} onChange={(e) => setApptForm((p: any) => ({ ...p, dentistId: e.target.value }))}>
                      {dentists.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                <Field label="Notes">
                  <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 90 }} value={apptForm.notes || ""} onChange={(e) => setApptForm((p: any) => ({ ...p, notes: e.target.value }))} />
                </Field>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
                  <Btn variant="ghost" onClick={() => setApptModal(false)}>
                    Cancel
                  </Btn>
                  <Btn
                    variant="accent"
                    onClick={async () => {
                      if (!apptForm.patientId || !apptForm.type || !apptForm.date || !apptForm.time) return;
                      await fetch("/api/appointments", {
                        method: "POST",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          patientId: apptForm.patientId,
                          type: apptForm.type,
                          date: apptForm.date,
                          time: apptForm.time,
                          dentistId: apptForm.dentistId,
                          status: "pending",
                          notes: apptForm.notes || "",
                        }),
                      });
                      setApptModal(false);
                      await refresh();
                    }}
                  >
                    Book
                  </Btn>
                </div>
              </Modal>
            )}
          </div>
        )}

        {tab === "billing" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
              <div style={{ color: TX, fontWeight: 900, fontSize: 20 }}>Billing & Invoices</div>
              <Btn
                variant="warn"
                onClick={() => {
                  setInvoiceForm({ pid: patients[0]?.id || "", items: [{ d: "", a: "" }] });
                  setInvoiceModal(true);
                }}
              >
                New Invoice
              </Btn>
            </div>

            <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr auto", gap: isMobile ? 10 : 14, marginBottom: 18 }}>
              <StatCard icon="bill" label="Total Collected" value={money(invoices.reduce((s, i) => s + i.paid, 0))} sub={`${invoices.filter(i => i.status === "paid").length} paid invoices`} ac={G} acBg={GL} />
              <StatCard icon="pulse" label="Outstanding" value={money(invoices.reduce((s, i) => s + (i.total - i.paid), 0))} sub={`${invoices.filter(i => i.status !== "paid").length} unpaid`} ac={AM} acBg={AML} />
            </div>

            {/* Billing filters */}
            <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ position: "relative", flex: "1 1 160px", minWidth: 140 }}>
                <span style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: TL, pointerEvents: "none" }}><Ico n="search" s={13} /></span>
                <input placeholder="Search patient…" value={billPatientQ} onChange={e => setBillPatientQ(e.target.value)}
                  style={{ width: "100%", border: `1.5px solid ${BR}`, borderRadius: 8, padding: "7px 10px 7px 28px", fontSize: 12, color: TX, outline: "none", fontFamily: "inherit", background: SU, boxSizing: "border-box" }} />
              </div>
              <select value={billStatusFilter} onChange={e => setBillStatusFilter(e.target.value as any)}
                style={{ border: `1.5px solid ${BR}`, borderRadius: 8, padding: "7px 10px", fontSize: 12, color: TX, outline: "none", fontFamily: "inherit", background: SU }}>
                <option value="all">All statuses</option>
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="unpaid">Unpaid</option>
              </select>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: TL, fontSize: 12 }}>From</span>
                <input type="date" value={billDateFrom} onChange={e => setBillDateFrom(e.target.value)}
                  style={{ border: `1.5px solid ${BR}`, borderRadius: 8, padding: "6px 10px", fontSize: 12, color: TX, outline: "none", fontFamily: "inherit", background: SU }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: TL, fontSize: 12 }}>To</span>
                <input type="date" value={billDateTo} onChange={e => setBillDateTo(e.target.value)}
                  style={{ border: `1.5px solid ${BR}`, borderRadius: 8, padding: "6px 10px", fontSize: 12, color: TX, outline: "none", fontFamily: "inherit", background: SU }} />
              </div>
              <select value={`${billSortBy}-${billSortDir}`} onChange={e => { const [by, dir] = e.target.value.split("-"); setBillSortBy(by as any); setBillSortDir(dir as any); }}
                style={{ border: `1.5px solid ${BR}`, borderRadius: 8, padding: "7px 10px", fontSize: 12, color: TX, outline: "none", fontFamily: "inherit", background: SU }}>
                <option value="date-desc">Date (newest)</option>
                <option value="date-asc">Date (oldest)</option>
                <option value="total-desc">Total (high)</option>
                <option value="total-asc">Total (low)</option>
                <option value="balance-desc">Balance (high)</option>
                <option value="balance-asc">Balance (low)</option>
              </select>
            </div>

            {(() => {
              const q = billPatientQ.trim().toLowerCase();
              const filteredInvoices = invoices
                .filter(i => !q || i.pname.toLowerCase().includes(q))
                .filter(i => billStatusFilter === "all" || i.status === billStatusFilter)
                .filter(i => !billDateFrom || i.date >= billDateFrom)
                .filter(i => !billDateTo || i.date <= billDateTo)
                .sort((a, b) => {
                  let cmp = 0;
                  if (billSortBy === "date") cmp = a.date.localeCompare(b.date);
                  else if (billSortBy === "total") cmp = a.total - b.total;
                  else if (billSortBy === "balance") cmp = (a.total - a.paid) - (b.total - b.paid);
                  return billSortDir === "asc" ? cmp : -cmp;
                });
              return (
                <>
                  <p style={{ color: TL, fontSize: 12, marginBottom: 10 }}>{filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? "s" : ""}</p>
                  <div className="table-scroll" style={{ background: SU, border: `1px solid ${BR}`, borderRadius: 14, overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 660 }}>
                      <thead>
                        <tr style={{ background: SA }}>
                          {["Invoice", "Patient", "Date", "Total", "Paid", "Balance", "Status", "Actions"].map((h) => (
                            <th key={h} style={{ textAlign: "left", padding: "12px 14px", color: TM, fontSize: 11, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredInvoices.map((inv) => (
                          <tr key={inv.id} style={{ borderBottom: `1px solid ${BR}` }}>
                            <td style={tdStyle}>{inv.id}</td>
                            <td style={tdStyle}><div style={{ color: TX, fontWeight: 900 }}>{inv.pname}</div></td>
                            <td style={tdStyle}>{inv.date}</td>
                            <td style={tdStyle}>{money(inv.total)}</td>
                            <td style={tdStyle}>{money(inv.paid)}</td>
                            <td style={tdStyle}>{money(inv.total - inv.paid)}</td>
                            <td style={tdStyle}>
                              <Bdg label={inv.status} color={inv.status === "paid" ? "green" : inv.status === "partial" ? "yellow" : "red"} />
                            </td>
                            <td style={tdStyle}>
                              <div style={{ display: "flex", gap: 6 }}>
                                {inv.status !== "paid" && (
                                  <Btn variant="ghost" sz="sm" onClick={() => { setPayModal(inv); setPayAmt(""); }}>Pay</Btn>
                                )}
                                <button onClick={() => printInvoicePDF(inv)}
                                  style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 8, border: `1.5px solid ${BL}33`, background: BLL, color: BL, fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
                                  <Ico n="file" s={12} /> PDF
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredInvoices.length === 0 && <tr><td colSpan={8} style={{ padding: 32, textAlign: "center", color: TM, fontWeight: 900 }}>No invoices found</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </>
              );
            })()}

            {invoiceModal && (
              <Modal title="Create Invoice" mw={820} onClose={() => setInvoiceModal(false)}>
                <div className="form-grid-2" style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
                  <Field label="Patient">
                    <select style={inputStyle} value={invoiceForm.patientId || invoiceForm.pid || ""} onChange={(e) => setInvoiceForm((p: any) => ({ ...p, patientId: e.target.value }))}>
                      <option value="">Select...</option>
                      {patients.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: TM, fontWeight: 900, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>Line Items</div>
                      <div style={{ color: TM, fontWeight: 800, fontSize: 12 }}>Add description + amount</div>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
                  {invoiceForm.items.map((it: any, idx: number) => (
                    <div key={idx} style={{ display: "flex", gap: 10 }}>
                      <input
                        style={{ ...inputStyle, flex: 2 }}
                        value={it.d}
                        placeholder="Description"
                        onChange={(e) =>
                          setInvoiceForm((p: any) => ({
                            ...p,
                            items: p.items.map((x: any, i: number) => (i === idx ? { ...x, d: e.target.value } : x)),
                          }))
                        }
                      />
                      <input
                        style={{ ...inputStyle, flex: 1 }}
                        type="number"
                        value={it.a}
                        placeholder="₦ Amount"
                        onChange={(e) =>
                          setInvoiceForm((p: any) => ({
                            ...p,
                            items: p.items.map((x: any, i: number) => (i === idx ? { ...x, a: e.target.value } : x)),
                          }))
                        }
                      />
                    </div>
                  ))}
                  <button
                    onClick={() => setInvoiceForm((p: any) => ({ ...p, items: [...p.items, { d: "", a: "" }] }))}
                    style={{ background: "transparent", border: `1.5px dashed ${BR}`, borderRadius: 10, padding: "10px 12px", cursor: "pointer", fontWeight: 900, color: TM }}
                  >
                    + Add Item
                  </button>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 14, padding: "10px 12px", background: GL, borderRadius: 12, border: `1px solid ${BR}` }}>
                  <div style={{ fontWeight: 900, color: TM }}>Total</div>
                  <div style={{ color: G, fontWeight: 900, fontSize: 18 }}>
                    {money(
                      (invoiceForm.items || []).reduce((s: number, it: any) => s + parseNumberInput(it.a), 0)
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 14 }}>
                  <Btn variant="ghost" onClick={() => setInvoiceModal(false)}>
                    Cancel
                  </Btn>
                  <Btn
                    variant="warn"
                    onClick={async () => {
                      const patientId = invoiceForm.patientId || invoiceForm.pid;
                      const items = (invoiceForm.items || []).filter((x: any) => x.d && x.a);
                      if (!patientId || items.length === 0) return;
                      await fetch("/api/invoices", {
                        method: "POST",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          patientId,
                          date: todayYMD(),
                          items: items.map((x: any) => ({ d: x.d, a: x.a })),
                        }),
                      });
                      setInvoiceModal(false);
                      await refresh();
                    }}
                  >
                    Create Invoice
                  </Btn>
                </div>
              </Modal>
            )}

            {payModal && (
              <Modal title="Record Payment" mw={520} onClose={() => setPayModal(null)}>
                <div style={{ background: GL, borderRadius: 14, padding: 12, border: `1px solid ${BR}`, marginBottom: 12 }}>
                  <div style={{ fontWeight: 900, color: TX }}>{payModal.id} · {payModal.pname}</div>
                  <div style={{ fontWeight: 900, color: TM, marginTop: 4 }}>
                    Outstanding: {money(payModal.total - payModal.paid)}
                  </div>
                </div>
                <Field label="Payment Amount (₦)">
                  <input style={inputStyle} type="number" value={payAmt} onChange={(e) => setPayAmt(e.target.value)} />
                </Field>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                  <Btn variant="ghost" onClick={() => setPayModal(null)}>
                    Cancel
                  </Btn>
                  <Btn
                    variant="warn"
                    onClick={async () => {
                      const amount = Number(payAmt);
                      if (!amount || amount <= 0) return;
                      if (!confirm(`Record payment of ₦${amount.toLocaleString("en-NG")}?`)) return;
                      await fetch(`/api/invoices/${payModal.id}/payments`, {
                        method: "POST",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ amount }),
                      });
                      setPayModal(null);
                      await refresh();
                    }}
                  >
                    Record Payment
                  </Btn>
                </div>
              </Modal>
            )}
          </div>
        )}

        {tab === "tasks" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 6, flexWrap: "wrap" }}>
              <div>
                <h2 style={{ margin: "0 0 2px", color: TX, fontFamily: "Lora,Georgia,serif", fontSize: 24, fontWeight: 700 }}>Day-to-Day Tasks</h2>
                <p style={{ margin: 0, color: TL, fontSize: 12 }}>{tasks.filter((t) => t.done).length} of {tasks.length} completed</p>
              </div>
              <Btn
                variant="primary"
                icon="plus"
                onClick={() => {
                  setTaskForm({ title: "", priority: "medium", due: todayYMD(), assignedToId: staff.find((s) => s.role === "Nurse")?.id || staff[0]?.id || null });
                  setTaskModal(true);
                }}
              >
                Add Task
              </Btn>
            </div>

            <div style={{ background: BR, borderRadius: 99, height: 5, margin: "14px 0 18px", overflow: "hidden" }}>
              <div style={{ background: `linear-gradient(90deg,${G},${GM})`, height: "100%", width: tasks.length ? `${tasks.filter(t => t.done).length / tasks.length * 100}%` : "0%", borderRadius: 99, transition: "width 0.4s" }} />
            </div>

            <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
              {([["all", "All"], ["pending", "Pending"], ["done", "Done"]] as const).map(([v, l]) => (
                <button key={v} onClick={() => setTaskFilter(v as any)} style={{ background: taskFilter === v ? G : SU, color: taskFilter === v ? "#fff" : TM, border: `1.5px solid ${taskFilter === v ? G : BR}`, borderRadius: 8, padding: "6px 13px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{l}</button>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {tasks
                .filter((t) => (taskFilter === "all" ? true : taskFilter === "done" ? t.done : !t.done))
                .map((t) => (
                  <div key={t.id} style={{ background: t.done ? SA : SU, border: `1px solid ${BR}`, borderRadius: 12, padding: "12px 15px", display: "flex", alignItems: "center", gap: 12, boxShadow: t.done ? "none" : SH, opacity: t.done ? 0.75 : 1, transition: "all 0.14s" }}>
                    <button
                      onClick={async () => {
                        await fetch(`/api/tasks/${t.id}`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ done: !t.done }) });
                        await refresh();
                      }}
                      style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${t.done ? G : BR}`, background: t.done ? G : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, color: "#fff", transition: "all 0.14s" }}
                      aria-label="Toggle done"
                    >
                      {t.done && <Ico n="chk" s={11} />}
                    </button>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: t.priority === "high" ? RD : t.priority === "medium" ? AM : GM, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ color: t.done ? TL : TX, fontWeight: 600, fontSize: 13, textDecoration: t.done ? "line-through" : "none" }}>{t.title}</div>
                      <div style={{ color: TL, fontSize: 11, marginTop: 1 }}>Due {t.due} · {t.who}</div>
                    </div>
                    <Bdg label={t.priority} color={t.priority === "high" ? "red" : t.priority === "medium" ? "yellow" : "green"} />
                    <button
                      onClick={async () => {
                        if (!confirm("Delete task?")) return;
                        await fetch(`/api/tasks/${t.id}`, { method: "DELETE", credentials: "include" });
                        await refresh();
                      }}
                      style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: 4, borderRadius: 5, display: "flex" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#fee2e2"}
                      onMouseLeave={e => e.currentTarget.style.background = "none"}
                    ><Ico n="del" s={13} /></button>
                  </div>
                ))}
              {tasks.length === 0 && <div style={{ padding: 32, textAlign: "center", color: TM, fontWeight: 900 }}>Nothing here</div>}
            </div>

            {taskModal && (
              <Modal title="Add New Task" mw={620} onClose={() => setTaskModal(false)}>
                <Field label="Task Title">
                  <input style={inputStyle} value={taskForm.title || ""} onChange={(e) => setTaskForm((p: any) => ({ ...p, title: e.target.value }))} />
                </Field>
                <div className="form-grid-2" style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
                  <Field label="Priority">
                    <select style={inputStyle} value={taskForm.priority || "medium"} onChange={(e) => setTaskForm((p: any) => ({ ...p, priority: e.target.value }))}>
                      {["high", "medium", "low"].map((x) => (
                        <option key={x} value={x}>
                          {x}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Due Date">
                    <input style={inputStyle} type="date" value={taskForm.due || todayYMD()} onChange={(e) => setTaskForm((p: any) => ({ ...p, due: e.target.value }))} />
                  </Field>
                </div>
                <Field label="Assignee">
                  <select style={inputStyle} value={taskForm.assignedToId || ""} onChange={(e) => setTaskForm((p: any) => ({ ...p, assignedToId: e.target.value }))}>
                    {staff.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.role})
                      </option>
                    ))}
                  </select>
                </Field>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 14 }}>
                  <Btn variant="ghost" onClick={() => setTaskModal(false)}>
                    Cancel
                  </Btn>
                  <Btn
                    variant="primary"
                    onClick={async () => {
                      if (!taskForm.title) return;
                      await fetch("/api/tasks", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: taskForm.title, priority: taskForm.priority, due: taskForm.due, assignedToId: taskForm.assignedToId }) });
                      setTaskModal(false);
                      await refresh();
                    }}
                  >
                    Add Task
                  </Btn>
                </div>
              </Modal>
            )}
          </div>
        )}

        {tab === "communications" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ margin: 0, color: TX, fontFamily: "Lora,Georgia,serif", fontSize: 24, fontWeight: 700 }}>Communications</h2>
              <Btn variant="warn" icon="send" onClick={() => { setMsgForm({ patientId: patients[0]?.id || "", type: "Reminder", content: "" }); setMsgModal(true); }}>New Message</Btn>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {messages.map((m) => {
                const tc: Record<string, string> = { Reminder: "blue", "Follow-up": "green", Payment: "yellow", General: "gray" };
                return (
                  <div key={m.id} style={{ background: SU, border: `1px solid ${BR}`, borderRadius: 13, padding: "15px 18px", boxShadow: SH }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: GL, display: "flex", alignItems: "center", justifyContent: "center", color: G }}><Ico n="phone" s={15} /></div>
                        <div>
                          <div style={{ color: TX, fontWeight: 700, fontSize: 13 }}>{m.patient}</div>
                          <div style={{ color: TL, fontSize: 11 }}>{m.date}</div>
                        </div>
                      </div>
                      <Bdg label={m.type} color={tc[m.type] || "gray"} />
                    </div>
                    <p style={{ margin: 0, color: TM, fontSize: 13, lineHeight: 1.65, background: SA, padding: "10px 12px", borderRadius: 8, border: `1px solid ${BR}` }}>{m.content}</p>
                  </div>
                );
              })}
              {messages.length === 0 && <p style={{ textAlign: "center", color: TL, padding: 36 }}>No messages</p>}
            </div>

            {msgModal && (
              <Modal title="Compose Message" mw={760} onClose={() => setMsgModal(false)}>
                <div className="form-grid-2" style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
                  <Field label="Patient">
                    <select style={inputStyle} value={msgForm.patientId || ""} onChange={(e) => setMsgForm((p: any) => ({ ...p, patientId: e.target.value }))}>
                      {patients.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Message Type">
                    <select style={inputStyle} value={msgForm.type || "Reminder"} onChange={(e) => setMsgForm((p: any) => ({ ...p, type: e.target.value }))}>
                      {(["Reminder", "Follow-up", "Payment", "General"] as const).map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                <Field label="Message Content">
                  <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 120 }} value={msgForm.content || ""} onChange={(e) => setMsgForm((p: any) => ({ ...p, content: e.target.value }))} placeholder="Type message..." />
                </Field>
                <div style={{ color: TM, fontWeight: 800, fontSize: 12, marginBottom: 12 }}>
                  Note: messages are stored in the database. SMS/WhatsApp integration can be added later.
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                  <Btn variant="ghost" onClick={() => setMsgModal(false)}>
                    Cancel
                  </Btn>
                  <Btn
                    variant="warn"
                    onClick={async () => {
                      if (!msgForm.patientId || !msgForm.type || !msgForm.content) return;
                      await fetch("/api/messages", {
                        method: "POST",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ patientId: msgForm.patientId, type: msgForm.type, content: msgForm.content }),
                      });
                      setMsgModal(false);
                      await refresh();
                    }}
                  >
                    Send
                  </Btn>
                </div>
              </Modal>
            )}
          </div>
        )}
        </div>
      </div>

      {/* Mobile bottom nav */}
      {isMobile && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: SU, borderTop: `1px solid ${BR}`, display: "flex", zIndex: 400, boxShadow: "0 -4px 18px rgba(14,31,48,0.09)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
          {NAV.slice(0, 5).map(n => {
            const active = tab === n.id;
            return (
              <button key={n.id} onClick={() => setTab(n.id as any)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "9px 4px 7px", background: "transparent", border: "none", color: active ? n.ac : TL, cursor: "pointer", fontFamily: "inherit", gap: 3, transition: "color 0.12s" }}>
                <span style={{ display: "flex", padding: active ? "4px 12px" : "4px", borderRadius: 99, background: active ? `${n.ac}15` : "transparent", transition: "background 0.12s" }}>
                  <Ico n={n.icon} s={19} />
                </span>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.03em" }}>{n.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const tdStyle: React.CSSProperties = { padding: "12px 14px", verticalAlign: "top", color: TM, fontWeight: 800 };

