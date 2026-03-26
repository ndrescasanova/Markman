/**
 * TSDR abstraction types (D3).
 * All USPTO TSDR API responses must be normalized to TrademarkRecord
 * before touching the database. If USPTO changes their response format,
 * only lib/uspto/tsdr.ts needs to change — nothing else.
 */

export type TrademarkStatus =
  | "PENDING"
  | "REGISTERED"
  | "ABANDONED"
  | "OFFICE_ACTION"
  | "CANCELLED"
  | "UNKNOWN";

export interface TrademarkRecord {
  serialNumber: string;
  registrationNumber: string | null;
  markName: string;
  status: TrademarkStatus;
  filingDate: string | null;       // ISO date string (YYYY-MM-DD) or null
  registrationDate: string | null; // ISO date string (YYYY-MM-DD) or null
  expirationDate: string | null;   // ISO date string (YYYY-MM-DD) or null — derived (reg + 10y)
  ownerName: string | null;
  goodsServices: string | null;
  internationalClass: string | null;
}

/** Thrown when USPTO TSDR returns a 5xx or times out */
export class TSDRUnavailableError extends Error {
  constructor(message: string, public readonly statusCode?: number) {
    super(message);
    this.name = "TSDRUnavailableError";
  }
}

/** Thrown when the TSDR response body cannot be parsed */
export class TSDRParseError extends Error {
  constructor(message: string, public readonly rawResponse?: unknown) {
    super(message);
    this.name = "TSDRParseError";
  }
}
