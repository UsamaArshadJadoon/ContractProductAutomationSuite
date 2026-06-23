import { type Locator, type Page } from '@playwright/test';
import { config } from '../config/env';
import { scoreFingerprint, captureFingerprint } from './fingerprint';
import { getFingerprint, saveFingerprint } from './store';
import { recordHeal } from './report';
import type { Fingerprint } from './types';

/**
 * Self-healing locator wrapper.
 *
 * `locate(key, primary)`:
 *   1. Try the primary locator. If it resolves, refresh the stored fingerprint
 *      and return it (the happy path — no healing).
 *   2. If the primary misses, score every live candidate against the stored
 *      fingerprint and return the best match **only if** it clears the
 *      configurable confidence threshold — logging the heal to the report.
 *      Below threshold (or no fingerprint) it THROWS — never a silent pass.
 *
 * A healed element is still only as trustworthy as the test's functional
 * assertion: a wrong-but-similar heal must be caught by asserting the real
 * outcome (see the heal-should-fail demo).
 */
export class SelfHealingLocator {
  constructor(
    private readonly page: Page,
    private readonly probeTimeoutMs = 2000,
  ) {}

  async locate(key: string, primary: Locator, primarySelector = key): Promise<Locator> {
    if (!config.healing.enabled) return primary;

    try {
      await primary.first().waitFor({ state: 'attached', timeout: this.probeTimeoutMs });
      saveFingerprint(key, await captureFingerprint(primary));
      return primary;
    } catch {
      return this.heal(key, primarySelector);
    }
  }

  private async heal(key: string, primarySelector: string): Promise<Locator> {
    const stored = getFingerprint(key);
    if (!stored) {
      throw new Error(
        `[self-heal] No stored fingerprint for "${key}"; cannot heal primary "${primarySelector}".`,
      );
    }

    const candidates = await this.candidateFingerprints(stored.tag);
    let bestIndex = -1;
    let bestScore = -1;
    candidates.forEach((candidate, index) => {
      const score = scoreFingerprint(candidate, stored);
      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });

    const threshold = config.healing.confidenceThreshold;
    if (bestIndex < 0 || bestScore < threshold) {
      throw new Error(
        `[self-heal] "${key}": best candidate score ${bestScore.toFixed(2)} < threshold ` +
          `${threshold}. Refusing to heal (no silent pass).`,
      );
    }

    recordHeal({
      key,
      score: bestScore,
      threshold,
      strategy: `${stored.tag}:nth(${bestIndex}) by fingerprint`,
      primarySelector,
      chosen: candidates[bestIndex],
      timestampMs: Date.now(),
    });
    return this.page.locator(stored.tag).nth(bestIndex);
  }

  /** Fingerprint every live element of `tag` (capped), scored in Node. */
  private async candidateFingerprints(tag: string): Promise<Fingerprint[]> {
    return this.page.locator(tag).evaluateAll((els) =>
      els.slice(0, 300).map((el) => {
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
      }),
    );
  }
}
