import './style.css';
import {
  PRESET,
  PRESET_AWAL,
  hasilKeCsv,
  jalankanSimulasi,
  salinSkenario,
  skenarioDariHash,
  skenarioDariJson,
  skenarioKeHash,
  skenarioKeJson,
  type HasilSimulasi,
  type Skenario,
} from './core';
import { gambarDenah, type PaletDenah } from './views/denah2d';
import type { TampilanMassa } from './views/massa3d';

type Kelompok = Exclude<keyof Skenario, 'nama'>;

interface DefIsian {
  kelompok: Kelompok;
  kunci: string;
  label: string;
  satuan?: string;
  langkah: number;
  min?: number;
  max?: number;
}

const JUDUL_KELOMPOK: Record<Kelompok, string> = {
  lahan: 'Lahan',
  jalan: 'Jalan',
  kavling: 'Kavling',
  bangunan: 'Bangunan',
  hunian: 'Hunian',
  regulasi: 'Batas regulasi',
};

const ISIAN: DefIsian[] = [
  { kelompok: 'lahan', kunci: 'lebar', label: 'Lebar (x)', satuan: 'm', langkah: 1, min: 1 },
  { kelompok: 'lahan', kunci: 'panjang', label: 'Panjang (y)', satuan: 'm', langkah: 1, min: 1 },
  { kelompok: 'lahan', kunci: 'cadanganRuangPublik', label: 'Cadangan ruang publik', satuan: 'm', langkah: 1, min: 0 },
  { kelompok: 'jalan', kunci: 'lebar', label: 'Lebar jalan', satuan: 'm', langkah: 0.5, min: 0 },
  { kelompok: 'kavling', kunci: 'lebar', label: 'Lebar muka', satuan: 'm', langkah: 0.5, min: 1 },
  { kelompok: 'kavling', kunci: 'kedalaman', label: 'Kedalaman', satuan: 'm', langkah: 0.5, min: 1 },
  { kelompok: 'bangunan', kunci: 'gsbDepan', label: 'GSB depan', satuan: 'm', langkah: 0.5, min: 0 },
  { kelompok: 'bangunan', kunci: 'gsbSamping', label: 'Jarak samping', satuan: 'm', langkah: 0.5, min: 0 },
  { kelompok: 'bangunan', kunci: 'gsbBelakang', label: 'Jarak belakang', satuan: 'm', langkah: 0.5, min: 0 },
  { kelompok: 'bangunan', kunci: 'jumlahLantai', label: 'Jumlah lantai', langkah: 1, min: 1 },
  { kelompok: 'bangunan', kunci: 'tinggiLantai', label: 'Tinggi per lantai', satuan: 'm', langkah: 0.1, min: 0.1 },
  { kelompok: 'bangunan', kunci: 'rasioPerkerasan', label: 'Rasio perkerasan', langkah: 0.05, min: 0, max: 1 },
  { kelompok: 'hunian', kunci: 'unitPerLantai', label: 'Unit per lantai', langkah: 0.5, min: 0 },
  { kelompok: 'hunian', kunci: 'jiwaPerUnit', label: 'Jiwa per unit', langkah: 0.5, min: 0 },
  { kelompok: 'regulasi', kunci: 'kdbMaks', label: 'KDB maks', langkah: 0.05, min: 0, max: 1 },
  { kelompok: 'regulasi', kunci: 'klbMaks', label: 'KLB maks', langkah: 0.1, min: 0 },
  { kelompok: 'regulasi', kunci: 'kdhMin', label: 'KDH min', langkah: 0.05, min: 0, max: 1 },
  { kelompok: 'regulasi', kunci: 'ketinggianMaks', label: 'Tinggi maks', satuan: 'm', langkah: 1, min: 1 },
  { kelompok: 'regulasi', kunci: 'psuMin', label: 'Proporsi PSU min', langkah: 0.05, min: 0, max: 1 },
];

const $ = <T extends HTMLElement>(sel: string) => {
  const el = document.querySelector<T>(sel);
  if (!el) throw new Error(`Elemen ${sel} tidak ditemukan`);
  return el;
};

const form = $<HTMLFormElement>('#form-skenario');
const pilihPreset = $<HTMLSelectElement>('#preset');
const daftarGalat = $<HTMLUListElement>('#galat');
const canvas = $<HTMLCanvasElement>('#denah');
const wadahMassa = $<HTMLDivElement>('#massa');
const tabelKepatuhan = $<HTMLTableElement>('#kepatuhan');
const tabelIndikator = $<HTMLTableElement>('#indikator');

const skenarioAwal = () => salinSkenario(PRESET[PRESET_AWAL]!);
/** Skenario dari tautan (#s=...) bila ada; selain itu preset awal. */
const dariTautan = skenarioDariHash(location.hash, skenarioAwal());
let skenario = dariTautan ?? skenarioAwal();
let hasilTerakhir: HasilSimulasi | null = null;
let mode: '2d' | '3d' = '2d';
let massa: TampilanMassa | null = null;

