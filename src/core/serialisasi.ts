import type { Skenario } from './types';

export const VERSI_FORMAT = 1;

export function skenarioKeJson(s: Skenario): string {
  return JSON.stringify({ versi: VERSI_FORMAT, skenario: s }, null, 2);
}

/**
 * Membaca skenario dari teks JSON. Menerima format berbungkus
 * `{ versi, skenario }` maupun objek skenario langsung. Field yang hilang
 * diisi dari `dasar` sehingga berkas lama tetap bisa dimuat.
 */
export function skenarioDariJson(teks: string, dasar: Skenario): Skenario {
  let data: unknown;
  try {
    data = JSON.parse(teks);
  } catch {
    throw new Error('Berkas bukan JSON yang valid.');
  }
  if (!isObjek(data)) throw new Error('Format skenario tidak dikenali.');
  const mentah = isObjek(data.skenario) ? data.skenario : data;
  return gabung(dasar, mentah) as Skenario;
}

function isObjek(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Menggabungkan nilai `masukan` ke struktur `dasar`, hanya untuk kunci dan tipe yang dikenal. */
function gabung(dasar: unknown, masukan: unknown): unknown {
  if (isObjek(dasar)) {
    const hasil: Record<string, unknown> = {};
    const m = isObjek(masukan) ? masukan : {};
    for (const [k, v] of Object.entries(dasar)) hasil[k] = gabung(v, m[k]);
    return hasil;
  }
  if (typeof dasar === 'number') return typeof masukan === 'number' ? masukan : dasar;
  if (typeof dasar === 'string') return typeof masukan === 'string' ? masukan : dasar;
  return dasar;
}
