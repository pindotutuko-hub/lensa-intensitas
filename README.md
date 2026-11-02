# Lensa Intensitas

Aplikasi web untuk mata kuliah **Asas Perancangan Kota** (Arsitektur, Universitas Merdeka Malang) untuk mengkaji intensitas pemanfaatan ruang (KDB, KLB, KDH, KBG) pada persil nyata di kota mana pun di Indonesia, termasuk peta geotag, simulasi massa 2D/3D, RTH, kuis, dan laporan.

## Menjalankan

Tidak perlu server. Buka salah satu berkas di folder `dist/`:

| Berkas | Isi | Kebutuhan |
|---|---|---|
| `dist/index.html` | Satu berkas mandiri (~4,4 MB): semua pustaka dan data ada di dalamnya | Berjalan tanpa internet (kecuali peta jalan/citra daring) |
| `dist/lensa-intensitas.html` | Versi ringan (~0,6 MB); pustaka dimuat dari CDN | Perlu internet |

Untuk dipasang di situs (mis. pindotutuko.id), unggah salah satu berkas tersebut. Peta jalan OpenStreetMap hanya tampil bila aplikasi dibuka dari situs web. Peta Esri tetap tersedia tanpa kunci API. Kunci CARTO/MapTiler bisa diisi di menu Peta tapak.

## Fitur

- **01 Peta tapak (geotag):** pencarian ±2.000 kota/kecamatan, menggambar persil (luas otomatis), dan impor aturan RDTR/RTRW (GeoJSON, CSV, atau layer ArcGIS FeatureServer). Aturan zona terisi otomatis bila pin berada di dalam zona.
- **02–03 Konsep & pedoman zona:** definisi menurut PP 16/2021. Angka contoh zona bersifat **ilustratif**, bukan kutipan peraturan.
- **04 Simulasi massa:** blok, podium + menara, atau kluster. Dilengkapi cek KDB/KLB/KDH/KBG/tinggi dan visual 3D (Three.js: langit, bayangan matahari menurut lintang, fasad kaca), denah 2D, potongan, dan lokasi.
  - **Rekomendasi perubahan desain** bila melanggar. Urutannya: perlebar pelat menara, ubah proporsi podium : menara, tambah menara, perbesar pelat, ganti tipologi, baru terakhir kurangi luas lantai. Setiap rekomendasi dapat diterapkan dengan satu klik, dan desain awal otomatis disimpan sebagai pembanding.
  - **RTH & vegetasi:** 7 jenis tanaman (trembesi, angsana, ketapang kencana, palem raja, glodokan tiang, tabebuya, pucuk merah). KDH dihitung dari luas area hijau.
- **05 Studi kasus:** formulir isian manual dengan penyelesaian otomatis. Contoh bawaan: BRI Tower (Soal UTS Gasal 2026/2027 No. 4).
- **06 Kuis:** 6 soal acak pada **persil asli** dari peta, masing-masing dengan gambar 2D dan 3D. Setelah diperiksa, gambar menampilkan jawaban dan cara hitungnya.
- **08 Laporan:**
  - Impor dokumen pendukung (Excel, CSV, PDF, DOCX). Angka KDB/KLB/KDH/KBG dideteksi otomatis untuk diverifikasi.
  - Laporan lengkap berisi geometri dan koordinat persil, ketentuan, perhitungan, kepatuhan, rekomendasi, 6 gambar, RTH, dan rujukan.
  - Ekspor ke **DOCX**, **HTML**, atau **Cetak/PDF**.
- **09 Rujukan:** semua sumber dengan tautan yang dapat diklik.

## Struktur

```
src/template.html   kode aplikasi (HTML/CSS/JS) dengan placeholder pustaka & data
src/build.py        merakit dist/index.html (offline) dan dist/lensa-intensitas.html (CDN)
src/gl-entry.js     bundel Three.js + OrbitControls + Sky + RoomEnvironment
src/*.js            salinan modul untuk dibaca (quiz_report, recommend); kode aktif ada di template
data/places.json    lokasi kota/kecamatan (lutangar/cities.json, turunan GeoNames)
data/prov.json      batas provinsi (superpikar/indonesia-geojson, BAKOSURTANAL 1:250.000)
samples/            berkas uji impor aturan (zona fiktif, bukan aturan resmi)
```

## Build

```bash
npm install
npm run build
```

## Catatan

Nilai aturan contoh dan ukuran tanaman bertanda * hanya untuk latihan atau visualisasi. Keputusan desain harus mengacu pada RDTR, peraturan zonasi, dan KKPR resmi, misalnya melalui GISTARU ATR/BPN.

Dikembangkan oleh Pindo Tutuko · Arsitektur, Universitas Merdeka Malang · 2026.
