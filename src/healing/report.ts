import fs from 'node:fs';
import path from 'node:path';
import type { HealEvent } from './types';

/**
 * Append-only healing report (git-ignored runtime artifact, surfaced as a CI
 * artifact). Every heal is recorded here AND logged to the console so a healed
 * step is never silent.
 */
const REPORT_DIR = path.resolve('healing-report');
const REPORT_PATH = path.join(REPORT_DIR, 'healing-report.json');

export function recordHeal(event: HealEvent): void {
  const existing: HealEvent[] = (() => {
    try {
      return JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8')) as HealEvent[];
    } catch {
      return [];
    }
  })();
  existing.push(event);
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.writeFileSync(REPORT_PATH, `${JSON.stringify(existing, null, 2)}\n`, 'utf8');

  console.warn(
    `[self-heal] "${event.key}" primary "${event.primarySelector}" failed → ` +
      `healed via ${event.strategy} (score ${event.score.toFixed(2)} ≥ ${event.threshold}).`,
  );
}
