import { describe, expect, it } from 'vitest';
import {
  PRESET,
  bangkitkanTataLetak,
  hitungIndikator,
  jalankanSimulasi,
  periksaKepatuhan,
  skenarioDariJson,
  skenarioKeJson,
  tapakBangunan,
  validasiSkenario,
  type Persegi,
  type Skenario,
} from '../src/core';

/** Skenario kecil dengan nilai yang mudah dihitung manual. */
const kecil = (): Skenario => ({
  nama: 'uji',
  lahan: { lebar: 30, panjang: 40, cadanganRuangPublik: 0 },
  jalan: { lebar: 4 },
  kavling: { lebar: 10, kedalaman: 12 },
  bangunan: { gsbDepan: 2, gsbSamping: 1, gsbBelakang: 2, jumlahLantai: 2, tinggiLantai: 3, rasioPerkerasan: 0.5 },
  hunian: { unitPerLantai: 0.5, jiwaPerUnit: 4 },
  regulasi: { kdbMaks: 0.6, klbMaks: 1.2, kdhMin: 0.2, ketinggianMaks: 12, psuMin: 0.3 },
});

const tumpang = (a: Persegi, b: Persegi) =>
  a.x < b.x + b.lebar - 1e-9 &&
  b.x < a.x + a.lebar - 1e-9 &&
  a.y < b.y + b.panjang - 1e-9 &&
  b.y < a.y + a.panjang - 1e-9;

const dalam = (a: Persegi, wadah: Persegi) =>
  a.x >= wadah.x - 1e-9 &&
  a.y >= wadah.y - 1e-9 &&
  a.x + a.lebar <= wadah.x + wadah.lebar + 1e-9 &&
  a.y + a.panjang <= wadah.y + wadah.panjang + 1e-9;

describe('bangkitkanTataLetak', () => {
  it('membentuk jalan → dua baris kavling → jalan, menyisakan lahan di utara', () => {
    const t = bangkitkanTataLetak(kecil());
    expect(t.kavling).toHaveLength(6);
    expect(t.jalan.map((j) => j.y)).toEqual([0, 28]);
    expect(t.kavling.filter((k) => k.arahMuka === 'selatan').every((k) => k.batas.y === 4)).toBe(true);
    expect(t.kavling.filter((k) => k.arahMuka === 'utara').every((k) => k.batas.y === 16)).toBe(true);
  });

  it('setiap kavling bersebelahan dengan jalan di sisi mukanya', () => {
    for (const s of [kecil(), ...Object.values(PRESET)]) {
      const t = bangkitkanTataLetak(s);
      for (const k of t.kavling) {
        const yMuka = k.arahMuka === 'selatan' ? k.batas.y : k.batas.y + k.batas.panjang;
        const adaJalan = t.jalan.some((j) =>
          k.arahMuka === 'selatan'
            ? Math.abs(j.y + j.panjang - yMuka) < 1e-9
            : Math.abs(j.y - yMuka) < 1e-9,
        );
        expect(adaJalan, `${s.nama} ${k.id}`).toBe(true);
      }
    }
  });

  it('tidak ada elemen yang tumpang tindih dan semua berada di dalam lahan', () => {
    for (const s of Object.values(PRESET)) {
      const t = bangkitkanTataLetak(s);
      const semua = [...t.jalan, ...t.kavling.map((k) => k.batas)];
      for (const p of semua) expect(dalam(p, t.lahan)).toBe(true);
      for (let i = 0; i < semua.length; i++) {
        for (let j = i + 1; j < semua.length; j++) expect(tumpang(semua[i]!, semua[j]!)).toBe(false);
      }
      for (const k of t.kavling) if (k.bangunan) expect(dalam(k.bangunan, k.batas)).toBe(true);
    }
  });

  it('membuat blok satu baris bila tidak cukup ruang untuk baris kedua dan jalannya', () => {
    const s = kecil();
    s.lahan.panjang = 20; // jalan 4 + baris 12 = 16; baris kedua butuh 12 + jalan 4
    const t = bangkitkanTataLetak(s);
    expect(t.kavling).toHaveLength(3);
    expect(t.kavling.every((k) => k.arahMuka === 'selatan')).toBe(true);
    expect(t.jalan).toHaveLength(1);
  });

  it('tidak mengisi jalur cadangan ruang publik di tepi utara', () => {
    const s = kecil();
    s.lahan.panjang = 48;
    s.lahan.cadanganRuangPublik = 8; // area efektif 40 m, sama dengan skenario dasar
    const t = bangkitkanTataLetak(s);
    expect(t.kavling).toHaveLength(6);
    const batasUtara = Math.max(...[...t.jalan, ...t.kavling.map((k) => k.batas)].map((p) => p.y + p.panjang));
    expect(batasUtara).toBeLessThanOrEqual(40);
    expect(hitungIndikator(s, t).luasSisa).toBe(240 + 8 * 30);
  });

  it('mengembalikan tata letak kosong bila kavling lebih lebar dari lahan', () => {
    const s = kecil();
    s.kavling.lebar = 50;
    expect(bangkitkanTataLetak(s).kavling).toHaveLength(0);
  });
});