const nilai = (s: Skenario, d: DefIsian) => (s[d.kelompok] as unknown as Record<string, number>)[d.kunci]!;
const setNilai = (s: Skenario, d: DefIsian, v: number) => {
  (s[d.kelompok] as unknown as Record<string, number>)[d.kunci] = v;
};
const idIsian = (d: DefIsian) => `isian-${d.kelompok}-${d.kunci}`;

function bangunForm(): void {
  // Opsi tersembunyi untuk skenario yang dimuat dari tautan/berkas atau sudah diubah.
  const kustom = new Option('Kustom', '');
  kustom.hidden = true;
  pilihPreset.add(kustom);
  for (const [kunci, p] of Object.entries(PRESET)) {
    pilihPreset.add(new Option(p.nama, kunci, kunci === PRESET_AWAL, kunci === PRESET_AWAL));
  }
  for (const kelompok of Object.keys(JUDUL_KELOMPOK) as Kelompok[]) {
    const fs = document.createElement('fieldset');
    const lg = document.createElement('legend');
    lg.textContent = JUDUL_KELOMPOK[kelompok];
    fs.append(lg);
    for (const d of ISIAN.filter((x) => x.kelompok === kelompok)) {
      const label = document.createElement('label');
      label.className = 'isian';
      label.htmlFor = idIsian(d);
      label.innerHTML = `<span>${d.label}${d.satuan ? ` <small>(${d.satuan})</small>` : ''}</span>`;
      const input = document.createElement('input');
      input.type = 'number';
      input.id = idIsian(d);
      input.step = String(d.langkah);
      if (d.min !== undefined) input.min = String(d.min);
      if (d.max !== undefined) input.max = String(d.max);
      input.addEventListener('input', () => {
        const v = input.valueAsNumber;
        input.setAttribute('aria-invalid', String(Number.isNaN(v)));
        if (Number.isNaN(v)) return;
        setNilai(skenario, d, v);
        pilihPreset.value = '';
        perbarui();
      });
      label.append(input);
      fs.append(label);
    }
    form.append(fs);
  }
}

function isiForm(): void {
  for (const d of ISIAN) {
    const input = document.getElementById(idIsian(d)) as HTMLInputElement;
    input.value = String(nilai(skenario, d));
    input.removeAttribute('aria-invalid');
  }
}

function palet() {
  const cs = getComputedStyle(document.documentElement);
  const v = (n: string) => cs.getPropertyValue(n).trim();
  const denah: PaletDenah = {
    latar: v('--permukaan'),
    lahan: v('--c-lahan'),
    jalan: v('--c-jalan'),
    kavling: v('--c-kavling'),
    garisKavling: v('--c-garis-kavling'),
    bangunan: v('--c-bangunan'),
    bangunanMelanggar: v('--c-melanggar'),
    teks: v('--teks'),
  };
  return denah;
}

const fmt = (n: number, digit = 2) =>
  n.toLocaleString('id-ID', { minimumFractionDigits: digit, maximumFractionDigits: digit });

function tampilkanHasil(h: HasilSimulasi): void {
  tabelKepatuhan.innerHTML =
    '<tr><th>Indikator</th><th>Nilai</th><th>Batas</th><th>Status</th></tr>' +
    h.kepatuhan
      .map(
        (b) =>
          `<tr><td title="${b.label}">${b.kode}</td><td class="angka">${fmt(b.nilai)}</td>` +
          `<td class="angka">${b.jenisBatas === 'maks' ? '≤' : '≥'} ${fmt(b.batas)}</td>` +
          `<td class="status-${b.status}">${b.status === 'patuh' ? 'Patuh' : 'Melanggar'}</td></tr>`,
      )
      .join('');

  const i = h.indikator;
  const baris: [string, string][] = [
    ['Luas lahan', `${fmt(i.luasLahan, 0)} m² (${fmt(i.luasLahan / 10_000)} ha)`],
    ['Luas jalan', `${fmt(i.luasJalan, 0)} m²`],
    ['Luas kavling', `${fmt(i.luasKavling, 0)} m²`],
    ['Lahan sisa/terbuka', `${fmt(i.luasSisa, 0)} m²`],
    ['Jumlah kavling', fmt(i.jumlahKavling, 0)],
    ['Jumlah bangunan', fmt(i.jumlahBangunan, 0)],
    ['Luas tapak bangunan', `${fmt(i.luasTapakBangunan, 0)} m²`],
    ['Luas lantai total', `${fmt(i.luasLantaiBangunan, 0)} m²`],
    ['Cakupan brutto', `${fmt(i.cakupanBrutto * 100, 1)} %`],
    ['Ketinggian', `${fmt(i.ketinggian, 1)} m`],
    ['Jumlah unit', fmt(i.jumlahUnit, 0)],
    ['Jumlah jiwa', fmt(i.jumlahJiwa, 0)],
    ['Kepadatan unit', `${fmt(i.unitPerHa, 1)} unit/ha`],
    ['Kepadatan penduduk', `${fmt(i.jiwaPerHa, 1)} jiwa/ha`],
  ];
  tabelIndikator.innerHTML = baris.map(([k, v]) => `<tr><td>${k}</td><td class="angka">${v}</td></tr>`).join('');
}

