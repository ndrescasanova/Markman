"use client";
import { useState } from "react";

// ── THEME ─────────────────────────────────────────────────────────────────────
type Tk = {
  bg: string; surface: string; surface2: string; border: string;
  text: string; textMuted: string; textSubtle: string;
  accent: string; overline: string;
  success: string; warning: string; danger: string;
  successBg: string; warningBg: string; dangerBg: string;
};
function getTheme(dark: boolean): Tk {
  return dark ? {
    bg: "#0A0F1A", surface: "#111827", surface2: "#1F2937", border: "#1F2937",
    text: "#F9FAFB", textMuted: "#9CA3AF", textSubtle: "#6B7280",
    accent: "#2563EB", overline: "#A08B6A",
    success: "#16A34A", warning: "#D97706", danger: "#DC2626",
    successBg: "#052e16", warningBg: "#431407", dangerBg: "#450a0a",
  } : {
    bg: "#FFFFFF", surface: "#FAFAFA", surface2: "#F3F4F6", border: "#E5E7EB",
    text: "#0A1628", textMuted: "#6B7280", textSubtle: "#9CA3AF",
    accent: "#2563EB", overline: "#8C7355",
    success: "#16A34A", warning: "#D97706", danger: "#DC2626",
    successBg: "#F0FDF4", warningBg: "#FFFBEB", dangerBg: "#FEF2F2",
  };
}

function sc(score: number) {
  return score >= 80 ? "#16A34A" : score >= 50 ? "#D97706" : "#DC2626";
}

// ── ARC GAUGE (compact 130×78) ────────────────────────────────────────────────
function ArcGauge({ score, tk }: { score: number; tk: Tk }) {
  const r = 58, total = Math.PI * r;
  const filled = (score / 100) * total;
  const color = sc(score);
  const track = tk.surface2;
  return (
    <div style={{ position: "relative", width: 130, height: 78, flexShrink: 0 }}>
      <svg viewBox="0 0 130 78" fill="none" style={{ width: "100%", height: "100%" }}>
        <path d="M 7 72 A 58 58 0 0 1 123 72" stroke={track} strokeWidth="6" strokeLinecap="round" fill="none" />
        <path d="M 7 72 A 58 58 0 0 1 123 72" stroke={color} strokeWidth="6" strokeLinecap="round" fill="none"
          strokeDasharray={`${filled} ${total}`} />
      </svg>
      <div style={{ position: "absolute", bottom: 2, left: 0, right: 0, textAlign: "center",
        fontSize: 40, fontWeight: 600, letterSpacing: "-0.04em", lineHeight: 1, color }}>
        {score}
      </div>
    </div>
  );
}

// ── BADGE ─────────────────────────────────────────────────────────────────────
type TMStatus = "Registered" | "Pending" | "Office Action" | "Abandoned" | "Expired";
const BADGE_STYLE: Record<TMStatus, { bg: string; color: string }> = {
  Registered:      { bg: "#F0FDF4", color: "#16A34A" },
  Pending:         { bg: "#EFF6FF", color: "#2563EB" },
  "Office Action": { bg: "#FFFBEB", color: "#D97706" },
  Abandoned:       { bg: "#FEF2F2", color: "#DC2626" },
  Expired:         { bg: "#F3F4F6", color: "#6B7280" },
};
function Badge({ status }: { status: TMStatus }) {
  const s = BADGE_STYLE[status];
  return (
    <span style={{ display: "inline-block", padding: "2px 7px", borderRadius: 4,
      fontSize: 11, fontWeight: 500, whiteSpace: "nowrap", background: s.bg, color: s.color }}>
      {status}
    </span>
  );
}

// ── REG NUMBER CHIP ───────────────────────────────────────────────────────────
function RegNum({ value, tk }: { value: string; tk: Tk }) {
  return (
    <span style={{ display: "inline-block", fontFamily: "var(--font-geist-mono, monospace)",
      fontSize: 11, fontVariantNumeric: "tabular-nums", color: tk.textSubtle,
      background: tk.surface, border: `1px solid ${tk.border}`,
      borderRadius: 4, padding: "2px 7px", letterSpacing: "0.03em", whiteSpace: "nowrap" }}>
      {value}
    </span>
  );
}

