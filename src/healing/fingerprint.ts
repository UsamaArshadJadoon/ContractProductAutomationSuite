import type { Locator } from '@playwright/test';
import type { Fingerprint } from './types';

/** Capture a structural fingerprint from a live element. */
export async function captureFingerprint(locator: Locator): Promise<Fingerprint> {
  return locator.first().evaluate((el) => {
    const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 120);
    const ariaLabel = el.getAttribute('aria-label');
    return {
      tag: el.tagName.toLowerCase(),
      id: el.id || null,
      testId: el.getAttribute('data-testid'),
      role: el.getAttribute('role'),
      ariaLabel,
      text,
      name: (ariaLabel ?? text).trim(),
      classList: Array.from(el.classList),
    };
  });
}

function tokenSimilarity(a: string, b: string): number {
  const norm = (s: string) =>
    new Set(
      s
        .toLowerCase()
        .split(/[^a-z0-9؀-ۿ]+/i)
        .filter(Boolean),
    );
  const sa = norm(a);
  const sb = norm(b);
  if (sa.size === 0 && sb.size === 0) return 1;
  if (sa.size === 0 || sb.size === 0) return 0;
  let shared = 0;
  for (const t of sa) if (sb.has(t)) shared++;
  return shared / Math.max(sa.size, sb.size);
}

/**
 * Score how well a live candidate matches a stored fingerprint (0..1).
 * Weighted so strong, intentional hooks (test id, id, accessible name) dominate
 * and weak signals (classes) only break ties.
 */
export function scoreFingerprint(candidate: Fingerprint, stored: Fingerprint): number {
  const weights = { testId: 0.3, id: 0.15, role: 0.1, tag: 0.1, name: 0.3, classes: 0.05 };
  let score = 0;

  if (stored.testId) score += candidate.testId === stored.testId ? weights.testId : 0;
  else score += weights.testId * 0.5; // no test id to match — neutral partial credit

  if (stored.id) score += candidate.id === stored.id ? weights.id : 0;
  else score += weights.id * 0.5;

  score += candidate.tag === stored.tag ? weights.tag : 0;
  score += (candidate.role ?? '') === (stored.role ?? '') ? weights.role : 0;
  score += weights.name * tokenSimilarity(candidate.name, stored.name);

  const sharedClasses = candidate.classList.filter((c) => stored.classList.includes(c)).length;
  const maxClasses = Math.max(stored.classList.length, 1);
  score += weights.classes * (sharedClasses / maxClasses);

  return Math.min(1, score);
}
