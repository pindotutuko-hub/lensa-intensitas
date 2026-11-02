import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { HasilSimulasi, Persegi, Skenario } from '../core';

export interface PaletMassa {
  latar: string;
  lahan: string;
  jalan: string;
  kavling: string;
  bangunan: string;
  bangunanMelanggar: string;
}

/**
 * Tampilan massa bangunan 3D. Koordinat dunia simulasi (x, y) dipetakan ke
 * bidang XZ Three.js dengan utara = -Z; ketinggian = +Y.
 */
export class TampilanMassa {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(45, 1, 0.5, 5000);
  private readonly controls: OrbitControls;
  private readonly grup = new THREE.Group();
  private readonly observer: ResizeObserver;
  private ukuranLahanTerakhir = '';
  private frame = 0;
  private aktif = true;
  private readonly saatVisibilitas = () => this.aturLoop();

  constructor(private readonly wadah: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio || 1);
    this.renderer.shadowMap.enabled = true;
    wadah.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.02;

    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8a7a, 1.4));
    const matahari = new THREE.DirectionalLight(0xffffff, 1.6);
    matahari.position.set(-120, 200, 80);
    matahari.castShadow = true;
    matahari.shadow.mapSize.set(2048, 2048);
    this.scene.add(matahari, matahari.target);
    this.scene.add(this.grup);

    this.observer = new ResizeObserver(() => this.sesuaikanUkuran());
    this.observer.observe(wadah);
    this.sesuaikanUkuran();
    document.addEventListener('visibilitychange', this.saatVisibilitas);
    this.aturLoop();
  }

  /** Menghentikan render loop (mis. saat tab 2D aktif) untuk menghemat CPU/GPU. */
  jeda(): void {
    this.aktif = false;
    this.aturLoop();
  }

  lanjut(): void {
    this.aktif = true;
    this.aturLoop();
  }

  /** Apakah render loop sedang berjalan. */
  get berjalan(): boolean {
    return this.frame !== 0;
  }

  /** Merender satu bingkai lalu mengambilnya sebagai data URL PNG. */
  kePng(): string {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    // Dibaca segera setelah render, sebelum buffer WebGL dikosongkan browser.
    return this.renderer.domElement.toDataURL('image/png');
  }

  perbarui(s: Skenario, hasil: HasilSimulasi, palet: PaletMassa): void {
    this.scene.background = new THREE.Color(palet.latar);
    this.kosongkan();

    const { lahan, jalan, kavling } = hasil.tataLetak;
    const cx = lahan.lebar / 2;
    const cy = lahan.panjang / 2;
    const bidang = (p: Persegi, tinggi: number, warna: string, elevasi = 0) => {
      const geo = new THREE.BoxGeometry(p.lebar, tinggi, p.panjang);
      const mat = new THREE.MeshStandardMaterial({ color: warna, roughness: 0.9 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(p.x + p.lebar / 2 - cx, elevasi + tinggi / 2, -(p.y + p.panjang / 2 - cy));
      mesh.receiveShadow = true;
      this.grup.add(mesh);
      return mesh;
    };

    bidang(lahan, 0.2, palet.lahan, -0.2);
    for (const j of jalan) bidang(j, 0.05, palet.jalan);
    for (const k of kavling) bidang(k.batas, 0.08, palet.kavling);

    const melanggar = hasil.kepatuhan.some(
      (b) => b.status === 'melanggar' && (b.kode === 'KDB' || b.kode === 'KLB' || b.kode === 'TINGGI'),
    );
    const tinggi = s.bangunan.jumlahLantai * s.bangunan.tinggiLantai;
    const warna = melanggar ? palet.bangunanMelanggar : palet.bangunan;
    for (const k of kavling) {
      if (!k.bangunan) continue;
      const m = bidang(k.bangunan, tinggi, warna, 0.08);
      m.castShadow = true;
      const tepi = new THREE.LineSegments(
        new THREE.EdgesGeometry(m.geometry),
        new THREE.LineBasicMaterial({ color: 0x333333, transparent: true, opacity: 0.35 }),
      );
      m.add(tepi);
    }

    const kunci = `${lahan.lebar}x${lahan.panjang}`;
    if (kunci !== this.ukuranLahanTerakhir) {
      this.ukuranLahanTerakhir = kunci;
      const r = Math.max(lahan.lebar, lahan.panjang);
      this.camera.position.set(r * 0.75, r * 1.05, r * 1.25);
      this.controls.target.set(0, 0, 0);
      this.controls.update();
    }
  }

  hancurkan(): void {
    this.aktif = false;
    this.aturLoop();
    document.removeEventListener('visibilitychange', this.saatVisibilitas);
    this.observer.disconnect();
    this.kosongkan();
    this.controls.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private kosongkan(): void {
    this.grup.traverse((o) => {
      if (o instanceof THREE.Mesh || o instanceof THREE.LineSegments) {
        o.geometry.dispose();
        const m = o.material as THREE.Material | THREE.Material[];
        (Array.isArray(m) ? m : [m]).forEach((x) => x.dispose());
      }
    });
    this.grup.clear();
  }

  private sesuaikanUkuran(): void {
    const w = this.wadah.clientWidth || 1;
    const h = this.wadah.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  private aturLoop(): void {
    const harusJalan = this.aktif && document.visibilityState !== 'hidden';
    if (harusJalan && this.frame === 0) {
      this.frame = requestAnimationFrame(this.putar);
    } else if (!harusJalan && this.frame !== 0) {
      cancelAnimationFrame(this.frame);
      this.frame = 0;
    }
  }

  private putar = (): void => {
    this.frame = requestAnimationFrame(this.putar);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };
}