describe('tapakBangunan', () => {
  it('menempatkan GSB depan di sisi yang menghadap jalan', () => {
    const s = kecil();
    const batas = { x: 0, y: 10, lebar: 10, panjang: 12 };
    s.bangunan.gsbDepan = 4;
    s.bangunan.gsbBelakang = 1;
    expect(tapakBangunan(s, batas, 'selatan')).toEqual({ x: 1, y: 14, lebar: 8, panjang: 7 });
    expect(tapakBangunan(s, batas, 'utara')).toEqual({ x: 1, y: 11, lebar: 8, panjang: 7 });
  });

  it('null bila sempadan menghabiskan kavling', () => {
    const s = kecil();
    s.bangunan.gsbSamping = 5;
    expect(tapakBangunan(s, { x: 0, y: 0, lebar: 10, panjang: 12 }, 'selatan')).toBeNull();
  });
});

describe('hitungIndikator', () => {
  it('menghitung luas, koefisien dan kepadatan sesuai hitungan manual', () => {
    const s = kecil();
    const i = hitungIndikator(s, bangkitkanTataLetak(s));
    expect(i.luasLahan).toBe(1200);
    expect(i.luasJalan).toBe(240);
    expect(i.luasKavling).toBe(720);
    expect(i.luasSisa).toBe(240);
    expect(i.jumlahBangunan).toBe(6);
    expect(i.luasTapakBangunan).toBe(384); // 6 × (8 × 8)
    expect(i.luasLantaiBangunan).toBe(768);
    expect(i.kdb).toBeCloseTo(384 / 720);
    expect(i.klb).toBeCloseTo(768 / 720);
    expect(i.kdh).toBeCloseTo((336 * 0.5) / 720);
    expect(i.proporsiPsu).toBeCloseTo(0.4);
    expect(i.cakupanBrutto).toBeCloseTo(0.32);
    expect(i.ketinggian).toBe(6);
    expect(i.jumlahUnit).toBe(6);
    expect(i.jumlahJiwa).toBe(24);
    expect(i.unitPerHa).toBeCloseTo(50);
    expect(i.jiwaPerHa).toBeCloseTo(200);
  });

  it('bernilai nol tanpa pembagian dengan nol bila tidak ada kavling', () => {
    const s = kecil();
    s.kavling.lebar = 50;
    const i = hitungIndikator(s, bangkitkanTataLetak(s));
    expect(i.kdb).toBe(0);
    expect(i.klb).toBe(0);
    expect(i.ketinggian).toBe(0);
  });
});

describe('periksaKepatuhan', () => {
  it('menandai KLB dan ketinggian melanggar saat lantai ditambah', () => {
    const s = kecil();
    s.bangunan.jumlahLantai = 5; // KLB 2,67; tinggi 15 m
    const k = periksaKepatuhan(s, hitungIndikator(s, bangkitkanTataLetak(s)));
    const status = Object.fromEntries(k.map((b) => [b.kode, b.status]));
    expect(status).toEqual({ KDB: 'patuh', KLB: 'melanggar', KDH: 'patuh', TINGGI: 'melanggar', PSU: 'patuh' });
  });

  it('nilai tepat pada batas dianggap patuh', () => {
    const s = kecil();
    s.lahan.panjang = 32; // tanpa lahan sisa → PSU = 240 / 960 = 0,25
    s.regulasi.psuMin = 0.25;
    const k = periksaKepatuhan(s, hitungIndikator(s, bangkitkanTataLetak(s)));
    expect(k.find((b) => b.kode === 'PSU')?.status).toBe('patuh');
  });
});

describe('validasiSkenario & jalankanSimulasi', () => {
  it('semua preset valid dan dapat disimulasikan', () => {
    for (const s of Object.values(PRESET)) {
      expect(validasiSkenario(s)).toEqual([]);
      const r = jalankanSimulasi(s);
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.hasil.indikator.jumlahBangunan).toBeGreaterThan(0);
    }
  });

  it('semua preset memenuhi batas regulasinya sendiri sebagai titik awal', () => {
    for (const s of Object.values(PRESET)) {
      const r = jalankanSimulasi(s);
      if (!r.ok) throw new Error(r.galat.join(' '));
      const gagal = r.hasil.kepatuhan.filter((b) => b.status !== 'patuh').map((b) => b.kode);
      expect(gagal, s.nama).toEqual([]);
    }
  });

  it('menolak cadangan ruang publik yang menghabiskan lahan', () => {
    const s = kecil();
    s.lahan.cadanganRuangPublik = 30;
    expect(validasiSkenario(s)).toContain('Lahan terlalu pendek untuk satu jalan dan satu baris kavling.');
  });

  it('menolak parameter tidak valid', () => {
    const s = kecil();
    s.lahan.lebar = -1;
    s.bangunan.jumlahLantai = 1.5;
    s.regulasi.kdbMaks = 1.2;
    const r = jalankanSimulasi(s);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.galat.length).toBeGreaterThanOrEqual(3);
  });
});

describe('serialisasi', () => {
  it('pulang-pergi JSON menghasilkan skenario yang sama', () => {
    const s = kecil();
    expect(skenarioDariJson(skenarioKeJson(s), PRESET.tapak!)).toEqual(s);
  });

  it('mengisi field yang hilang dan mengabaikan tipe yang salah', () => {
    const hasil = skenarioDariJson(
      JSON.stringify({ lahan: { lebar: 55, panjang: '100' }, asing: 1 }),
      kecil(),
    );
    expect(hasil.lahan).toEqual({ lebar: 55, panjang: 40, cadanganRuangPublik: 0 });
    expect(hasil.jalan).toEqual(kecil().jalan);
    expect(hasil).not.toHaveProperty('asing');
  });

  it('melempar galat untuk JSON rusak', () => {
    expect(() => skenarioDariJson('{', kecil())).toThrow(/JSON/);
    expect(() => skenarioDariJson('[1]', kecil())).toThrow();
  });
});
