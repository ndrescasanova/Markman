/**
 * USPTO TSDR API client (D3 abstraction layer).
 * Single file to update if USPTO changes their response format.
 *
 * TSDR endpoint: https://tsdrapi.uspto.gov/ts/cd/casestatus/{serial}/info.json
 * Auth header:   USPTO-API-KEY: {key}  (NOT X-API-Key — USPTO-specific header)
 * Rate limit: 60 req/min per key. Do NOT call in tight loops.
 * For bulk operations, use the paginated cron job (TODO-007).
 *
 * Real response shape (verified 2026-03-26):
 * {
 *   trademarks: [{
 *     status: { serialNumber, filingDate, usRegistrationNumber, usRegistrationDate,
 *               markElement, descOfMark, extStatusDesc, tm5Status, tm5StatusDesc,
 *               dateAbandoned, ... },
 *     parties: { ownerGroups: { "30": [{ name, partyTypeDescription, ... }] } },
 *     gsList: [{ description, internationalClasses: [{ code }], primeClassCode, ... }]
 *   }]
 * }
 */

import type { TrademarkRecord, TrademarkStatus } from "./types";
import { TSDRUnavailableError, TSDRParseError } from "./types";

const TSDR_BASE_URL = "https://tsdrapi.uspto.gov/ts/cd/casestatus";
const REQUEST_TIMEOUT_MS = 15_000; // 15 seconds
const USPTO_API_KEY = process.env.USPTO_API_KEY ?? "";

// ─── Status normalization ─────────────────────────────────────────────────────

/**
 * Map tm5StatusDesc to our internal TrademarkStatus.
 * tm5StatusDesc format: "LIVE/REGISTRATION/..." | "LIVE/APPLICATION/..." |
 *                        "DEAD/APPLICATION/..." | "DEAD/REGISTRATION/..."
 */
