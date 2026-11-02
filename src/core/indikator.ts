import type { ButirKepatuhan, Indikator, Persegi, Skenario, TataLetak } from './types';

const luas = (p: Persegi) => p.lebar * p.panjang;
const M2_PER_HA = 10_000;

/** Menghitung indikator intensitas pemanfaatan ruang dari sebuah tata letak. */
export function hitungIndikator(s: Skenario, t: TataLetak): Indikator {
  const luasLahan = luas(t.lahan);
  const luasJalan = t.jalan.reduce((a, j) => a + luas(j), 0);
  const luasKavling = t.kavling.reduce((a, k) => a + luas(k.batas), 0);
  const luasSisa = Math.max(0, luasLahan - luasJalan - luasKavling);

  const bangunan = t.kavling.flatMap((k) => (k.bangunan ? [k.bangunan] : []));
  const jumlahBangunan = bangunan.length;
  const luasTapakBangunan = bangunan.reduce((a, b) => a + luas(b), 0);
  const lantai = s.bangunan.jumlahLantai;
  const luasLantaiBangunan = luasTapakBangunan * lantai;

  const luasTerbukaKavling = luasKavling - luasTapakBangunan;
  const luasHijau = luasTerbukaKavling * (1 - s.bangunan.rasioPerkerasan);

  const bagi = (a: number, b: number) => (b > 0 ? a / b : 0);
  const jumlahUnit = jumlahBangunan * lantai * s.hunian.unitPerLantai;
  const jumlahJiwa = jumlahUnit * s.hunian.jiwaPerUnit;
  const ha = luasLahan / M2_PER_HA;

  return {
    luasLahan,
    luasJalan,
    luasKavling,
    luasSisa,
    jumlahKavling: t.kavling.length,
    jumlahBangunan,
    luasTapakBangunan,
    luasLantaiBangunan,
    kdb: bagi(luasTapakBangunan, luasKavling),
    klb: bagi(luasLantaiBangunan, luasKavling),
    kdh: bagi(luasHijau, luasKavling),
    proporsiPsu: bagi(luasJalan + luasSisa, luasLahan),
    cakupanBrutto: bagi(luasTapakBangunan, luasLahan),
    ketinggian: jumlahBangunan > 0 ? lantai * s.bangunan.tinggiLantai : 0,
    jumlahUnit,
    jumlahJiwa,
    unitPerHa: bagi(jumlahUnit, ha),
    jiwaPerHa: bagi(jumlahJiwa, ha),
  };
}

/** Membandingkan indikator dengan batas regulasi pada skenario. */
export function periksaKepatuhan(s: Skenario, i: Indikator): ButirKepatuhan[] {
  const r = s.regulasi;
  const butir = (
    kode: ButirKepatuhan['kode'],
    label: string,
    nilai: number,
    batas: number,
    jenisBatas: 'maks' | 'min',
  ): ButirKepatuhan => {
    // Toleransi kecil untuk galat pembulatan floating point.
    const patuh = jenisBatas === 'maks' ? nilai <= batas + 1e-9 : nilai >= batas - 1e-9;
    return { kode, label, nilai, batas, jenisBatas, status: patuh ? 'patuh' : 'melanggar' };
  };
  return [
    butir('KDB', 'Koefisien Dasar Bangunan', i.kdb, r.kdbMaks, 'maks'),
    butir('KLB', 'Koefisien Lantai Bangunan', i.klb, r.klbMaks, 'maks'),
    butir('KDH', 'Koefisien Dasar Hijau', i.kdh, r.kdhMin, 'min'),
    butir('TINGGI', 'Ketinggian bangunan (m)', i.ketinggian, r.ketinggianMaks, 'maks'),
    butir('PSU', 'Proporsi prasarana & ruang publik', i.proporsiPsu, r.psuMin, 'min'),
  ];
}

export interface HasilSimulasi {
  tataLetak: TataLetak;
  indikator: Indikator;
  kepatuhan: ButirKepatuhan[];
}
