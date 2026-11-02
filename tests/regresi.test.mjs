// Test regresi untuk dist/index.html (build mandiri, tanpa internet).
// Jalankan: npm run build && npm test
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { chromium } from 'playwright';

const URL_APP = pathToFileURL(path.resolve('dist/index.html')).href;
const TENGGAT = 8000; // ms; halaman yang menggantung tidak akan menjawab evaluate()

let browser;
before(async () => {
  browser = await chromium.launch();
});
after(async () => {
  await browser?.close();
});

/** Halaman baru; semua permintaan jaringan (ubin peta, font) diblokir agar test deterministik. */
async function bukaHalaman(hash = 'beranda', simpanan) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 } });
  const page = await ctx.newPage();
  const galat = [];
  page.on('pageerror', (e) => galat.push(String(e)));
  await page.route((u) => u.protocol !== 'file:', (r) => r.abort());
  if (simpanan) {
    await page.addInitScript((v) => localStorage.setItem('li_current', JSON.stringify(v)), simpanan);
  }
  await page.goto(`${URL_APP}#${hash}`, { waitUntil: 'domcontentloaded' });
  await responsif(page);
  return { page, galat, tutup: () => ctx.close() };
}

/** Gagal bila thread utama halaman tidak menjawab dalam TENGGAT (mis. loop tak hingga). */
async function responsif(page) {
  const hasil = await Promise.race([
    page.evaluate(() => 'ok'),
    new Promise((r) => setTimeout(() => r('menggantung'), TENGGAT)),
  ]);
  assert.equal(hasil, 'ok', 'halaman tidak responsif');
}

test('mesin hitung: kasus bawaan (BRI Tower) menghasilkan 35 lantai dan melanggar KBG', async () => {
  const { page, galat, tutup } = await bukaHalaman('simulasi');
  const R = await page.evaluate(() => {
    const r = compute();
    return { total: r.total, klb: r.klbUsed, kdb: r.kdbUsed, gagal: r.C.filter((c) => !c.ok).map((c) => c.k) };
  });
  assert.ok(Math.abs(R.total - 35) < 1e-9);
  assert.ok(Math.abs(R.klb - 8) < 1e-9);
  assert.ok(Math.abs(R.kdb - 0.8) < 1e-9);
  assert.deepEqual(R.gagal, ['KBG']);
  assert.deepEqual(galat, []);
  await tutup();
});

test('semua halaman terbuka tanpa error JavaScript', async () => {
  const { page, galat, tutup } = await bukaHalaman();
  for (const v of ['beranda', 'peta', 'konsep', 'zona', 'simulasi', 'kasus', 'kuis', 'proyek', 'laporan', 'rujukan']) {
    await page.evaluate((v) => (location.hash = v), v);
    await responsif(page);
    assert.equal(await page.$eval(`#v-${v}`, (e) => e.classList.contains('on')), true, v);
  }
  assert.deepEqual(galat, []);
  await tutup();
});

test('KDB 0 yang diketik dijepit ke batas minimum dan simulasi tidak menggantung', async () => {
  const { page, galat, tutup } = await bukaHalaman('peta');
  await page.fill('#kdb', '0');
  assert.equal(await page.evaluate(() => S.kdb), 1);
  await page.evaluate(() => (location.hash = 'simulasi'));
  await responsif(page);
  const total = await page.evaluate(() => lastRes.total);
  assert.ok(Number.isFinite(total), `total lantai harus terhingga, didapat ${total}`);
  assert.deepEqual(galat, []);
  await tutup();
});

test('nilai tidak valid yang tersimpan di localStorage dipulihkan saat halaman dibuka', async () => {
  const { page, galat, tutup } = await bukaHalaman('simulasi', { kdb: 0, area: 0, ftfP: 'abc', nT: 50, r: -1 });
  const nilai = await page.evaluate(() => ({ kdb: S.kdb, area: S.area, ftfP: S.ftfP, nT: S.nT, r: S.r }));
  assert.deepEqual(nilai, { kdb: 1, area: 10, ftfP: 4.5, nT: 9, r: 0.02 });
  const tersimpan = await page.evaluate(() => JSON.parse(localStorage.getItem('li_current')).kdb);
  assert.equal(tersimpan, 1, 'nilai yang sudah dijepit juga disimpan ulang');
  assert.deepEqual(galat, []);
  await tutup();
});

test('mengetik angka desimal kecil tidak tertahan di batas minimum (mis. KLB 0,5)', async () => {
  const { page, tutup } = await bukaHalaman('peta');
  await page.fill('#klb', '');
  await page.type('#klb', '0.5'); // melewati "0" yang di bawah min 0,1
  assert.equal(await page.evaluate(() => S.klb), 0.5);
  await tutup();
});

test('kolom kembali menampilkan nilai yang dijepit setelah fokus berpindah', async () => {
  const { page, tutup } = await bukaHalaman('peta');
  await page.fill('#kdb', '250');
  await page.press('#kdb', 'Tab');
  assert.equal(await page.inputValue('#kdb'), '100');
  await tutup();
});
