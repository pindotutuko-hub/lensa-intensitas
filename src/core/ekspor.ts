import type { HasilSimulasi } from './indikator';
import type { Indikator, Skenario } from './types';

const LABEL_INDIKATOR: [keyof Indikator, string, string][] = [
  ['luasLahan', 'Luas lahan', 'm2'],
  ['luasJalan', 'Luas jalan', 'm2'],
  ['luasKavling', 'Luas kavling', 'm2'],
  ['luasSisa', 'Lahan sisa/ruang publik', 'm2'],
  ['jumlahKavling', 'Jumlah kavling', ''],
  ['jumlahBangunan', 'Jumlah bangunan', ''],
  ['luasTapakBangunan', 'Luas tapak bangunan', 'm2'],
  ['luasLantaiBangunan', 'Luas lantai bangunan', 'm2'],
  ['kdb', 'KDB', ''],
  ['klb', 'KLB', ''],
  ['kdh', 'KDH', ''],
  ['proporsiPsu', 'Proporsi PSU', ''],
  ['cakupanBrutto', 'Cakupan brutto', ''],
  ['ketinggian', 'Ketinggian', 'm'],
  ['jumlahUnit', 'Jumlah unit', 'unit'],
  ['jumlahJiwa', 'Jumlah jiwa', 'jiwa'],
  ['unitPerHa', 'Kepadatan unit', 'unit/ha'],
  ['jiwaPerHa', 'Kepadatan penduduk', 'jiwa/ha'],
];

/** Membulatkan agar angka CSV rapi tanpa kehilangan presisi berarti. */
const angka = (n: number) => String(Math.round(n * 10_000) / 10_000);

function sel(v: string): string {
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

/**
 * Menyusun CSV (pemisah koma, desimal titik) berisi parameter skenario,
 * indikator, dan kepatuhan. Kolom: bagian, nama, nilai, satuan/batas, status.
 */
export function hasilKeCsv(s: Skenario, h: HasilSimulasi): string {
  const baris: string[][] = [['bagian', 'nama', 'nilai', 'satuan_atau_batas', 'status']];
  baris.push(['skenario', 'nama', s.nama, '', '']);
  for (const [kelompok, isi] of Object.entries(s)) {
    if (typeof isi !== 'object' || isi === null) continue;
    for (const [kunci, nilai] of Object.entries(isi as Record<string, number>)) {
      baris.push(['parameter', `${kelompok}.${kunci}`, angka(nilai), '', '']);
    }
  }
  for (const [kunci, label, satuan] of LABEL_INDIKATOR) {
    baris.push(['indikator', label, angka(h.indikator[kunci]), satuan, '']);
  }
  for (const b of h.kepatuhan) {
    baris.push([
      'kepatuhan',
      b.kode,
      angka(b.nilai),
      `${b.jenisBatas === 'maks' ? '<=' : '>='} ${angka(b.batas)}`,
      b.status,
    ]);
  }
  return baris.map((r) => r.map(sel).join(',')).join('\r\n') + '\r\n';
}
