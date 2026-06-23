import path from 'node:path';
import type { Role } from '../config/env';

/** Directory where per-role authenticated storage states are written (git-ignored). */
export const AUTH_DIR = path.resolve('.auth');

/** Storage-state file path for a role's reusable session. */
export function authFile(role: Role): string {
  return path.join(AUTH_DIR, `${role}.json`);
}
