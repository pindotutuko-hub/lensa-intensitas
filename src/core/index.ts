import { bangkitkanTataLetak } from './generator';
import { hitungIndikator, periksaKepatuhan, type HasilSimulasi } from './indikator';
import type { Skenario } from './types';
import { validasiSkenario } from './validasi';

export * from './types';
export * from './generator';
export * from './indikator';
export * from './preset';
export * from './validasi';
export * from './serialisasi';

export type HasilJalankan = { ok: true; hasil: HasilSimulasi } | { ok: false; galat: string[] };

/** Validasi → bangkitkan tata letak → hitung indikator → periksa kepatuhan. */
export function jalankanSimulasi(s: Skenario): HasilJalankan {
  const galat = validasiSkenario(s);
  if (galat.length > 0) return { ok: false, galat };
  const tataLetak = bangkitkanTataLetak(s);
  const indikator = hitungIndikator(s, tataLetak);
  return { ok: true, hasil: { tataLetak, indikator, kepatuhan: periksaKepatuhan(s, indikator) } };
}
