# Rencana pengembangan

Daftar pekerjaan lanjutan, kira-kira berurutan menurut prioritas.

## Simulasi
- [ ] Orientasi blok selain utara–selatan (rotasi grid) dan jalan arah utara–selatan (pola grid penuh/superblok).
- [ ] Lahan berbentuk poligon tidak beraturan (impor GeoJSON/DXF), bukan hanya persegi panjang.
- [ ] Penempatan fasum/fasos (taman, musala, PAUD) di jalur cadangan dengan kebutuhan luas menurut jumlah penduduk (SNI 03-1733-2004).
- [ ] Variasi jumlah lantai/tipe bangunan per kavling (campuran) serta kepatuhan per kavling, bukan rata-rata.
- [ ] Analisis bayangan matahari menurut lokasi, tanggal, dan jam pada tampilan 3D.
- [ ] Perbandingan dua skenario berdampingan (A/B) beserta selisih indikatornya.

## Antarmuka
- [x] Simpan skenario di URL (hash) agar bisa dibagikan.
- [x] Ekspor denah/massa ke PNG dan hasil ke CSV.
- [ ] Ekspor denah ke SVG/DXF untuk diolah di perangkat lunak CAD.
- [ ] Klik kavling untuk melihat indikator per kavling.
- [x] Hentikan render loop 3D saat tab 2D aktif atau halaman tersembunyi.

## Teknis
- [ ] Test end-to-end (Playwright) untuk alur form → denah → tabel.
- [ ] Linting (ESLint + Prettier) di CI.
- [ ] Deploy otomatis (mis. GitHub Pages/Netlify) dari branch `main`.
