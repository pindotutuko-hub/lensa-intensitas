/**
 * Tipe domain simulasi permukiman.
 * Semua besaran panjang dalam meter (m), luas dalam meter persegi (m²).
 */

export interface Persegi {
  x: number;
  y: number;
  lebar: number;
  panjang: number;
}

/** Arah muka kavling menghadap jalan. */
export type ArahMuka = 'utara' | 'selatan';

export interface Skenario {
  nama: string;
  lahan: {
    /** Dimensi tapak arah sumbu-x. */
    lebar: number;
    /** Dimensi tapak arah sumbu-y. */
    panjang: number;
    /**
     * Kedalaman jalur di tepi utara tapak yang dicadangkan untuk ruang terbuka publik
     * dan fasilitas umum; tidak diisi kavling.
     */
    cadanganRuangPublik: number;
  };
  jalan: {
    /** Lebar Daerah Milik Jalan (DAMIJA) lingkungan. */
    lebar: number;
  };
  kavling: {
    /** Lebar muka kavling (sejajar jalan). */
    lebar: number;
    /** Kedalaman kavling (tegak lurus jalan). */
    kedalaman: number;
  };
  bangunan: {
    /** Garis Sempadan Bangunan depan. */
    gsbDepan: number;
    /** Jarak bebas samping (kiri dan kanan); 0 berarti bangunan deret. */
    gsbSamping: number;
    /** Jarak bebas belakang. */
    gsbBelakang: number;
    jumlahLantai: number;
    tinggiLantai: number;
    /** Porsi lahan terbuka kavling yang diperkeras (0–1); sisanya dihitung sebagai ruang hijau. */
    rasioPerkerasan: number;
  };
  hunian: {
    unitPerLantai: number;
    jiwaPerUnit: number;
  };
  regulasi: {
    /** Koefisien Dasar Bangunan maksimum (0–1). */
    kdbMaks: number;
    /** Koefisien Lantai Bangunan maksimum. */
    klbMaks: number;
    /** Koefisien Dasar Hijau minimum (0–1). */
    kdhMin: number;
    /** Ketinggian bangunan maksimum (m). */
    ketinggianMaks: number;
    /** Proporsi minimum lahan untuk prasarana/ruang publik (jalan + sisa lahan) terhadap tapak (0–1). */
    psuMin: number;
  };
}

export interface Kavling {
  id: string;
  /** Indeks blok (0-based) dari selatan ke utara. */
  blok: number;
  batas: Persegi;
  arahMuka: ArahMuka;
  /** Tapak bangunan; null bila sempadan membuat kavling tidak dapat dibangun. */
  bangunan: Persegi | null;
}

export interface TataLetak {
  lahan: Persegi;
  jalan: Persegi[];
  kavling: Kavling[];
}

export interface Indikator {
  luasLahan: number;
  luasJalan: number;
  luasKavling: number;
  /** Lahan yang tidak menjadi jalan maupun kavling (sisa/ruang terbuka publik). */
  luasSisa: number;
  jumlahKavling: number;
  jumlahBangunan: number;
  luasTapakBangunan: number;
  luasLantaiBangunan: number;
  /** KDB rata-rata terhadap luas kavling. */
  kdb: number;
  /** KLB rata-rata terhadap luas kavling. */
  klb: number;
  /** KDH rata-rata terhadap luas kavling. */
  kdh: number;
  /** Proporsi jalan + sisa lahan terhadap luas tapak. */
  proporsiPsu: number;
  /** Cakupan bangunan terhadap seluruh tapak (gross). */
  cakupanBrutto: number;
  ketinggian: number;
  jumlahUnit: number;
  jumlahJiwa: number;
  /** Kepadatan brutto unit per hektare. */
  unitPerHa: number;
  /** Kepadatan brutto jiwa per hektare. */
  jiwaPerHa: number;
}

export type StatusKepatuhan = 'patuh' | 'melanggar';

export interface ButirKepatuhan {
  kode: 'KDB' | 'KLB' | 'KDH' | 'TINGGI' | 'PSU';
  label: string;
  nilai: number;
  batas: number;
  jenisBatas: 'maks' | 'min';
  status: StatusKepatuhan;
}
