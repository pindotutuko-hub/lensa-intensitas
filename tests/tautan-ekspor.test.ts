import { describe, expect, it } from 'vitest';
import {
  PRESET,
  hasilKeCsv,
  jalankanSimulasi,
  salinSkenario,
  skenarioDariHash,
  skenarioKeHash,
  type Skenario,
} from '../src/core';

const dasar = (): Skenario => salinSkenario(PRESET.tapak!);

describe('tautan (hash URL)', () => {
  it('pulang-pergi menghasilkan skenario yang sama, termasuk karakter non-ASCII', () => {
    const s = salinSkenario(PRESET.rusun!);
    s.nama = 'Kampung Ngawi — tahap 2 ✓';
    s.bangunan.jumlahLantai = 7;
    const hash = skenarioKeHash(s);
    expect(hash).toMatch(/^#s=[A-Za-z0-9_-]+$/); // aman untuk URL, tanpa padding
    expect(skenarioDariHash(hash, dasar())).toEqual(s);
    expect(skenarioDariHash(hash.slice(1), dasar())).toEqual(s); // tanpa '#'
  });

  it('mengembalikan null untuk hash kosong, asing, atau rusak', () => {
    expect(skenarioDariHash('', dasar())).toBeNull();
    expect(skenarioDariHash('#bagian-lain', dasar())).toBeNull();
    expect(skenarioDariHash('#s=@@@', dasar())).toBeNull();
    expect(skenarioDariHash('#s=' + btoa('bukan json'), dasar())).toBeNull();
  });

  it('mengisi field yang hilang dari skenario dasar (tautan versi lama)', () => {
    const lama = { nama: 'lama', lahan: { lebar: 80, panjang: 60 } };
    const b64 = btoa(JSON.stringify(lama)).replace(/=+$/, '');
    const s = skenarioDariHash(`#s=${b64}`, dasar())!;
    expect(s.lahan).toEqual({ lebar: 80, panjang: 60, cadanganRuangPublik: dasar().lahan.cadanganRuangPublik });
    expect(s.regulasi).toEqual(dasar().regulasi);
  });
});

describe('hasilKeCsv', () => {
  const s = dasar();
  const r = jalankanSimulasi(s);
  if (!r.ok) throw new Error(r.galat.join());
  const csv = hasilKeCsv(s, r.hasil);
  const baris = csv.trimEnd().split('\r\n');

  it('memiliki header dan baris CRLF dengan jumlah kolom tetap', () => {
    expect(baris[0]).toBe('bagian,nama,nilai,satuan_atau_batas,status');
    for (const b of baris) expect(b.split(',')).toHaveLength(5);
    expect(csv.endsWith('\r\n')).toBe(true);
  });

  it('memuat parameter, indikator, dan kepatuhan', () => {
    expect(baris).toContain('parameter,lahan.lebar,120,,');
    expect(baris).toContain('indikator,Jumlah kavling,48,,');
    expect(baris).toContain('kepatuhan,KDB,0.4667,<= 0.6,patuh');
    expect(baris.filter((b) => b.startsWith('kepatuhan,'))).toHaveLength(5);
  });

  it('meng-escape nama yang mengandung koma dan tanda kutip', () => {
    const t = dasar();
    t.nama = 'Blok "A", tahap 1';
    const isi = hasilKeCsv(t, r.hasil);
    expect(isi).toContain('skenario,nama,"Blok ""A"", tahap 1",,');
  });
});
