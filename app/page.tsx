import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Markman — Trademark Portfolio Management",
  description:
    "Track every trademark you own. Know when renewals are due. Get alerted when something similar gets filed. No lawyer required for the basics.",
};

export default function HomePage() {
  return (
    <div
      style={{
        fontFamily: "var(--font-instrument-sans, 'Instrument Sans', -apple-system, sans-serif)",
        color: "#0A1628",
        background: "#FFFFFF",
      }}
    >
      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <header
        style={{
          borderBottom: "1px solid #E5E7EB",
          position: "sticky",
          top: 0,
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(8px)",
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "0 24px",
            height: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-eb-garamond, 'EB Garamond', Georgia, serif)",
              fontSize: 22,
              fontWeight: 500,
              letterSpacing: "-0.01em",
              color: "#0A1628",
            }}
          >
            Markman
          </span>

          <nav style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Link
              href="#pricing"
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: "#6B7280",
                textDecoration: "none",
                padding: "6px 12px",
              }}
            >
              Pricing
            </Link>
            <Link
              href="/login"
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: "#6B7280",
                textDecoration: "none",
                padding: "6px 12px",
              }}
            >
              Sign in
            </Link>
            <Link
              href="/login"
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: "#FFFFFF",
                background: "#0A1628",
                textDecoration: "none",
                padding: "8px 18px",
                borderRadius: 9999,
                letterSpacing: "-0.01em",
              }}
            >
              Get started free
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "120px 24px 100px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#8C7355",
            marginBottom: 28,
          }}
        >
          Trademark Portfolio Management
        </p>

        <h1
          style={{
            fontFamily: "var(--font-eb-garamond, 'EB Garamond', Georgia, serif)",
            fontSize: "clamp(52px, 8vw, 84px)",
            fontWeight: 500,
            fontStyle: "italic",
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            color: "#0A1628",
            margin: "0 auto 28px",
            maxWidth: 900,
          }}
        >
          Your trademarks.
          <br />
          Every renewal.
          <br />
          One place.
        </h1>

        <p
          style={{
            fontSize: 18,
            fontWeight: 400,
            lineHeight: 1.65,
            color: "#6B7280",
            maxWidth: 600,
            margin: "0 auto 48px",
          }}
        >
          Track your entire trademark portfolio across USPTO. Get alerted when
          renewals are coming due. Know your brand health score before your attorney does.
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/login"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 15,
              fontWeight: 600,
              color: "#FFFFFF",
              background: "#0A1628",
              textDecoration: "none",
              padding: "14px 28px",
              borderRadius: 9999,
              letterSpacing: "-0.01em",
            }}
          >
            Get started free
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <Link
            href="#features"
            style={{
              display: "inline-flex",
              alignItems: "center",
              fontSize: 15,
              fontWeight: 500,
              color: "#0A1628",
              background: "transparent",
              border: "1px solid #E5E7EB",
              textDecoration: "none",
              padding: "14px 28px",
              borderRadius: 9999,
              letterSpacing: "-0.01em",
            }}
          >
            See how it works
          </Link>
        </div>

        <p
          style={{
            marginTop: 24,
            fontSize: 13,
            color: "#9CA3AF",
            fontWeight: 400,
          }}
        >
          No credit card required &middot; Not legal advice
        </p>
      </section>

      {/* ── Problem strip ───────────────────────────────────────────── */}
      <section style={{ background: "#FAFAFA", borderTop: "1px solid #E5E7EB", borderBottom: "1px solid #E5E7EB" }}>
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "72px 24px",
          }}
        >
          <p
            style={{
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#8C7355",
              textAlign: "center",
              marginBottom: 40,
            }}
          >
            The status quo
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 24,
            }}
          >
            {([
              {
                iconColor: "#DC2626",
                heading: "Spreadsheets break.",
                body: "Tracking renewals and status across multiple trademark offices in Excel. One missed update and you've lost a mark that took years to build.",
              },
              {
                iconColor: "#D97706",
                heading: "Manual searches waste hours.",
                body: "Checking USPTO separately every time you consider a new brand. That's not due diligence — that's busy work.",
              },
              {
                iconColor: "#6B7280",
                heading: "Lawyers are expensive for status checks.",
                body: "Paying $400/hr to find out when your own trademark expires. Information you should have on demand, without an email chain.",
              },
            ] as const).map((item, i) => (
              <div
                key={i}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: 8,
                  padding: "28px 24px",
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    background: `${item.iconColor}14`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 16,
                  }}
                >
                  <div style={{ width: 16, height: 16, borderRadius: 2, background: item.iconColor, opacity: 0.7 }} />
                </div>
                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    marginBottom: 10,
                    color: "#0A1628",
                    margin: "0 0 10px",
                  }}
                >
                  {item.heading}
                </h3>
                <p style={{ fontSize: 14, lineHeight: 1.65, color: "#6B7280", margin: 0 }}>
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────── */}
      <section id="features" style={{ maxWidth: 1280, margin: "0 auto", padding: "96px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <p
            style={{
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#8C7355",
              marginBottom: 16,
            }}
          >
            What Markman does
          </p>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 40px)",
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "#0A1628",
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            Everything your portfolio needs.
            <br />
            Nothing it doesn&apos;t.
          </h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>

          {/* Feature 01 — Portfolio tracking (live) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 48,
              alignItems: "center",
              padding: "64px 0",
            }}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#16A34A", letterSpacing: "0.08em", marginBottom: 16 }}>01</div>
              <h3 style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em", color: "#0A1628", marginBottom: 16, lineHeight: 1.25, marginTop: 0 }}>
                Portfolio at a glance
              </h3>
              <p style={{ fontSize: 16, lineHeight: 1.7, color: "#6B7280", marginBottom: 20, marginTop: 0 }}>
                All your marks, one dashboard. Status, renewal dates, and brand health score — automatically synced from USPTO. No more spreadsheets, no more missed deadlines.
              </p>
              <p style={{ fontSize: 13, color: "#9CA3AF", fontWeight: 400, margin: 0 }}>
                USPTO sync · Renewal alerts · Brand health score · PDF export
              </p>
            </div>
            <div style={{ background: "#FAFAFA", border: "1px solid #E5E7EB", borderRadius: 8, padding: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: "#8C7355", marginBottom: 16, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Your Portfolio
              </div>
              {([
                { name: "NOVAGRILLE™", reg: "97123456", status: "Registered", statusColor: "#16A34A", statusBg: "#F0FDF4", renewal: "Mar 2029" },
                { name: "NOVA TECH™", reg: "97234567", status: "Pending", statusColor: "#2563EB", statusBg: "#EFF6FF", renewal: "—" },
                { name: "NOVA BITES™", reg: "97345678", status: "Registered", statusColor: "#16A34A", statusBg: "#F0FDF4", renewal: "Aug 2027" },
              ] as const).map((mark, j) => (
                <div key={j} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderTop: j > 0 ? "1px solid #E5E7EB" : "none" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0A1628" }}>{mark.name}</div>
                    <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2, fontFamily: "monospace" }}>{mark.reg}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 500, color: mark.statusColor, background: mark.statusBg, padding: "2px 8px", borderRadius: 4 }}>
                      {mark.status}
                    </span>
                    <span style={{ fontSize: 12, color: "#9CA3AF", minWidth: 60, textAlign: "right" }}>{mark.renewal}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Feature 02 — Watch Alerts (coming soon) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 48,
              alignItems: "center",
              padding: "64px 0",
              borderTop: "1px solid #E5E7EB",
            }}
          >
            <div style={{ order: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#D97706", letterSpacing: "0.08em" }}>02</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#D97706", background: "#FFFBEB", border: "1px solid #D9770633", padding: "2px 8px", borderRadius: 4, letterSpacing: "0.06em" }}>
                  COMING SOON
                </span>
              </div>
              <h3 style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em", color: "#0A1628", marginBottom: 16, lineHeight: 1.25, marginTop: 0 }}>
                Watch for copycats
              </h3>
              <p style={{ fontSize: 16, lineHeight: 1.7, color: "#6B7280", marginBottom: 20, marginTop: 0 }}>
                Markman will monitor every new trademark filing and alert you the moment something similar to your brand gets filed. Know before it becomes an expensive problem.
              </p>
              <p style={{ fontSize: 13, color: "#9CA3AF", fontWeight: 400, margin: 0 }}>
                Daily monitoring · Similarity scoring · Instant alerts — in development
              </p>
            </div>
            <div style={{ order: 0, background: "#FAFAFA", border: "1px solid #E5E7EB", borderRadius: 8, padding: 24, opacity: 0.45 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: "#8C7355", marginBottom: 16, letterSpacing: "0.08em", textTransform: "uppercase" }}>Watch Alerts</div>
              {([
                { mark: "NOVAGRILLE EXPRESS", similarity: "High similarity", days: "2 days ago", color: "#DC2626", bg: "#FEF2F2" },
                { mark: "NOVA GRILL CO.", similarity: "Medium similarity", days: "5 days ago", color: "#D97706", bg: "#FFFBEB" },
              ] as const).map((alert, j) => (
                <div key={j} style={{ background: alert.bg, border: `1px solid ${alert.color}33`, borderRadius: 6, padding: "12px 14px", marginBottom: j === 0 ? 8 : 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#0A1628" }}>{alert.mark}</div>
                      <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>New USPTO filing · {alert.days}</div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 500, color: alert.color, background: "white", padding: "2px 8px", borderRadius: 4, border: `1px solid ${alert.color}44`, whiteSpace: "nowrap", marginLeft: 8 }}>
                      {alert.similarity}
                    </span>
                  </div>
                </div>
              ))}
              <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 12, textAlign: "center" }}>
                Preview — not yet available
              </div>
            </div>
          </div>

          {/* Feature 03 — AI Conflict Search (coming soon) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 48,
              alignItems: "center",
              padding: "64px 0",
              borderTop: "1px solid #E5E7EB",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#2563EB", letterSpacing: "0.08em" }}>03</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#2563EB", background: "#EFF6FF", border: "1px solid #2563EB33", padding: "2px 8px", borderRadius: 4, letterSpacing: "0.06em" }}>
                  COMING SOON
                </span>
              </div>
              <h3 style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em", color: "#0A1628", marginBottom: 16, lineHeight: 1.25, marginTop: 0 }}>
                AI conflict search
              </h3>
              <p style={{ fontSize: 16, lineHeight: 1.7, color: "#6B7280", marginBottom: 20, marginTop: 0 }}>
                Type a brand name. Get an instant analysis of potential conflicts, similar registered marks, and class overlaps — before you spend on filing fees or attorney consultations.
              </p>
              <p style={{ fontSize: 13, color: "#9CA3AF", fontWeight: 400, margin: 0 }}>
                Powered by USPTO data · Not legal advice — in development
              </p>
            </div>
            <div style={{ background: "#FAFAFA", border: "1px solid #E5E7EB", borderRadius: 8, padding: 24, opacity: 0.45 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: "#8C7355", marginBottom: 16, letterSpacing: "0.08em", textTransform: "uppercase" }}>Conflict Search</div>
              <div style={{ border: "1px solid #E5E7EB", borderRadius: 6, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "white", marginBottom: 16 }}>
                <span style={{ fontSize: 14, color: "#0A1628", fontWeight: 500 }}>NOVA KITCHEN</span>
                <span style={{ fontSize: 12, color: "#2563EB", fontWeight: 500 }}>Search &rarr;</span>
              </div>
              <div style={{ background: "#F0FDF4", border: "1px solid #16A34A33", borderRadius: 6, padding: "12px 14px" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#16A34A", marginBottom: 4 }}>Looks clear in Class 43</div>
                <div style={{ fontSize: 12, color: "#6B7280", lineHeight: 1.5 }}>
                  No identical marks found. 2 similar marks in Class 35 &mdash; review before filing.
                </div>
              </div>
              <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 10, textAlign: "center" }}>
                Preview — not yet available
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Who it's for ─────────────────────────────────────────────── */}
      <section style={{ background: "#FAFAFA", borderTop: "1px solid #E5E7EB", borderBottom: "1px solid #E5E7EB" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "80px 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <p style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8C7355", marginBottom: 16 }}>
              Built for
            </p>
            <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 600, letterSpacing: "-0.02em", color: "#0A1628", margin: 0 }}>
              Anyone managing more than one trademark.
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24 }}>
            {([
              {
                title: "Serial entrepreneurs",
                body: "Building your third brand and managing trademarks across multiple registrations. Markman keeps it all in one place.",
              },
              {
                title: "Growing companies",
                body: "Your in-house lawyer and CEO both need visibility into the trademark portfolio. Markman gives everyone access.",
              },
              {
                title: "IP-heavy industries",
                body: "Restaurants, fashion brands, consumer goods, tech products. If your brand is your business, protect it properly.",
              },
              {
                title: "International brands",
                body: "Operating across the US and internationally? Track every mark you've registered from a single dashboard.",
              },
            ] as const).map((persona, i) => (
              <div key={i} style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 8, padding: 24 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: "#0A1628", marginBottom: 10, marginTop: 0 }}>
                  {persona.title}
                </h3>
                <p style={{ fontSize: 14, lineHeight: 1.65, color: "#6B7280", margin: 0 }}>
                  {persona.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────── */}
      <section id="pricing" style={{ maxWidth: 1280, margin: "0 auto", padding: "96px 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <p style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8C7355", marginBottom: 16 }}>
            Pricing
          </p>
          <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 600, letterSpacing: "-0.02em", color: "#0A1628", margin: 0 }}>
            Simple, transparent pricing.
          </h2>
        </div>

        <div
          style={{
            maxWidth: 480,
            margin: "0 auto",
            background: "#FFFFFF",
            border: "1px solid #E5E7EB",
            borderRadius: 12,
            padding: "40px 36px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 48, fontWeight: 600, letterSpacing: "-0.03em", color: "#0A1628" }}>$99</span>
              <span style={{ fontSize: 16, color: "#6B7280", fontWeight: 400 }}>/year</span>
            </div>
            <p style={{ fontSize: 14, color: "#9CA3AF", margin: 0 }}>Cancel anytime. No long-term commitment.</p>
          </div>

          <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: 24, marginBottom: 28 }}>
            {([
              { label: "Unlimited trademarks", live: true },
              { label: "USPTO portfolio tracking & sync", live: true },
              { label: "Renewal reminders & deadline tracking", live: true },
              { label: "Brand health score", live: true },
              { label: "Portfolio reports & PDF exports", live: true },
              { label: "Watch alerts for conflicting filings", live: false },
              { label: "AI conflict search", live: false },
            ] as const).map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                {item.live ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                    <path d="M3 8l3.5 3.5L13 4" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, opacity: 0.4 }}>
                    <circle cx="8" cy="8" r="6" stroke="#9CA3AF" strokeWidth="1.5"/>
                    <path d="M8 5v4" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"/>
                    <circle cx="8" cy="11" r="0.75" fill="#9CA3AF"/>
                  </svg>
                )}
                <span style={{ fontSize: 14, color: item.live ? "#0A1628" : "#9CA3AF" }}>
                  {item.label}
                  {!item.live && (
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#D97706", background: "#FFFBEB", border: "1px solid #D9770633", padding: "1px 6px", borderRadius: 4, marginLeft: 8 }}>
                      soon
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>

          <Link
            href="/login"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              fontSize: 15,
              fontWeight: 600,
              color: "#FFFFFF",
              background: "#0A1628",
              textDecoration: "none",
              padding: "14px 28px",
              borderRadius: 9999,
              letterSpacing: "-0.01em",
              boxSizing: "border-box",
            }}
          >
            Get started free
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <p style={{ fontSize: 12, color: "#9CA3AF", textAlign: "center", marginTop: 12, marginBottom: 0 }}>
            No credit card required to start
          </p>
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────────────── */}
      <section style={{ background: "#0A1628", padding: "80px 24px", textAlign: "center" }}>
        <p style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 20 }}>
          Get started today
        </p>
        <h2
          style={{
            fontFamily: "var(--font-eb-garamond, 'EB Garamond', Georgia, serif)",
            fontSize: "clamp(32px, 5vw, 56px)",
            fontWeight: 500,
            fontStyle: "italic",
            letterSpacing: "-0.02em",
            color: "#FFFFFF",
            margin: "0 auto 32px",
            maxWidth: 640,
            lineHeight: 1.15,
          }}
        >
          Stop losing track of what you own.
        </h2>
        <Link
          href="/login"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 15,
            fontWeight: 600,
            color: "#0A1628",
            background: "#FFFFFF",
            textDecoration: "none",
            padding: "14px 28px",
            borderRadius: 9999,
            letterSpacing: "-0.01em",
          }}
        >
          Get started free
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 16 }}>
          No credit card required
        </p>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid #E5E7EB", background: "#FFFFFF" }}>
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "40px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-eb-garamond, 'EB Garamond', Georgia, serif)",
              fontSize: 18,
              fontWeight: 500,
              color: "#0A1628",
            }}
          >
            Markman
          </span>

          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <Link href="/login" style={{ fontSize: 13, color: "#6B7280", textDecoration: "none" }}>Sign in</Link>
            <Link href="#pricing" style={{ fontSize: 13, color: "#6B7280", textDecoration: "none" }}>Pricing</Link>
            <Link href="#features" style={{ fontSize: 13, color: "#6B7280", textDecoration: "none" }}>Features</Link>
          </div>

          <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0, maxWidth: 420, textAlign: "right" }}>
            Not legal advice. Markman provides trademark data and information, not legal counsel.
            Consult a licensed IP attorney for legal guidance. &copy; 2026 Markman.
          </p>
        </div>
      </footer>
    </div>
  );
}
