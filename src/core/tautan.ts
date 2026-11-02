import { skenarioDariJson } from './serialisasi';
import type { Skenario } from './types';

/** Awalan fragmen URL, mis. `#s=eyJ...`. */
export const AWALAN_HASH = 's=';

/** Mengodekan skenario menjadi fragmen URL (base64url dari JSON UTF-8). */
export function skenarioKeHash(s: Skenario): string {
  const byte = new TextEncoder().encode(JSON.stringify(s));
  let biner = '';
  for (const b of byte) biner += String.fromCharCode(b);
  const b64 = btoa(biner).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `#${AWALAN_HASH}${b64}`;
}

/**
 * Membaca skenario dari fragmen URL. Mengembalikan null bila fragmen tidak
 * memuat skenario atau tidak dapat dibaca; field yang hilang diisi dari `dasar`.
 */
export function skenarioDariHash(hash: string, dasar: Skenario): Skenario | null {
  const isi = hash.replace(/^#/, '');
  if (!isi.startsWith(AWALAN_HASH)) return null;
  const b64 = isi.slice(AWALAN_HASH.length).replace(/-/g, '+').replace(/_/g, '/');
  try {
    const biner = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
    const byte = Uint8Array.from(biner, (c) => c.charCodeAt(0));
    return skenarioDariJson(new TextDecoder('utf-8', { fatal: true }).decode(byte), dasar);
  } catch {
    return null;
  }
}