function render(): void {
  if (!hasilTerakhir) return;
  const p = palet();
  if (mode === '2d') {
    gambarDenah(canvas, hasilTerakhir, p);
  } else if (massa) {
    massa.perbarui(skenario, hasilTerakhir, p);
  }
}

function perbarui(): void {
  const r = jalankanSimulasi(skenario);
  daftarGalat.replaceChildren(
    ...(r.ok ? [] : r.galat).map((g) => Object.assign(document.createElement('li'), { textContent: g })),
  );
  if (!r.ok) return;
  hasilTerakhir = r.hasil;
  tampilkanHasil(r.hasil);
  render();
  // Simpan skenario valid di URL agar bisa dibagikan/di-bookmark tanpa menambah riwayat.
  const hash = skenarioKeHash(skenario);
  if (location.hash !== hash) history.replaceState(null, '', hash);
}

async function gantiMode(baru: '2d' | '3d'): Promise<void> {
  mode = baru;
  document.querySelectorAll<HTMLButtonElement>('.tab [data-mode]').forEach((b) => {
    b.setAttribute('aria-selected', String(b.dataset.mode === baru));
  });
  canvas.hidden = baru !== '2d';
  wadahMassa.hidden = baru !== '3d';
  if (baru === '3d' && !massa) {
    // Three.js dimuat hanya ketika tampilan 3D pertama kali dibuka.
    const { TampilanMassa } = await import('./views/massa3d');
    massa = new TampilanMassa(wadahMassa);
  }
  if (baru === '3d') massa?.lanjut();
  else massa?.jeda();
  render();
}

const namaBerkas = (akhiran: string) => {
  const slug = skenario.nama.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return `skenario-${slug || 'kustom'}${akhiran}`;
};

function unduhUrl(href: string, nama: string): void {
  const a = document.createElement('a');
  a.href = href;
  a.download = nama;
  a.click();
}

function unduhBlob(isi: BlobPart, tipe: string, ekstensi: string): void {
  const url = URL.createObjectURL(new Blob([isi], { type: tipe }));
  unduhUrl(url, namaBerkas(`.${ekstensi}`));
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function unduhPng(): void {
  if (!hasilTerakhir) return;
  if (mode === '3d' && massa) {
    unduhUrl(massa.kePng(), namaBerkas('-3d.png'));
  } else {
    render();
    unduhUrl(canvas.toDataURL('image/png'), namaBerkas('-denah.png'));
  }
}

async function salinTautan(tombol: HTMLButtonElement): Promise<void> {
  const url = new URL(skenarioKeHash(skenario), location.href).href;
  const label = tombol.textContent;
  try {
    await navigator.clipboard.writeText(url);
    tombol.textContent = 'Tautan disalin';
  } catch {
    // Clipboard API bisa ditolak (konteks tidak aman/izin); tampilkan tautan untuk disalin manual.
    window.prompt('Salin tautan berikut:', url);
  }
  setTimeout(() => (tombol.textContent = label), 1500);
}

bangunForm();
if (dariTautan) pilihPreset.value = '';
isiForm();
perbarui();

pilihPreset.addEventListener('change', () => {
  skenario = salinSkenario(PRESET[pilihPreset.value]!);
  isiForm();
  perbarui();
});
document.querySelectorAll<HTMLButtonElement>('.tab [data-mode]').forEach((b) =>
  b.addEventListener('click', () => void gantiMode(b.dataset.mode as '2d' | '3d')),
);
$('#unduh').addEventListener('click', () => unduhBlob(skenarioKeJson(skenario), 'application/json', 'json'));
$('#unduh-csv').addEventListener('click', () => {
  // BOM agar Excel membaca UTF-8 dengan benar.
  if (hasilTerakhir) unduhBlob('\uFEFF' + hasilKeCsv(skenario, hasilTerakhir), 'text/csv', 'csv');
});
$('#unduh-png').addEventListener('click', unduhPng);
$<HTMLButtonElement>('#salin-tautan').addEventListener('click', (e) =>
  void salinTautan(e.currentTarget as HTMLButtonElement),
);
window.addEventListener('hashchange', () => {
  const baru = skenarioDariHash(location.hash, skenarioAwal());
  if (!baru || location.hash === skenarioKeHash(skenario)) return;
  skenario = baru;
  pilihPreset.value = '';
  isiForm();
  perbarui();
});
$<HTMLInputElement>('#muat').addEventListener('change', async (e) => {
  const input = e.target as HTMLInputElement;
  const berkas = input.files?.[0];
  input.value = '';
  if (!berkas) return;
  try {
    skenario = skenarioDariJson(await berkas.text(), skenario);
    pilihPreset.value = '';
    isiForm();
    perbarui();
  } catch (err) {
    daftarGalat.replaceChildren(
      Object.assign(document.createElement('li'), { textContent: (err as Error).message }),
    );
  }
});
new ResizeObserver(() => mode === '2d' && render()).observe(canvas);
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', render);