// ── SIDEBAR ITEM ─────────────────────────────────────────────────────────────
function SidebarItem({ label, active, badge, tk }: {
  label: string; active?: boolean; badge?: number; tk: Tk;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
      borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 500,
      color: active ? tk.accent : tk.textMuted }}>
      <div style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
        background: active ? tk.accent : tk.border }} />
      <span style={{ flex: 1 }}>{label}</span>
      {badge !== undefined && (
        <span style={{ background: tk.accent, color: "#FFF", fontSize: 11, fontWeight: 500,
          padding: "1px 6px", borderRadius: 9999, minWidth: 18, textAlign: "center" }}>
          {badge}
        </span>
      )}
    </div>
  );
}

// ── SIDEBAR CTA ───────────────────────────────────────────────────────────────
function SidebarCTA({ label, tk }: { label: string; tk: Tk }) {
  return (
    <button style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
      width: "100%", padding: "8px 14px", marginTop: 10, background: tk.bg, color: tk.text,
      border: `1px solid ${tk.border}`, borderRadius: 6,
      boxShadow: "0 1px 2px rgba(0,0,0,0.05), 0 0 0 1px rgba(10,22,40,0.03)",
      fontFamily: "var(--font-instrument-sans, sans-serif)",
      fontSize: 13, fontWeight: 500, letterSpacing: "-0.01em", cursor: "pointer" }}>
      <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
        <path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      {label}
    </button>
  );
}

// ── MOCKUP WINDOW ─────────────────────────────────────────────────────────────
function MockupWindow({ url, isDark, children }: { url: string; isDark: boolean; children: React.ReactNode }) {
  const tk = getTheme(isDark);
  return (
    <div style={{
      background: tk.bg,
      border: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)"}`,
      borderRadius: 14, overflow: "hidden", textAlign: "left" as const,
      boxShadow: "0 2px 4px rgba(0,0,0,0.04), 0 16px 40px rgba(0,0,0,0.09), 0 48px 80px rgba(0,0,0,0.06)",
      maxWidth: 1060, margin: "0 auto",
    }}>
      {/* Chrome bar */}
      <div style={{ height: 40, background: tk.surface, borderBottom: `1px solid ${tk.border}`,
        display: "flex", alignItems: "center", padding: "0 16px", gap: 7 }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FF5F57" }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FEBC2E" }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28C840" }} />
        <div style={{ marginLeft: 8, flex: 1, maxWidth: 300, background: tk.surface2,
          borderRadius: 5, height: 22, display: "flex", alignItems: "center", padding: "0 10px",
          fontSize: 11, color: tk.textMuted }}>
          {url}
        </div>
      </div>
      {/* App topbar */}
      <div style={{ height: 48, borderBottom: `1px solid ${tk.border}`, display: "flex",
        alignItems: "center", padding: "0 20px", background: tk.bg }}>
        <span style={{ fontFamily: "var(--font-eb-garamond, Georgia, serif)", fontSize: 18, fontWeight: 500, color: tk.text }}>
          Markman
        </span>
      </div>
      {children}
    </div>
  );
}

