import type { ArahMuka, Kavling, Persegi, Skenario, TataLetak } from './types';

const EPS = 1e-9;

/**
 * Membangkitkan tata letak grid sederhana.
 *
 * Pola dari selatan (y = 0) ke utara:
 *   jalan → blok (dua baris kavling saling membelakangi) → jalan → blok → …
 * Baris selatan sebuah blok menghadap jalan di selatannya, baris utara menghadap
 * jalan di utaranya. Bila tidak ada ruang untuk jalan di utara, baris kedua tidak
 * dibuat (blok satu baris) agar setiap kavling tetap memiliki akses jalan.
 * Jalur cadangan ruang publik di tepi utara tidak diisi. Lahan yang tidak terpakai
 * dicatat sebagai sisa (ruang terbuka).
 */
export function bangkitkanTataLetak(s: Skenario): TataLetak {
  const lahan: Persegi = { x: 0, y: 0, lebar: s.lahan.lebar, panjang: s.lahan.panjang };
  const jalan: Persegi[] = [];
  const kavling: Kavling[] = [];

  const lj = s.jalan.lebar;
  // Batas utara area yang boleh diisi jalan dan kavling.
  const P = s.lahan.panjang - s.lahan.cadanganRuangPublik;
  const d = s.kavling.kedalaman;
  const kolom = Math.floor(s.lahan.lebar / s.kavling.lebar + EPS);
  if (kolom < 1) return { lahan, jalan, kavling };

  const tambahJalan = (y: number) => {
    if (lj > 0) jalan.push({ x: 0, y, lebar: s.lahan.lebar, panjang: lj });
  };

  let y = 0;
  let blok = 0;
  // Jalan pertama di tepi selatan.
  if (lj + d > P + EPS) return { lahan, jalan, kavling };
  tambahJalan(0);
  y = lj;

  while (y + d <= P + EPS) {
    // Baris selatan menghadap jalan di bawahnya.
    tambahBaris(s, kavling, blok, 0, y, kolom, 'selatan');
    y += d;

    // Baris utara hanya bila masih ada ruang untuk barisnya dan jalan di atasnya.
    if (y + d + lj <= P + EPS) {
      tambahBaris(s, kavling, blok, 1, y, kolom, 'utara');
      y += d;
    }

    // Jalan di utara blok bila masih ada blok berikutnya yang muat.
    if (y + lj + d <= P + EPS) {
      tambahJalan(y);
      y += lj;
      blok += 1;
    } else {
      // Bila baris utara sudah dibuat, jalan aksesnya wajib ada.
      const adaBarisUtara = kavling.some((k) => k.blok === blok && k.arahMuka === 'utara');
      if (adaBarisUtara) tambahJalan(y);
      break;
    }
  }

  return { lahan, jalan, kavling };
}

function tambahBaris(
  s: Skenario,
  daftar: Kavling[],
  blok: number,
  baris: number,
  y: number,
  kolom: number,
  arahMuka: ArahMuka,
): void {
  for (let i = 0; i < kolom; i++) {
    const batas: Persegi = { x: i * s.kavling.lebar, y, lebar: s.kavling.lebar, panjang: s.kavling.kedalaman };
    daftar.push({
      id: `B${blok + 1}-${baris === 0 ? 'S' : 'U'}${i + 1}`,
      blok,
      batas,
      arahMuka,
      bangunan: tapakBangunan(s, batas, arahMuka),
    });
  }
}

/** Menghitung tapak bangunan di dalam kavling setelah dikurangi sempadan. */
export function tapakBangunan(s: Skenario, batas: Persegi, arahMuka: ArahMuka): Persegi | null {
  const { gsbDepan, gsbSamping, gsbBelakang } = s.bangunan;
  const lebar = batas.lebar - 2 * gsbSamping;
  const panjang = batas.panjang - gsbDepan - gsbBelakang;
  if (lebar <= EPS || panjang <= EPS) return null;
  // Muka selatan: sisi depan di y kecil. Muka utara: sisi depan di y besar.
  const y = arahMuka === 'selatan' ? batas.y + gsbDepan : batas.y + gsbBelakang;
  return { x: batas.x + gsbSamping, y, lebar, panjang };
}
