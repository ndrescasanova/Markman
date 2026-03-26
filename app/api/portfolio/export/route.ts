/**
 * GET /api/portfolio/export
 * Exports the founder's trademark portfolio as a PDF.
 *
 * F-20: Must use runtime='nodejs' (not edge) — @react-pdf/renderer requires Node.js.
 * F-20: Use renderToStream() not renderToBuffer() to avoid memory pressure.
 * F-20: Font path resolved via process.cwd() — not relative URL — for Vercel compatibility.
 * F-20: Set maxDuration=60 in route segment config for large portfolios.
 */

export const runtime = "nodejs";
export const maxDuration = 60;

import { createClient } from "@/lib/supabase/server";
import { computeBrandHealthScore, scoreLabel } from "@/lib/brand-health/score";
import { NextResponse } from "next/server";
import path from "path";
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  renderToStream,
} from "@react-pdf/renderer";

// F-20: Font path must use process.cwd() for Vercel compatibility
const FONTS_DIR = path.join(process.cwd(), "public", "fonts");

Font.register({
  family: "InstrumentSans",
  fonts: [
    { src: path.join(FONTS_DIR, "InstrumentSans-Regular.ttf"), fontWeight: 400 },
    { src: path.join(FONTS_DIR, "InstrumentSans-SemiBold.ttf"), fontWeight: 600 },
  ],
});

Font.register({
  family: "GeistMono",
  src: path.join(FONTS_DIR, "GeistMonoVF.woff"),
});

const styles = StyleSheet.create({
  page: {
    fontFamily: "InstrumentSans",
    fontSize: 10,
    padding: 48,
    color: "#0A1628",
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  logo: { fontSize: 20, fontWeight: 600 },
  headerRight: { fontSize: 9, color: "#6B7280", textAlign: "right" },
  sectionTitle: { fontSize: 11, fontWeight: 600, marginBottom: 12, marginTop: 24 },
  scoreRow: { flexDirection: "row", alignItems: "baseline", marginBottom: 24 },
  scoreNumber: { fontSize: 48, fontFamily: "GeistMono", fontWeight: 400, marginRight: 8 },
  scoreLabel: { fontSize: 12, color: "#6B7280" },
  table: { width: "100%" },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 0,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderLeftColor: "#E5E7EB",
    borderRightColor: "#E5E7EB",
  },
  colMark: { flex: 2 },
  colSerial: { flex: 1, fontFamily: "GeistMono", fontSize: 9 },
  colStatus: { flex: 1 },
  colExpiry: { flex: 1, fontFamily: "GeistMono", fontSize: 9 },
  headerCell: { fontSize: 9, fontWeight: 600, color: "#6B7280", textTransform: "uppercase" },
  footer: {
    position: "absolute",
    bottom: 32,
    left: 48,
    right: 48,
    fontSize: 8,
    color: "#9CA3AF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: trademarks } = await supabase
    .from("trademarks")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const { data: profile } = await supabase
    .from("users")
    .select("email, display_name")
    .eq("id", user.id)
    .single();

  const tms = trademarks ?? [];
  const score = computeBrandHealthScore(
    tms.map((t) => ({ status: t.status, expiration_date: t.expiration_date }))
  );
  const label = score !== null ? scoreLabel(score) : null;
  const exportDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const doc = React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "LETTER", style: styles.page },
      // Header
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(Text, { style: styles.logo }, "Markman"),
        React.createElement(
          View,
          { style: styles.headerRight },
          React.createElement(Text, null, profile?.display_name || profile?.email || ""),
          React.createElement(Text, null, `Portfolio Export — ${exportDate}`)
        )
      ),
      // Score
      React.createElement(Text, { style: styles.sectionTitle }, "Brand Health Score"),
      score !== null
        ? React.createElement(
            View,
            { style: styles.scoreRow },
            React.createElement(Text, { style: styles.scoreNumber }, String(score)),
            React.createElement(Text, { style: styles.scoreLabel }, `${label} — out of 80`)
          )
        : React.createElement(Text, { style: styles.scoreLabel }, "No trademarks yet"),
      // Marks table
      React.createElement(Text, { style: styles.sectionTitle }, "Registered Marks"),
      React.createElement(
        View,
        { style: styles.table },
        React.createElement(
          View,
          { style: styles.tableHeader },
          React.createElement(Text, { style: [styles.colMark, styles.headerCell] }, "Mark Name"),
          React.createElement(Text, { style: [styles.colSerial, styles.headerCell] }, "Serial #"),
          React.createElement(Text, { style: [styles.colStatus, styles.headerCell] }, "Status"),
          React.createElement(Text, { style: [styles.colExpiry, styles.headerCell] }, "Expiry")
        ),
        ...tms.map((tm) =>
          React.createElement(
            View,
            { style: styles.tableRow, key: tm.id },
            React.createElement(Text, { style: styles.colMark }, tm.mark_name),
            React.createElement(Text, { style: styles.colSerial }, tm.serial_number),
            React.createElement(Text, { style: styles.colStatus }, tm.status),
            React.createElement(
              Text,
              { style: styles.colExpiry },
              tm.expiration_date ?? "—"
            )
          )
        )
      ),
      // Disclaimer footer
      React.createElement(
        View,
        { style: styles.footer },
        React.createElement(Text, null, "Not legal advice. Contact your attorney for guidance."),
        React.createElement(Text, null, `markman.app — ${exportDate}`)
      )
    )
  );

  // F-20: renderToStream — not renderToBuffer
  const stream = await renderToStream(doc);

  const chunks: Buffer[] = [];
  for await (const chunk of stream as AsyncIterable<Buffer>) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const pdfBuffer = Buffer.concat(chunks);

  return new Response(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="markman-portfolio-${exportDate.replace(/\s/g, "-")}.pdf"`,
    },
  });
}