// ── FOUNDER APP CONTENT ───────────────────────────────────────────────────────
function FounderAppContent({ isDark }: { isDark: boolean }) {
  const tk = getTheme(isDark);
  return (
    <div style={{ display: "flex" }}>
      {/* Sidebar */}
      <aside style={{ width: 216, flexShrink: 0, background: tk.surface, borderRight: `1px solid ${tk.border}`,
        padding: "18px 14px", display: "flex", flexDirection: "column", justifyContent: "space-between",
        minHeight: 460 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <SidebarItem label="Dashboard" active tk={tk} />
          <SidebarItem label="Trademarks" tk={tk} />
          <SidebarCTA label="Add Trademark" tk={tk} />
        </div>
        <div style={{ fontSize: 12, color: tk.textSubtle, padding: "0 10px" }}>Acme Corp</div>
      </aside>
      {/* Content */}
      <main style={{ flex: 1, padding: 18, overflow: "hidden", background: tk.bg }}>
        {/* Score strip */}
        <div style={{ background: tk.bg, border: `1px solid ${tk.border}`, borderRadius: 8,
          padding: "18px 22px", display: "flex", alignItems: "center", gap: 24, marginBottom: 14 }}>
          <ArcGauge score={87} tk={tk} />
          <div style={{ width: 1, height: 52, background: tk.border, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: tk.text, marginBottom: 4 }}>Brand Health</div>
            <div style={{ fontSize: 12, color: tk.textMuted, lineHeight: 1.5 }}>Good standing · 1 renewal due in 23 days</div>
          </div>
          <div style={{ display: "flex", gap: 20, flexShrink: 0 }}>
            <div style={{ textAlign: "center" }}>
              <span style={{ display: "block", fontSize: 20, fontWeight: 600, color: tk.text, letterSpacing: "-0.03em" }}>3</span>
              <span style={{ fontSize: 11, color: tk.textSubtle }}>Active marks</span>
            </div>
            <div style={{ textAlign: "center" }}>
              <span style={{ display: "block", fontSize: 20, fontWeight: 600, color: tk.text, letterSpacing: "-0.03em" }}>0</span>
              <span style={{ fontSize: 11, color: tk.textSubtle }}>Conflicts</span>
            </div>
          </div>
        </div>

        {/* 2-col grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
          {/* Registered Marks panel */}
          <div style={{ background: tk.bg, border: `1px solid ${tk.border}`, borderRadius: 8, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "13px 15px 11px", borderBottom: `1px solid ${tk.border}` }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: tk.text }}>Registered Marks</span>
              <span style={{ fontSize: 12, color: tk.accent, cursor: "pointer" }}>Add mark →</span>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr>
                  {["Mark", "Reg #", "Status", "Expires"].map(h => (
                    <th key={h} style={{ textAlign: "left", padding: "8px 12px",
                      fontSize: 10, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" as const,
                      color: tk.textSubtle, borderBottom: `1px solid ${tk.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "ACME GOODS", reg: "7123456",  status: "Registered" as TMStatus, exp: "May 15",  expColor: tk.warning },
                  { name: "ACME LOGO",  reg: "7234567",  status: "Registered" as TMStatus, exp: "Dec 2027", expColor: tk.textMuted },
                  { name: "ACME PRO",   reg: "88345678", status: "Pending" as TMStatus,    exp: "—",        expColor: tk.textSubtle },
                ].map((row, i, arr) => (
                  <tr key={i}>
                    <td style={{ padding: "9px 12px", fontWeight: 500, fontSize: 13, color: tk.text,
                      borderBottom: i < arr.length - 1 ? `1px solid ${tk.surface2}` : "none" }}>{row.name}</td>
                    <td style={{ padding: "9px 12px", borderBottom: i < arr.length - 1 ? `1px solid ${tk.surface2}` : "none" }}>
                      <RegNum value={row.reg} tk={tk} />
                    </td>
                    <td style={{ padding: "9px 12px", borderBottom: i < arr.length - 1 ? `1px solid ${tk.surface2}` : "none" }}>
                      <Badge status={row.status} />
                    </td>
                    <td style={{ padding: "9px 12px", borderBottom: i < arr.length - 1 ? `1px solid ${tk.surface2}` : "none",
                      color: row.expColor, fontWeight: row.exp === "May 15" ? 500 : 400, fontSize: 12 }}>{row.exp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Renewal Timeline panel */}
          <div style={{ background: tk.bg, border: `1px solid ${tk.border}`, borderRadius: 8, overflow: "hidden" }}>
            <div style={{ padding: "13px 15px 11px", borderBottom: `1px solid ${tk.border}` }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: tk.text }}>Renewal Timeline</span>
            </div>
            <div style={{ padding: "10px 14px" }}>
              {[
                { dot: tk.warning, date: "May 15",   name: "ACME GOODS",       days: "23 days",  urgent: true },
                { dot: tk.border,  date: "Jun 3",    name: "ACME LOGO",         days: "42 days",  urgent: false },
                { dot: tk.border,  date: "Dec 2027", name: "ACME LOGO (10yr)", days: "627 days", urgent: false },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 11,
                  padding: "9px 0", borderBottom: i < 2 ? `1px solid ${tk.surface2}` : "none", fontSize: 13 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: item.dot }} />
                  <div style={{ color: tk.textMuted, fontSize: 12, fontVariantNumeric: "tabular-nums", width: 48 }}>{item.date}</div>
                  <div style={{ flex: 1, color: tk.text, fontWeight: 500 }}>{item.name}</div>
                  <div style={{ fontSize: 12, fontVariantNumeric: "tabular-nums", fontWeight: 500,
                    color: item.urgent ? tk.warning : tk.textSubtle }}>{item.days}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Attorney strip */}
        <div style={{ display: "flex", alignItems: "center", gap: 11, background: tk.surface,
          border: `1px solid ${tk.border}`, borderRadius: 8, padding: "11px 14px", marginBottom: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: tk.accent, color: "#FFF",
            fontSize: 10, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0 }}>JS</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: tk.text }}>Jane Smith · Smith IP Law</div>
            <div style={{ fontSize: 11, color: tk.textSubtle, marginTop: 1 }}>Reviewed your portfolio 3 days ago</div>
          </div>
          <button style={{ background: "none", border: "none", color: tk.textMuted, fontSize: 12, cursor: "pointer", padding: "6px 8px" }}>
            Ask Jane →
          </button>
        </div>

        {/* Coming soon */}
        <div style={{ background: tk.surface, border: `1px dashed ${tk.border}`, borderRadius: 8,
          padding: 14, textAlign: "center" }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: tk.textMuted, marginBottom: 3 }}>Conflict Monitoring</div>
          <div style={{ fontSize: 11, color: tk.textSubtle }}>AI-powered brand conflict detection — coming in Phase 2</div>
        </div>
      </main>
    </div>
  );
}

// ── ATTORNEY APP CONTENT ──────────────────────────────────────────────────────
function AttorneyAppContent({ isDark }: { isDark: boolean }) {
  const tk = getTheme(isDark);
  return (
    <div style={{ display: "flex" }}>
      {/* Sidebar */}
      <aside style={{ width: 216, flexShrink: 0, background: tk.surface, borderRight: `1px solid ${tk.border}`,
        padding: "18px 14px", display: "flex", flexDirection: "column", justifyContent: "space-between",
        minHeight: 460 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <SidebarItem label="Overview" active tk={tk} />
          <SidebarItem label="Clients" tk={tk} />
          <SidebarItem label="Deadlines" tk={tk} />
          <SidebarCTA label="Invite Client" tk={tk} />
        </div>
        <div style={{ fontSize: 12, color: tk.textSubtle, padding: "0 10px" }}>Smith IP Law · Free plan</div>
      </aside>
      {/* Content */}
      <main style={{ flex: 1, padding: 18, overflow: "hidden", background: tk.bg }}>
        {/* 4 stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
          <div style={{ background: tk.bg, border: `1px solid ${tk.border}`, borderRadius: 8, padding: "14px 14px 12px" }}>
            <div style={{ fontSize: 10, fontWeight: 500, color: tk.textMuted, marginBottom: 5 }}>Clients</div>
            <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.04em", color: tk.text, lineHeight: 1 }}>12</div>
          </div>
          <div style={{ background: tk.warningBg, border: "1px solid #FDE68A", borderRadius: 8, padding: "14px 14px 12px" }}>
            <div style={{ fontSize: 10, fontWeight: 500, color: tk.textMuted, marginBottom: 5 }}>Urgent</div>
            <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.04em", color: tk.warning, lineHeight: 1 }}>3</div>
          </div>
          <div style={{ background: tk.bg, border: `1px solid ${tk.border}`, borderRadius: 8, padding: "14px 14px 12px" }}>
            <div style={{ fontSize: 10, fontWeight: 500, color: tk.textMuted, marginBottom: 5 }}>Total Marks</div>
            <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.04em", color: tk.text, lineHeight: 1 }}>47</div>
          </div>
          <div style={{ background: tk.dangerBg, border: "1px solid #FECACA", borderRadius: 8, padding: "14px 14px 12px" }}>
            <div style={{ fontSize: 10, fontWeight: 500, color: tk.textMuted, marginBottom: 5 }}>Conflicts</div>
            <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.04em", color: tk.danger, lineHeight: 1 }}>1</div>
          </div>
        </div>

        {/* Clients panel */}
        <div style={{ background: tk.bg, border: `1px solid ${tk.border}`, borderRadius: 8, overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "13px 15px 11px", borderBottom: `1px solid ${tk.border}` }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: tk.text }}>Clients</span>
            <span style={{ fontSize: 12, color: tk.accent, cursor: "pointer" }}>Invite client →</span>
          </div>
          {[
            { urgency: "#DC2626", name: "Acme Corp",        meta: "1 conflict · 1 renewal in 23 days" },
            { urgency: "#D97706", name: "Beta Software LLC", meta: "2 renewals 30–90 days" },
            { urgency: tk.border, name: "Gamma Industries",  meta: "All clear · 3 marks active" },
            { urgency: tk.border, name: "Delta Partners",    meta: "All clear · 1 mark active" },
          ].map((c, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 14px",
              borderBottom: i < 3 ? `1px solid ${tk.surface2}` : "none", fontSize: 13 }}>
              <div style={{ width: 3, height: 30, borderRadius: 2, flexShrink: 0, background: c.urgency }} />
              <div style={{ fontWeight: 500, color: tk.text, flex: 1 }}>{c.name}</div>
              <div style={{ fontSize: 12, color: tk.textMuted }}>{c.meta}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

// ── PAGE ──────────────────────────────────────────────────────────────────────
export default function DesignPreview() {
  const [isDark, setIsDark] = useState(false);
  const tk = getTheme(isDark);
  const sans = "var(--font-instrument-sans, 'Instrument Sans', -apple-system, sans-serif)";
  const serif = "var(--font-eb-garamond, Georgia, serif)";
  const mono = "var(--font-geist-mono, 'JetBrains Mono', monospace)";

  return (
    <div style={{ minHeight: "100vh", background: tk.bg, fontFamily: sans, color: tk.text }}>
      <style>{`
        .mkp-btn-hero-primary:hover { opacity: 0.78 !important; }
        .mkp-btn-hero-outline:hover { opacity: 0.65 !important; }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 52px", height: 54,
        background: isDark ? "rgba(10,15,26,0.85)" : "rgba(255,255,255,0.85)",
        backdropFilter: "saturate(180%) blur(20px)",
        WebkitBackdropFilter: "saturate(180%) blur(20px)",
        borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)"}`,
      }}>
        <span style={{ fontFamily: serif, fontSize: 23, fontWeight: 500, color: tk.text, letterSpacing: "-0.02em" }}>Markman</span>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.09em", textTransform: "uppercase" as const,
            color: tk.textSubtle }}>Design System</span>
          <button onClick={() => setIsDark(v => !v)} style={{ fontSize: 12, fontWeight: 500,
            color: tk.textMuted, background: "none", border: "none", cursor: "pointer",
            padding: "0 0", minHeight: 44, display: "flex", alignItems: "center",
            fontFamily: sans }}>
            {isDark ? "Light mode" : "Dark mode"}
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        minHeight: "calc(100svh - 54px)", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", textAlign: "center",
        padding: "80px 40px", background: tk.bg,
      }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.10em",
          textTransform: "uppercase" as const, color: tk.overline, marginBottom: 28 }}>
          Trademark portfolio management
        </div>

        {/* Harvey strategy: serif italic for hero headline only */}
        <h1 style={{
          fontFamily: serif,
          fontStyle: "italic",
          fontWeight: 500,
          fontSize: "clamp(52px, 8vw, 96px)",
          lineHeight: 0.95,
          letterSpacing: "-0.03em",
          color: tk.text,
          marginBottom: 24,
          maxWidth: 820,
        }}>
          Protect what<br />you built.
        </h1>

        <p style={{ fontFamily: sans, fontSize: "clamp(16px, 1.8vw, 20px)", fontWeight: 400,
          color: tk.textMuted, marginBottom: 44, lineHeight: 1.5, letterSpacing: "-0.01em", maxWidth: 460 }}>
          USPTO sync, renewal alerts, and attorney collaboration — in one place.
        </p>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", marginBottom: 72 }}>
          <button className="mkp-btn-hero-primary" style={{
            fontFamily: sans, fontSize: 14, fontWeight: 600,
            color: isDark ? "#0A1628" : "#FFFFFF",
            background: isDark ? "#FFFFFF" : "#0A1628",
            border: "none", padding: "13px 30px", borderRadius: 9999,
            cursor: "pointer", letterSpacing: "-0.01em", transition: "opacity 0.15s",
          }}>Get started free</button>
          <button className="mkp-btn-hero-outline" style={{
            fontFamily: sans, fontSize: 14, fontWeight: 500,
            color: tk.text,
            background: "none",
            border: `1.5px solid ${isDark ? "rgba(255,255,255,0.22)" : "rgba(10,22,40,0.20)"}`,
            padding: "13px 30px", borderRadius: 9999,
            cursor: "pointer", letterSpacing: "-0.01em", transition: "opacity 0.15s",
          }}>View the product</button>
        </div>

        {/* Hero score card */}
        <div style={{
          background: tk.bg, border: `1px solid ${tk.border}`, borderRadius: 18,
          padding: "28px 36px", display: "inline-flex", alignItems: "center", gap: 32,
          boxShadow: "0 1px 2px rgba(0,0,0,0.03), 0 8px 24px rgba(0,0,0,0.07), 0 32px 56px rgba(0,0,0,0.05)",
          maxWidth: 560, width: "100%", textAlign: "left" as const,
        }}>
          <ArcGauge score={87} tk={tk} />
          <div>
            <div style={{ fontFamily: sans, fontSize: 15, fontWeight: 600, color: tk.text, marginBottom: 6, letterSpacing: "-0.01em" }}>
              Brand Health Score
            </div>
            <div style={{ fontFamily: sans, fontSize: 13, color: tk.textMuted, lineHeight: 1.55, marginBottom: 12 }}>
              3 marks active · 1 renewal due in 23 days<br />Last synced 2 minutes ago
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
              <Badge status="Registered" />
              <Badge status="Registered" />
              <Badge status="Pending" />
            </div>
          </div>
        </div>
      </section>

      {/* ── FOUNDER DASHBOARD SECTION ── */}
      <section style={{ background: isDark ? "#0D1117" : "#F5F5F7", padding: "108px 40px", textAlign: "center" as const }}>
        <div style={{ fontFamily: sans, fontSize: 11, fontWeight: 600, letterSpacing: "0.10em",
          textTransform: "uppercase" as const, color: tk.overline, marginBottom: 14 }}>Founder Dashboard</div>
        <h2 style={{ fontFamily: sans, fontSize: "clamp(36px, 4.5vw, 56px)", fontWeight: 600,
          lineHeight: 1.0, letterSpacing: "-0.035em", color: tk.text, marginBottom: 14 }}>
          Your portfolio,<br />at a glance.
        </h2>
        <p style={{ fontFamily: sans, fontSize: 17, color: tk.textMuted, marginBottom: 56, lineHeight: 1.5, letterSpacing: "-0.01em" }}>
          Brand health, renewal deadlines, and your attorney — one view.
        </p>
        <MockupWindow url="app.markman.com/dashboard" isDark={isDark}>
          <FounderAppContent isDark={isDark} />
        </MockupWindow>
      </section>

      {/* ── DARK STATS ── */}
      <section style={{ background: "#0A1628", padding: "108px 52px", textAlign: "center" as const }}>
        <h2 style={{ fontFamily: sans, fontSize: "clamp(36px, 5.5vw, 68px)", fontWeight: 600,
          lineHeight: 0.97, letterSpacing: "-0.04em", color: "#FFFFFF", marginBottom: 16 }}>
          Renewals don&apos;t wait.<br />Neither should you.
        </h2>
        <p style={{ fontFamily: sans, fontSize: 18, color: "rgba(255,255,255,0.45)", marginBottom: 80, letterSpacing: "-0.01em" }}>
          Real-time USPTO sync. Zero surprises.
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 80, flexWrap: "wrap" as const }}>
          {[
            { big: "100%", label: "USPTO sync accuracy" },
            { big: "30d",  label: "Advance renewal alerts" },
            { big: "0",    label: "Missed deadlines" },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: sans, fontSize: "clamp(52px, 7vw, 80px)", fontWeight: 600,
                lineHeight: 0.9, letterSpacing: "-0.05em", color: "#FFFFFF", marginBottom: 10 }}>{s.big}</div>
              <div style={{ fontFamily: sans, fontSize: 14, color: "rgba(255,255,255,0.45)", letterSpacing: "-0.01em" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── ATTORNEY DASHBOARD SECTION ── */}
      <section style={{ background: isDark ? "#0D1117" : "#F5F5F7", padding: "108px 40px", textAlign: "center" as const }}>
        <div style={{ fontFamily: sans, fontSize: 11, fontWeight: 600, letterSpacing: "0.10em",
          textTransform: "uppercase" as const, color: tk.overline, marginBottom: 14 }}>Attorney Dashboard</div>
        <h2 style={{ fontFamily: sans, fontSize: "clamp(36px, 4.5vw, 56px)", fontWeight: 600,
          lineHeight: 1.0, letterSpacing: "-0.035em", color: tk.text, marginBottom: 14 }}>
          Every client,<br />instantly.
        </h2>
        <p style={{ fontFamily: sans, fontSize: 17, color: tk.textMuted, marginBottom: 56, lineHeight: 1.5, letterSpacing: "-0.01em" }}>
          Urgency surfaces to the top. Nothing buried.
        </p>
        <MockupWindow url="app.markman.com/attorney" isDark={isDark}>
          <AttorneyAppContent isDark={isDark} />
        </MockupWindow>
      </section>

      {/* ── DESIGN SYSTEM ── */}
      <section style={{ padding: "100px 52px", background: tk.bg }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ fontFamily: sans, fontSize: 11, fontWeight: 600, letterSpacing: "0.09em",
            textTransform: "uppercase" as const, color: tk.overline, marginBottom: 48 }}>
            Design System — Quiet Authority
          </div>

          {/* Color */}
          <div style={{ marginBottom: 72 }}>
            <div style={{ fontFamily: sans, fontSize: 13, fontWeight: 600, letterSpacing: "0.06em",
              textTransform: "uppercase" as const, color: tk.textSubtle, marginBottom: 20,
              paddingBottom: 12, borderBottom: `1px solid ${tk.border}` }}>Color</div>
            <div style={{ display: "flex", gap: 1, borderRadius: 10, overflow: "hidden", height: 72, marginBottom: 24 }}>
              {[
                { bg: "#0A1628", r: "10px 0 0 10px" },
                { bg: "#2563EB" },
                { bg: "#F5F5F7", b: "1px solid #E5E7EB" },
                { bg: "#FAFAFA" },
                { bg: "#E5E7EB" },
                { bg: "#16A34A" },
                { bg: "#D97706" },
                { bg: "#DC2626", r: "0 10px 10px 0" },
              ].map((c, i) => (
                <div key={i} style={{ flex: 1, background: c.bg,
                  borderRadius: (c as { r?: string }).r || 0,
                  border: (c as { b?: string }).b || "none" }} />
              ))}
            </div>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" as const }}>
              {[
                { name: "Navy · Text",    hex: "#0A1628" },
                { name: "Blue · CTAs only", hex: "#2563EB" },
                { name: "Surface",        hex: "#FAFAFA" },
                { name: "Border",         hex: "#E5E7EB" },
                { name: "Success",        hex: "#16A34A" },
                { name: "Warning",        hex: "#D97706" },
                { name: "Danger",         hex: "#DC2626" },
              ].map(s => (
                <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 5, background: s.hex,
                    border: "1px solid rgba(0,0,0,0.08)", flexShrink: 0 }} />
                  <div>
                    <div style={{ fontFamily: sans, fontSize: 12, fontWeight: 500, color: tk.text }}>{s.name}</div>
                    <div style={{ fontFamily: mono, fontSize: 11, color: tk.textSubtle }}>{s.hex}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Typography */}
          <div style={{ marginBottom: 72 }}>
            <div style={{ fontFamily: sans, fontSize: 13, fontWeight: 600, letterSpacing: "0.06em",
              textTransform: "uppercase" as const, color: tk.textSubtle, marginBottom: 20,
              paddingBottom: 12, borderBottom: `1px solid ${tk.border}` }}>Typography</div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {[
                {
                  name: "Logo / Hero Headline", spec: "EB Garamond · italic · logo + hero",
                  sample: <span style={{ fontFamily: serif, fontStyle: "italic", fontSize: 28, fontWeight: 500, color: tk.text }}>Markman</span>,
                },
                {
                  name: "Page Title", spec: "24px · 600 · Instrument Sans",
                  sample: <span style={{ fontFamily: sans, fontSize: 24, fontWeight: 600, letterSpacing: "-0.025em", color: tk.text }}>Brand Health</span>,
                },
                {
                  name: "Section Heading", spec: "18px · 600 · Instrument Sans",
                  sample: <span style={{ fontFamily: sans, fontSize: 18, fontWeight: 600, letterSpacing: "-0.01em", color: tk.text }}>Renewal Timeline</span>,
                },
                {
                  name: "Body", spec: "15px · 400 · Instrument Sans",
                  sample: <span style={{ fontFamily: sans, fontSize: 15, color: tk.textMuted, lineHeight: 1.6 }}>Your trademark renewal is due in 23 days. File a Section 8 declaration.</span>,
                },
                {
                  name: "Data / Numbers", spec: "14px · 400 · Geist Mono · tabular",
                  sample: <span style={{ fontFamily: mono, fontSize: 14, fontVariantNumeric: "tabular-nums", color: tk.text }}>2026-05-15 · Reg. 7123456</span>,
                },
              ].map((row, i, arr) => (
                <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 28,
                  padding: "18px 0", borderBottom: i < arr.length - 1 ? `1px solid ${tk.border}` : "none" }}>
                  <div style={{ width: 220, flexShrink: 0 }}>
                    <div style={{ fontFamily: sans, fontSize: 12, fontWeight: 500, color: tk.text }}>{row.name}</div>
                    <div style={{ fontFamily: mono, fontSize: 11, color: tk.textSubtle, marginTop: 2 }}>{row.spec}</div>
                  </div>
                  {row.sample}
                </div>
              ))}
            </div>
          </div>

          {/* Components */}
          <div>
            <div style={{ fontFamily: sans, fontSize: 13, fontWeight: 600, letterSpacing: "0.06em",
              textTransform: "uppercase" as const, color: tk.textSubtle, marginBottom: 20,
              paddingBottom: 12, borderBottom: `1px solid ${tk.border}` }}>Components</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
              <div style={{ background: tk.surface, border: `1px solid ${tk.border}`, borderRadius: 12, padding: 22 }}>
                <div style={{ fontFamily: sans, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
                  textTransform: "uppercase" as const, color: tk.textSubtle, marginBottom: 18 }}>Buttons</div>
                <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8, alignItems: "center" }}>
                  <button style={{ fontFamily: sans, fontSize: 13, fontWeight: 500, padding: "8px 16px",
                    borderRadius: 6, cursor: "pointer", border: "none", background: "#2563EB", color: "#FFF" }}>Add Trademark</button>
                  <button style={{ fontFamily: sans, fontSize: 13, fontWeight: 500, padding: "8px 16px",
                    borderRadius: 6, cursor: "pointer", border: `1px solid ${tk.border}`, background: tk.surface, color: tk.text }}>Export</button>
                  <button style={{ fontFamily: sans, fontSize: 13, fontWeight: 500, padding: "8px 16px",
                    borderRadius: 6, cursor: "pointer", border: "none", background: "none", color: tk.textMuted }}>Cancel</button>
                  <button style={{ fontFamily: sans, fontSize: 13, fontWeight: 500, padding: "8px 16px",
                    borderRadius: 6, cursor: "pointer", border: "1px solid #DC2626", background: "none", color: "#DC2626" }}>Remove</button>
                </div>
              </div>

              <div style={{ background: tk.surface, border: `1px solid ${tk.border}`, borderRadius: 12, padding: 22 }}>
                <div style={{ fontFamily: sans, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
                  textTransform: "uppercase" as const, color: tk.textSubtle, marginBottom: 18 }}>Status Badges</div>
                <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
                  {(["Registered", "Pending", "Office Action", "Abandoned", "Expired"] as TMStatus[]).map(s => (
                    <Badge key={s} status={s} />
                  ))}
                </div>
              </div>

              <div style={{ background: tk.surface, border: `1px solid ${tk.border}`, borderRadius: 12, padding: 22 }}>
                <div style={{ fontFamily: sans, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
                  textTransform: "uppercase" as const, color: tk.textSubtle, marginBottom: 18 }}>Form Input</div>
                <label style={{ fontFamily: sans, fontSize: 12, fontWeight: 500, color: tk.text, marginBottom: 6, display: "block" }}>
                  Serial Number
                </label>
                <input type="text" placeholder="e.g. 97123456" readOnly style={{
                  fontFamily: sans, fontSize: 13, border: `1px solid ${tk.border}`, borderRadius: 6,
                  padding: "8px 12px", width: "100%", background: tk.bg, color: tk.text, outline: "none" }} />
                <span style={{ fontFamily: sans, fontSize: 11, color: tk.textSubtle, marginTop: 4, display: "block" }}>
                  USPTO serial or registration number
                </span>
              </div>

              <div style={{ background: tk.surface, border: `1px solid ${tk.border}`, borderRadius: 12, padding: 22 }}>
                <div style={{ fontFamily: sans, fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
                  textTransform: "uppercase" as const, color: tk.textSubtle, marginBottom: 18 }}>Alerts</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  <div style={{ padding: "9px 11px", background: tk.successBg, borderRadius: 4,
                    fontSize: 12, color: "#16A34A", border: "1px solid #BBF7D0", fontFamily: sans }}>
                    Trademark registered successfully.
                  </div>
                  <div style={{ padding: "9px 11px", background: tk.warningBg, borderRadius: 4,
                    fontSize: 12, color: "#D97706", border: "1px solid #FDE68A", fontFamily: sans }}>
                    Renewal due in 23 days.
                  </div>
                  <div style={{ padding: "9px 11px", background: tk.dangerBg, borderRadius: 4,
                    fontSize: 12, color: "#DC2626", border: "1px solid #FECACA", fontFamily: sans }}>
                    Trademark not found on USPTO.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding: "40px 52px", borderTop: `1px solid ${tk.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: serif, fontSize: 16, color: tk.textMuted }}>Markman</span>
        <span style={{ fontFamily: sans, fontSize: 12, color: tk.textSubtle }}>Not legal advice · Design system v1.0 · 2026</span>
      </footer>
    </div>
  );
}
