import fs from 'node:fs';
import path from 'node:path';
import type { Fingerprint } from './types';

/**
 * Persistent fingerprint store (committed to the repo). The suite refreshes a
 * key's fingerprint whenever its primary locator works, and reads it back to
 * heal when the primary later fails.
 */
const STORE_PATH = path.resolve('healing', 'fingerprints.json');

type StoreShape = Record<string, Fingerprint>;

function read(): StoreShape {
  try {
    return JSON.parse(fs.readFileSync(STORE_PATH, 'utf8')) as StoreShape;
  } catch {
    return {};
  }
}

export function getFingerprint(key: string): Fingerprint | undefined {
  return read()[key];
}

export function saveFingerprint(key: string, fingerprint: Fingerprint): void {
  const store = read();
  store[key] = fingerprint;
  fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
  fs.writeFileSync(STORE_PATH, `${JSON.stringify(store, null, 2)}\n`, 'utf8');
}
