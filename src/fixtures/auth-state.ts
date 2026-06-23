import fs from 'node:fs';
import path from 'node:path';
import type { Role } from '../config/env';

/** Directory where per-role authenticated storage states are written (git-ignored). */
export const AUTH_DIR = path.resolve('.auth');

/** Storage-state file path for a role's reusable session. */
export function authFile(role: Role): string {
  return path.join(AUTH_DIR, `${role}.json`);
}

/** How long a saved session is trusted before setup re-mints it. */
export const SESSION_MAX_AGE_MS = Number(process.env.SESSION_MAX_AGE_MS ?? `${2 * 60 * 60 * 1000}`);

/**
 * True when a role already has a recently-saved session. Setup reuses it
 * instead of logging in again — the key to staying under the login rate limit
 * (HTTP 429) across repeated runs.
 */
export function sessionIsFresh(role: Role, maxAgeMs = SESSION_MAX_AGE_MS): boolean {
  try {
    const stat = fs.statSync(authFile(role));
    return stat.size > 0 && Date.now() - stat.mtimeMs < maxAgeMs;
  } catch {
    return false;
  }
}
