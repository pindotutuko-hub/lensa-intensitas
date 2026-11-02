# Lensa Intensitas

Aplikasi web untuk **simulasi permukiman 2D/3D** yang membantu mengkaji intensitas pemanfaatan ruang. Pengguna mengatur dimensi lahan, jalan, kavling, sempadan, jumlah lantai, dan batas regulasi. Aplikasi lalu membangkitkan tata letak, menggambarnya sebagai denah 2D dan massa bangunan 3D, serta menghitung indikator dan kepatuhannya.

## Fitur

- **Generator tata letak grid**: pola jalan → blok dua baris kavling saling membelakangi → jalan. Setiap kavling dijamin menghadap jalan. Jalur cadangan ruang publik/fasum dapat disisihkan di tepi utara.
- **Tapak bangunan** dihitung dari GSB depan, jarak bebas samping, dan jarak bebas belakang. GSB depan selalu berada di sisi yang menghadap jalan.
- **Indikator**: KDB, KLB, KDH, ketinggian, proporsi PSU (jalan + ruang publik), cakupan brutto, jumlah unit/jiwa, serta kepadatan unit/ha dan jiwa/ha.
- **Pemeriksaan kepatuhan** terhadap batas regulasi (KDB maks, KLB maks, KDH min, tinggi maks, PSU min).
- **Denah 2D** (canvas, dengan skala batang dan panah utara) dan **massa 3D** (Three.js, orbit/zoom). Bangunan yang melampaui KDB/KLB/tinggi ditandai merah.
- **Skenario contoh**: rumah tapak, rumah deret, rumah susun. Skenario dapat diunduh/dimuat sebagai JSON.
- Tema terang/gelap mengikuti sistem.

> Batas regulasi pada skenario contoh bersifat **ilustratif**. Sesuaikan dengan RDTR/Peraturan Zonasi daerah yang dikaji.

## Menjalankan

Prasyarat: Node.js 22+.

```bash
npm install
npm run dev        # server pengembangan (http://localhost:5173)
npm run check      # typecheck + test unit
npm run build      # build produksi ke dist/
npm run preview    # menyajikan hasil build
```

## Struktur proyek

```
src/
  core/            Logika domain murni (tanpa DOM), diuji dengan Vitest
    types.ts         Tipe Skenario, TataLetak, Indikator, ButirKepatuhan
    generator.ts     Pembangkit tata letak jalan, kavling, dan tapak bangunan
    indikator.ts     Perhitungan indikator & pemeriksaan kepatuhan
    validasi.ts      Validasi parameter skenario
    serialisasi.ts   Impor/ekspor JSON (dengan pengisian field yang hilang)
    preset.ts        Skenario contoh
    index.ts         jalankanSimulasi(): validasi → tata letak → indikator → kepatuhan
  views/
    denah2d.ts       Render denah ke <canvas>
    massa3d.ts       Render massa 3D dengan Three.js (dimuat saat tab 3D dibuka)
  main.ts          Antarmuka: form parameter, tab 2D/3D, tabel hasil
tests/             Test unit modul core
```

## Definisi indikator

| Indikator | Rumus |
|---|---|
| KDB | Σ luas tapak bangunan ÷ Σ luas kavling |
| KLB | Σ luas lantai bangunan ÷ Σ luas kavling |
| KDH | Σ (luas kavling − tapak) × (1 − rasio perkerasan) ÷ Σ luas kavling |
| Proporsi PSU | (luas jalan + lahan sisa/ruang publik) ÷ luas tapak |
| Kepadatan | unit atau jiwa ÷ luas tapak (ha), brutto |

Koordinat: sumbu-x ke timur, sumbu-y ke utara, satuan meter.

## Pengembangan lanjutan

Lihat [TODO.md](TODO.md).
