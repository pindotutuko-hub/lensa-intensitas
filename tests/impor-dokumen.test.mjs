// Impor dokumen di halaman Laporan (dist/index.html). Jalankan: npm run build && npm test
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { chromium } from 'playwright';

const URL_APP = pathToFileURL(path.resolve('dist/index.html')).href;

/** PDF minimal satu halaman berisi teks `isi` (Helvetica), dengan tabel xref yang benar. */
function pdfSederhana(isi) {
  const aliran = `BT /F1 12 Tf 72 720 Td (${isi}) Tj ET`;
  const objek = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${aliran.length} >>\nstream\n${aliran}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let pdf = '%PDF-1.4\n';
  const offset = [];
  objek.forEach((o, i) => {
    offset.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objek.length + 1}\n0000000000 65535 f \n`;
  pdf += offset.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('');
  pdf += `trailer\n<< /Size ${objek.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf, 'latin1');
}

let browser;
before(async () => {
  browser = await chromium.launch();
});
after(async () => {
  await browser?.close();
});

test('impor PDF: angka aturan terdeteksi dan PDF.js dipanggil dengan isEvalSupported:false', async () => {
  const page = await browser.newPage();
  const galat = [];
  page.on('pageerror', (e) => galat.push(String(e)));
  await page.route((u) => u.protocol !== 'file:', (r) => r.abort());
  await page.goto(`${URL_APP}#laporan`, { waitUntil: 'domcontentloaded' });

  // Catat opsi yang diteruskan ke getDocument.
  // Properti ekspor PDF.js bersifat read-only, jadi objeknya dibungkus Proxy.
  await page.evaluate(() => {
    const asli = window.pdfjsLib;
    window.__opsiPdf = [];
    const getDocument = (o) => {
      window.__opsiPdf.push({ isEvalSupported: o.isEvalSupported });
      return asli.getDocument(o);
    };
    window.pdfjsLib = new Proxy(asli, { get: (t, k) => (k === 'getDocument' ? getDocument : t[k]) });
  });

  await page.setInputFiles('#docFiles', {
    name: 'aturan.pdf',
    mimeType: 'application/pdf',
    buffer: pdfSederhana('Ketentuan zona: KDB 60 persen, KLB 2,4, KDH 20 persen.'),
  });
  await page.waitForFunction(() => DOCS.length > 0, null, { timeout: 15000 });

  const doc = await page.evaluate(() => ({ err: DOCS[0].err, found: DOCS[0].found.map((f) => `${f.k}=${f.v}`) }));
  assert.equal(doc.err, undefined);
  assert.ok(doc.found.includes('kdb=60'), JSON.stringify(doc.found));
  assert.ok(doc.found.includes('kdh=20'), JSON.stringify(doc.found));
  assert.deepEqual(await page.evaluate(() => window.__opsiPdf), [{ isEvalSupported: false }]);
  assert.deepEqual(galat, []);
  await page.close();
});
