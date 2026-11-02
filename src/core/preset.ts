import type { Skenario } from './types';

/**
 * Skenario contoh. Batas regulasi adalah nilai ilustratif yang umum dijumpai
 * pada zona perumahan; sesuaikan dengan RDTR/PZ daerah yang dikaji.
 */
export const PRESET: Record<string, Skenario> = {
  tapak: {
    nama: 'Rumah tapak (kepadatan sedang)',
    lahan: { lebar: 120, panjang: 100, cadanganRuangPublik: 10 },
    jalan: { lebar: 6 },
    kavling: { lebar: 10, kedalaman: 15 },
    bangunan: {
      gsbDepan: 3,
      gsbSamping: 1.5,
      gsbBelakang: 2,
      jumlahLantai: 2,
      tinggiLantai: 3.5,
      rasioPerkerasan: 0.3,
    },
    hunian: { unitPerLantai: 0.5, jiwaPerUnit: 4 },
    regulasi: { kdbMaks: 0.6, klbMaks: 1.2, kdhMin: 0.2, ketinggianMaks: 12, psuMin: 0.3 },
  },
  deret: {
    nama: 'Rumah deret (kepadatan tinggi)',
    lahan: { lebar: 120, panjang: 100, cadanganRuangPublik: 10 },
    jalan: { lebar: 5 },
    kavling: { lebar: 6, kedalaman: 12 },
    bangunan: {
      gsbDepan: 2.5,
      gsbSamping: 0,
      gsbBelakang: 1.5,
      jumlahLantai: 2,
      tinggiLantai: 3.2,
      rasioPerkerasan: 0.4,
    },
    hunian: { unitPerLantai: 0.5, jiwaPerUnit: 4 },
    regulasi: { kdbMaks: 0.7, klbMaks: 1.4, kdhMin: 0.1, ketinggianMaks: 12, psuMin: 0.3 },
  },
  rusun: {
    nama: 'Rumah susun (vertikal)',
    lahan: { lebar: 120, panjang: 100, cadanganRuangPublik: 10 },
    jalan: { lebar: 8 },
    kavling: { lebar: 40, kedalaman: 30 },
    bangunan: {
      gsbDepan: 6,
      gsbSamping: 6,
      gsbBelakang: 4,
      jumlahLantai: 5,
      tinggiLantai: 3.2,
      rasioPerkerasan: 0.35,
    },
    hunian: { unitPerLantai: 12, jiwaPerUnit: 3.5 },
    regulasi: { kdbMaks: 0.5, klbMaks: 2.5, kdhMin: 0.2, ketinggianMaks: 20, psuMin: 0.3 },
  },
};

export const PRESET_AWAL = 'tapak';

export function salinSkenario(s: Skenario): Skenario {
  return structuredClone(s);
}
