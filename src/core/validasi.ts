import type { Skenario } from './types';

/**
 * Memeriksa parameter skenario. Mengembalikan daftar pesan kesalahan;
 * array kosong berarti skenario valid untuk disimulasikan.
 */
export function validasiSkenario(s: Skenario): string[] {
  const galat: string[] = [];
  const positif = (nilai: number, label: string) => {
    if (!Number.isFinite(nilai) || nilai <= 0) galat.push(`${label} harus lebih dari 0.`);
  };
  const nonNegatif = (nilai: number, label: string) => {
    if (!Number.isFinite(nilai) || nilai < 0) galat.push(`${label} tidak boleh negatif.`);
  };
  const rasio = (nilai: number, label: string) => {
    if (!Number.isFinite(nilai) || nilai < 0 || nilai > 1) galat.push(`${label} harus di antara 0 dan 1.`);
  };

  positif(s.lahan.lebar, 'Lebar lahan');
  positif(s.lahan.panjang, 'Panjang lahan');
  nonNegatif(s.lahan.cadanganRuangPublik, 'Cadangan ruang publik');
  nonNegatif(s.jalan.lebar, 'Lebar jalan');
  positif(s.kavling.lebar, 'Lebar kavling');
  positif(s.kavling.kedalaman, 'Kedalaman kavling');
  nonNegatif(s.bangunan.gsbDepan, 'GSB depan');
  nonNegatif(s.bangunan.gsbSamping, 'Jarak bebas samping');
  nonNegatif(s.bangunan.gsbBelakang, 'Jarak bebas belakang');
  positif(s.bangunan.tinggiLantai, 'Tinggi lantai');
  rasio(s.bangunan.rasioPerkerasan, 'Rasio perkerasan');
  nonNegatif(s.hunian.unitPerLantai, 'Unit per lantai');
  nonNegatif(s.hunian.jiwaPerUnit, 'Jiwa per unit');
  rasio(s.regulasi.kdbMaks, 'KDB maksimum');
  nonNegatif(s.regulasi.klbMaks, 'KLB maksimum');
  rasio(s.regulasi.kdhMin, 'KDH minimum');
  positif(s.regulasi.ketinggianMaks, 'Ketinggian maksimum');
  rasio(s.regulasi.psuMin, 'Proporsi PSU minimum');

  if (!Number.isInteger(s.bangunan.jumlahLantai) || s.bangunan.jumlahLantai < 1) {
    galat.push('Jumlah lantai harus bilangan bulat minimal 1.');
  }
  if (s.kavling.lebar > s.lahan.lebar) {
    galat.push('Lebar kavling melebihi lebar lahan.');
  }
  if (s.jalan.lebar + s.kavling.kedalaman > s.lahan.panjang - s.lahan.cadanganRuangPublik) {
    galat.push('Lahan terlalu pendek untuk satu jalan dan satu baris kavling.');
  }
  return galat;
}
