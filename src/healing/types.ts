/** A structural fingerprint of a DOM element, used to re-find it when the
 * primary locator stops matching. Captured from a healthy run and compared
 * against live candidates during healing. */
export interface Fingerprint {
  tag: string;
  id: string | null;
  testId: string | null;
  role: string | null;
  ariaLabel: string | null;
  /** Trimmed, truncated text content. */
  text: string;
  /** A stable-ish accessible name (aria-label || text). */
  name: string;
  classList: string[];
}

/** One healing event, written to the healing report. */
export interface HealEvent {
  key: string;
  /** Match score (0..1) of the chosen candidate against the stored fingerprint. */
  score: number;
  threshold: number;
  /** How the fallback candidate was located. */
  strategy: string;
  primarySelector: string;
  chosen: Fingerprint;
  timestampMs: number;
}
