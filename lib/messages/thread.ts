/**
 * Thread ID generation — server-side only.
 *
 * thread_id is UUID v5 derived from a sorted (attorney_id, founder_id) pair.
 * Deterministic: same pair always produces the same thread_id.
 * Symmetric: order of arguments does not matter.
 *
 * NEVER call this from a client component.
 * The client always receives thread_id from the server.
 */

import { v5 as uuidv5 } from "uuid";

// Fixed namespace UUID for Markman thread IDs
// Generated once: do not change — changing breaks all existing thread_id lookups
const THREAD_NAMESPACE = "6ba7b810-9dad-11d1-80b4-00c04fd430c8"; // UUID v5 URL namespace

/**
 * Generate a deterministic, symmetric thread_id for an attorney-founder pair.
 *
 * @param userIdA - First user's UUID (order does not matter)
 * @param userIdB - Second user's UUID (order does not matter)
 * @returns UUID v5 string, compatible with Postgres UUID column
 */
export function generateThreadId(userIdA: string, userIdB: string): string {
  // Sort UUIDs so the result is the same regardless of argument order
  const sorted = [userIdA, userIdB].sort();
  const name = sorted.join("|");
  return uuidv5(name, THREAD_NAMESPACE);
}
