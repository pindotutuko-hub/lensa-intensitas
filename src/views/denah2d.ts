import type { HasilSimulasi, Persegi } from '../core';

export interface PaletDenah {
  latar: string;
  lahan: string;
  jalan: string;
  kavling: string;
  garisKavling: string;
  bangunan: string;
  bangunanMelanggar: string;
  teks: string;
}

const MARGIN = 24;

/**
 * Menggambar denah (tampak atas) ke canvas. Sumbu-y dunia (utara) mengarah ke atas
 * layar, sehingga koordinat y dibalik saat digambar.
 */
export function gambarDenah(canvas: HTMLCanvasElement, hasil: HasilSimulasi, palet: PaletDenah): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = window.devicePixelRatio || 1;
  const { clientWidth: w, clientHeight: h } = canvas;
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = palet.latar;
  ctx.fillRect(0, 0, w, h);

  const { lahan, jalan, kavling } = hasil.tataLetak;
  const skala = Math.min((w - 2 * MARGIN) / lahan.lebar, (h - 2 * MARGIN) / lahan.panjang);
  if (!(skala > 0)) return;
  const ox = (w - lahan.lebar * skala) / 2;
  const oy = (h + lahan.panjang * skala) / 2;

  const rect = (p: Persegi) =>
    [ox + p.x * skala, oy - (p.y + p.panjang) * skala, p.lebar * skala, p.panjang * skala] as const;

  ctx.fillStyle = palet.lahan;
  ctx.fillRect(...rect(lahan));

  ctx.fillStyle = palet.jalan;
  for (const j of jalan) ctx.fillRect(...rect(j));

  const melanggar = hasil.kepatuhan.some(
    (b) => b.status === 'melanggar' && (b.kode === 'KDB' || b.kode === 'KLB' || b.kode === 'TINGGI'),
  );
  ctx.lineWidth = 1;
  for (const k of kavling) {
    ctx.fillStyle = palet.kavling;
    ctx.fillRect(...rect(k.batas));
    ctx.strokeStyle = palet.garisKavling;
    ctx.strokeRect(...rect(k.batas));
    if (k.bangunan) {
      ctx.fillStyle = melanggar ? palet.bangunanMelanggar : palet.bangunan;
      ctx.fillRect(...rect(k.bangunan));
    }
  }

  ctx.strokeStyle = palet.teks;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(...rect(lahan));

  gambarSkalaBatang(ctx, skala, MARGIN, h - 8, palet.teks);
  gambarPanahUtara(ctx, w - MARGIN, MARGIN + 4, palet.teks);
}

function gambarSkalaBatang(ctx: CanvasRenderingContext2D, skala: number, x: number, y: number, warna: string) {
  const kandidat = [5, 10, 20, 25, 50, 100, 200, 500];
  const meter = kandidat.find((m) => m * skala >= 60) ?? kandidat[kandidat.length - 1]!;
  const px = meter * skala;
  ctx.fillStyle = warna;
  ctx.fillRect(x, y - 3, px, 3);
  ctx.font = '11px system-ui, sans-serif';
  ctx.textBaseline = 'bottom';
  ctx.fillText(`${meter} m`, x + px + 6, y + 2);
}

function gambarPanahUtara(ctx: CanvasRenderingContext2D, x: number, y: number, warna: string) {
  ctx.fillStyle = warna;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - 6, y + 14);
  ctx.lineTo(x + 6, y + 14);
  ctx.closePath();
  ctx.fill();
  ctx.font = '11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('U', x, y + 16);
  ctx.textAlign = 'start';
}
