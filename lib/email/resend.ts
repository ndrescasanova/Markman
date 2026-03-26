/**
 * Resend email client — lazy-initialized to avoid build failures.
 * Do NOT instantiate Resend at module level.
 *
 * Phase 1: plain-text emails (HTML templates are TODO-003).
 */

import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY!);
  }
  return _resend;
}

const FROM = process.env.RESEND_FROM_EMAIL || "notifications@markman.app";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://markman.app";

// ─── Email send functions ─────────────────────────────────────────────────────

export async function sendInviteEmail({
  to,
  attorneyName,
  token,
}: {
  to: string;
  attorneyName: string;
  token: string;
}) {
  const link = `${APP_URL}/invite/${token}`;
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `${attorneyName} invited you to view your trademarks on Markman`,
    text: [
      `${attorneyName} has set up a trademark dashboard for you on Markman.`,
      "",
      `View your trademarks here: ${link}`,
      "",
      "This link expires in 72 hours.",
      "",
      "— Markman",
    ].join("\n"),
  });
}

export async function sendRenewalAlert({
  to,
  markName,
  daysRemaining,
  serialNumber,
}: {
  to: string;
  markName: string;
  daysRemaining: number;
  serialNumber: string;
}) {
  const urgency = daysRemaining < 30 ? "⚠️ URGENT: " : "";
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `${urgency}${markName} trademark renewal due in ${daysRemaining} days`,
    text: [
      `Your trademark "${markName}" (Serial #${serialNumber}) is due for renewal in ${daysRemaining} days.`,
      "",
      `Log in to your Markman dashboard to review your renewal options:`,
      `${APP_URL}/dashboard`,
      "",
      daysRemaining < 30
        ? "Action required soon — missing a renewal deadline can result in losing your trademark protection."
        : "We recommend starting the renewal process now to avoid last-minute delays.",
      "",
      "— Markman",
      "",
      "Not legal advice. Contact your attorney for guidance.",
    ].join("\n"),
  });
}

export async function sendMilestoneEmail({
  to,
  markName,
  registrationNumber,
}: {
  to: string;
  markName: string;
  registrationNumber: string;
}) {
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `Congratulations! "${markName}" is now a registered trademark`,
    text: [
      `Great news — your trademark "${markName}" has been officially registered!`,
      "",
      `Registration Number: ${registrationNumber}`,
      "",
      `View your updated portfolio: ${APP_URL}/dashboard`,
      "",
      "— Markman",
      "",
      "Not legal advice.",
    ].join("\n"),
  });
}

export async function sendMessageNotification({
  to,
  senderName,
  messagePreview,
}: {
  to: string;
  senderName: string;
  messagePreview: string; // first 80 chars
}) {
  return getResend().emails.send({
    from: FROM,
    to,
    subject: `New message from ${senderName} on Markman`,
    text: [
      `${senderName} sent you a message:`,
      "",
      `"${messagePreview}"`,
      "",
      `Reply here: ${APP_URL}/messages`,
      "",
      "— Markman",
    ].join("\n"),
  });
}