function normalizeTsdrStatus(
  tm5StatusDesc: string,
  extStatusDesc: string
): TrademarkStatus {
  const desc = (tm5StatusDesc || "").toUpperCase();
  const ext = (extStatusDesc || "").toUpperCase();

  if (desc.includes("DEAD/REGISTRATION")) return "CANCELLED";
  if (desc.includes("DEAD/APPLICATION") || desc.includes("DEAD")) return "ABANDONED";
  if (desc.includes("LIVE/REGISTRATION")) return "REGISTERED";
  if (desc.includes("LIVE/APPLICATION")) {
    // Check for active office action
    if (ext.includes("OFFICE ACTION") || ext.includes("OFFICE_ACTION")) {
      return "OFFICE_ACTION";
    }
    return "PENDING";
  }
  return "UNKNOWN";
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

/** Parse YYYY-MM-DD or YYYYMMDD (integer) date → YYYY-MM-DD string */
function parseDate(raw: string | number | null | undefined): string | null {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim();
  if (!s || s === "0") return null;

  // YYYY-MM-DD already
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // YYYYMMDD (USPTO integer dates, e.g. firstUseDate: 20170201)
  if (/^\d{8}$/.test(s)) {
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  }

  // ISO with time: 2023-05-25T04:00:00.000+0000
  const isoMatch = s.match(/^(\d{4}-\d{2}-\d{2})T/);
  if (isoMatch) return isoMatch[1];

  return null;
}

/**
 * Calculate the next US trademark renewal/expiration date.
 * US trademarks renew every 10 years from the registration date.
 * No direct field exists in TSDR — we derive it.
 */
function calcExpirationDate(registrationDate: string | null): string | null {
  if (!registrationDate) return null;
  const reg = new Date(registrationDate);
  if (isNaN(reg.getTime())) return null;

  const regYear = reg.getUTCFullYear();
  const currentYear = new Date().getUTCFullYear();

  // Find the next 10-year anniversary that hasn't passed yet
  let expirationYear = regYear + 10;
  while (expirationYear <= currentYear) {
    expirationYear += 10;
  }

  const exp = new Date(registrationDate);
  exp.setUTCFullYear(expirationYear);
  return exp.toISOString().split("T")[0];
}

// ─── Field extractors ─────────────────────────────────────────────────────────

function extractMarkName(status: Record<string, unknown>): string {
  // Word marks have markElement; design marks have descOfMark
  const wordMark = (status.markElement as string) || "";
  const designDesc = (status.descOfMark as string) || "";
  return wordMark.trim() || designDesc.trim() || "Unknown";
}

function extractOwner(parties: Record<string, unknown> | null): string | null {
  if (!parties) return null;
  const ownerGroups = parties.ownerGroups as Record<
    string,
    Array<Record<string, unknown>>
  > | null;
  if (!ownerGroups) return null;

  // Flatten all party groups. The most recently added (highest key or last entry)
  // represents the current owner (e.g. after assignment).
  const allParties = Object.values(ownerGroups).flat();
  if (allParties.length === 0) return null;

  // Take the last party entry as current owner
  const current = allParties[allParties.length - 1];
  return (current?.name as string) || null;
}

function extractGoodsServices(gsList: Array<Record<string, unknown>> | null): {
  goods: string | null;
  intlClass: string | null;
} {
  if (!Array.isArray(gsList) || gsList.length === 0) {
    return { goods: null, intlClass: null };
  }

  const first = gsList[0];
  const goods = (first.description as string) || null;

  // International class codes
  const classes = (
    first.internationalClasses as Array<Record<string, unknown>>
  ) || [];
  const classCodes = Array.isArray(classes)
    ? classes.map((c) => c.code as string).filter(Boolean).join(", ")
    : (first.primeClassCode as string) || null;

  return { goods, intlClass: classCodes || null };
}

// ─── Main parser ──────────────────────────────────────────────────────────────

/** Parse the real TSDR JSON response into a normalized TrademarkRecord */
function parseTsdrResponse(
  json: Record<string, unknown>,
  serialNumber: string
): TrademarkRecord {
  const trademarks = json.trademarks as Array<Record<string, unknown>>;
  if (!Array.isArray(trademarks) || trademarks.length === 0) {
    throw new TSDRParseError(
      `TSDR response for ${serialNumber} has no trademarks array`,
      json
    );
  }

  const tm = trademarks[0] as Record<string, unknown>;
  const status = (tm.status as Record<string, unknown>) || {};
  const parties = (tm.parties as Record<string, unknown>) || null;
  const gsList = (tm.gsList as Array<Record<string, unknown>>) || [];

  const tm5StatusDesc = (status.tm5StatusDesc as string) || "";
  const extStatusDesc = (status.extStatusDesc as string) || "";

  const registrationDate = parseDate(status.usRegistrationDate as string);

  const { goods, intlClass } = extractGoodsServices(gsList);

  return {
    serialNumber,
    registrationNumber: (status.usRegistrationNumber as string) || null,
    markName: extractMarkName(status),
    status: normalizeTsdrStatus(tm5StatusDesc, extStatusDesc),
    filingDate: parseDate(status.filingDate as string),
    registrationDate,
    expirationDate: calcExpirationDate(registrationDate),
    ownerName: extractOwner(parties),
    goodsServices: goods,
    internationalClass: intlClass,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetch trademark data from USPTO TSDR for a given serial number.
 *
 * @param serialNumber - 7 or 8 digit USPTO serial number
 * @returns TrademarkRecord on success, null if trademark not found
 * @throws TSDRUnavailableError on auth failure, 5xx, or timeout
 * @throws TSDRParseError on unexpected response shape
 */
export async function fetchTrademarkBySerial(
  serialNumber: string
): Promise<TrademarkRecord | null> {
  const url = `${TSDR_BASE_URL}/${serialNumber}/info.json`;

  if (!USPTO_API_KEY) {
    throw new TSDRUnavailableError(
      "USPTO_API_KEY environment variable is not set"
    );
  }

  let response: Response;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      REQUEST_TIMEOUT_MS
    );

    response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        // USPTO requires this specific header name (NOT X-API-Key)
        "USPTO-API-KEY": USPTO_API_KEY,
      },
      cache: "no-store",
    });

    clearTimeout(timeoutId);
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new TSDRUnavailableError(
        `TSDR request timed out after ${REQUEST_TIMEOUT_MS}ms`
      );
    }
    throw new TSDRUnavailableError(
      `TSDR request failed: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  // Read body once (can only read stream once)
  const bodyText = await response.text();

  // 401 = unauthenticated (missing key)
  if (response.status === 401) {
    throw new TSDRUnavailableError(
      `TSDR authentication failed (401). Check USPTO_API_KEY.`,
      401
    );
  }

  // 403 = key invalid or not subscribed to TSDR API product
  if (response.status === 403) {
    throw new TSDRUnavailableError(
      `TSDR authorization failed (403). Key may not be subscribed to TSDR.`,
      403
    );
  }

  // 404 — could be a real "serial not found" OR a gateway "key not activated" error.
  // Gateway 404 returns plain text "BACKEND RESPONSE STATUS: 404".
  if (response.status === 404) {
    if (
      bodyText.includes("BACKEND RESPONSE STATUS") ||
      bodyText.includes("register for an API key")
    ) {
      throw new TSDRUnavailableError(
        `TSDR API key is not activated for TSDR access. Visit account.uspto.gov/api-manager to subscribe your key.`,
        404
      );
    }
    return null; // genuine "trademark not found"
  }

  // 5xx = USPTO outage (retriable)
  if (response.status >= 500) {
    throw new TSDRUnavailableError(
      `TSDR returned ${response.status} for serial ${serialNumber}`,
      response.status
    );
  }

  // Other non-2xx
  if (!response.ok) {
    throw new TSDRUnavailableError(
      `TSDR returned unexpected status ${response.status}`,
      response.status
    );
  }

  // Check if the 200 response contains a notice/error instead of JSON
  if (
    bodyText.includes("register for an API key") ||
    bodyText.includes("status is currently unavailable")
  ) {
    throw new TSDRUnavailableError(
      `TSDR returned a notice page instead of data — API may be down or key is invalid`
    );
  }

  let json: Record<string, unknown>;
  try {
    json = JSON.parse(bodyText);
  } catch {
    throw new TSDRUnavailableError(
      `TSDR response for ${serialNumber} was not valid JSON`
    );
  }

  return parseTsdrResponse(json, serialNumber);
}
