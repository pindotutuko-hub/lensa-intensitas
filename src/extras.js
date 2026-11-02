/* ---------- Geometri: sempadan (GSB) & selubung bangunan ---------- */
function polyArea(p){let a=0;p.forEach((q,i)=>{const w=p[(i+1)%p.length];a+=q[0]*w[1]-w[0]*q[1]});return a/2}
function insetPoly(poly,d){ // poligon CCW, geser tiap sisi ke dalam sejauh d (m)
  if(!(d>0)) return poly; const n=poly.length, L=[];
  for(let i=0;i<n;i++){const a=poly[i],b=poly[(i+1)%n],dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy)||1e-9,nx=-dy/len,ny=dx/len;L.push([[a[0]+nx*d,a[1]+ny*d],[dx,dy]])}
  const out=[];for(let i=0;i<n;i++){const [p1,d1]=L[(i-1+n)%n],[p2,d2]=L[i],den=d1[0]*d2[1]-d1[1]*d2[0];
    if(Math.abs(den)<1e-9){out.push(p2);continue} const t=((p2[0]-p1[0])*d2[1]-(p2[1]-p1[1])*d2[0])/den; out.push([p1[0]+d1[0]*t,p1[1]+d1[1]*t])}
  const A0=polyArea(poly),A1=polyArea(out); if(A1<=0||A1>A0) return null;
  for(let i=0;i<n;i++){const a=poly[i],b=poly[(i+1)%n],c=out[i],e=out[(i+1)%n]; if(((b[0]-a[0])*(e[0]-c[0])+(b[1]-a[1])*(e[1]-c[1]))<0) return null}
  return out;
}
function baseShape(){const site=localSite(); if(!(S.gsb>0)){return{poly:site,area:polyArea(site),c:[0,0],inset:null}}
  const ins=insetPoly(site,S.gsb); if(!ins) return{poly:site,area:0,c:[0,0],inset:null,bad:true};
  const c=[ins.reduce((s,p)=>s+p[0],0)/ins.length,ins.reduce((s,p)=>s+p[1],0)/ins.length]; return{poly:ins,area:polyArea(ins),c,inset:ins}}

/* ---------- Hasil (yield), kepadatan, parkir, biaya ---------- */
function yieldCalc(R){
  const gfa=R.gfaUsed, resG=S.typo==='podium'&&S.podNon?R.nTw*R.towerPlate*R.nT:gfa*(S.resPct/100), nonG=Math.max(0,gfa-resG);
  const net=gfa*S.eff/100, resNet=resG*S.eff/100, units=S.unit>0?Math.floor(resNet/S.unit):0, ppl=units*S.ppu, ha=R.A/10000;
  const park=Math.ceil(units*S.pRes+nonG/100*S.pNon), parkArea=park*S.srp, cost=gfa*S.cost;
  return{gfa,resG,nonG,net,resNet,units,ppl,uha:units/ha,pha:ppl/ha,park,parkArea,cost};
}
function renderYield(R){const Y=R.Y=yieldCalc(R);
  $('yieldOut').innerHTML=`<table class="t">
   <tr><td>Luas lantai bruto (GFA)</td><td class="n">${nf(Y.gfa)} m²</td></tr>
   <tr><td>Luas bersih (efisiensi ${S.eff}%)</td><td class="n">${nf(Y.net)} m²</td></tr>
   <tr><td>Bagian hunian / non-hunian (bruto)</td><td class="n">${nf(Y.resG)} / ${nf(Y.nonG)} m²</td></tr>
   <tr><td>Jumlah unit hunian (@${nf(S.unit)} m² bersih)</td><td class="n"><b>${nf(Y.units)}</b> unit</td></tr>
   <tr><td>Penghuni (@${nf2(S.ppu)} jiwa/unit)</td><td class="n">${nf(Y.ppl)} jiwa</td></tr>
   <tr><td>Kepadatan</td><td class="n">${nf(Y.uha,0)} unit/ha · ${nf(Y.pha,0)} jiwa/ha</td></tr>
   <tr><td>Kebutuhan parkir mobil</td><td class="n"><b>${nf(Y.park)}</b> SRP ≈ ${nf(Y.parkArea)} m²</td></tr>
   <tr><td>Estimasi biaya konstruksi</td><td class="n">Rp ${nf(Y.cost/1e9,1)} miliar</td></tr></table>
   <p class="note" style="margin:6px 0 0">Semua angka di kartu ini dihitung dari <b>asumsi yang Anda isi</b> (efisiensi, luas unit, rasio parkir, biaya per m²), bukan standar resmi. Ganti dengan ketentuan daerah/data proyek.</p>`;
  return Y}

/* ---------- Studi bayangan & jam matahari ---------- */
function sunAt(h,month,lat){const N=Math.round(month*30.4+15),k=Math.PI/180,dec=23.45*Math.sin(2*Math.PI*(284+N)/365)*k,la=lat*k,H=(h-12)*15*k;
  const alt=Math.asin(Math.max(-1,Math.min(1,Math.sin(la)*Math.sin(dec)+Math.cos(la)*Math.cos(dec)*Math.cos(H)))),az=Math.atan2(Math.sin(H),Math.cos(H)*Math.sin(la)-Math.tan(dec)*Math.cos(la));
  return{alt,east:-Math.sin(az),north:-Math.cos(az)}} // arah horizontal ke matahari (vektor satuan)
function hull(pts){pts=pts.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);const lo=[],up=[];
  for(const p of pts){while(lo.length>=2&&cr(lo[lo.length-2],lo[lo.length-1],p)<=0)lo.pop();lo.push(p)}for(const p of pts.slice().reverse()){while(up.length>=2&&cr(up[up.length-2],up[up.length-1],p)<=0)up.pop();up.push(p)}return lo.slice(0,-1).concat(up.slice(0,-1))}
function shadowStudy(R,month){
  const M=R._M,hours=[];for(let h=7;h<=17;h++)hours.push(h);
  const per=hours.map(h=>{const s=sunAt(h,month,S.lat);if(s.alt<=0.02)return{h,alt:s.alt,polys:[],len:Infinity};const t=1/Math.tan(s.alt),vx=-s.east*t,vy=-s.north*t;
    const polys=M.pieces.map(p=>hull(p.poly.flatMap(q=>[[q[0]+vx*p.z0,q[1]+vy*p.z0],[q[0]+vx*p.z1,q[1]+vy*p.z1]])));
    return{h,alt:s.alt,polys,len:R.H*t,dir:Math.atan2(vx,vy)}});
  // titik sampel pada RTH (bukan tapak/perkerasan)
  const site=M.site,bb=bbox(site),step=Math.max(1,Math.sqrt(R.A/1400)),pts=[];
  for(let y=bb.y0+step/2;y<bb.y1;y+=step)for(let x=bb.x0+step/2;x<bb.x1;x+=step){if(!pip(x,y,site))continue;if((M.footprints||[]).some(f=>pip(x,y,f.poly)))continue;const lawn=!(M.paved||[]).some(p=>pip(x,y,p));pts.push({x,y,lawn,sun:0})}
  per.forEach(o=>{if(!o.polys.length)return;pts.forEach(p=>{if(!o.polys.some(g=>pip(p.x,p.y,g)))p.sun++})});
  const lawn=pts.filter(p=>p.lawn),avg=a=>a.length?a.reduce((s,p)=>s+p.sun,0)/a.length:0;
  const day=per.filter(o=>o.polys.length).length;
  return{per,pts,step,avgLawn:avg(lawn),avgOpen:avg(pts),pct4:lawn.length?lawn.filter(p=>p.sun>=Math.min(4,day)).length/lawn.length*100:0,day,month};
}
function drawShadow(R){
  const SH=R.SH=shadowStudy(R,+$('sunM').value), M=R._M, site=M.site, W=760, H=480, bb=bbox(site), pad=50;
  const sc=Math.min((W-2*pad-190)/(bb.x1-bb.x0),(H-2*pad)/(bb.y1-bb.y0)),ox=pad+((W-2*pad-190)-(bb.x1-bb.x0)*sc)/2-bb.x0*sc,oy=H/2+(bb.y0+bb.y1)/2*sc,T=p=>[p[0]*sc+ox,oy-p[1]*sc];
  let s=`<rect width="${W}" height="${H}" fill="#f6fbfa"/><polygon points="${ptsStr(site.map(T))}" fill="#eef6f4" stroke="#0e8c84" stroke-width="2"/>`;
  const col=n=>{const t=SH.day?n/SH.day:0;return`rgb(${Math.round(60+t*195)},${Math.round(80+t*150)},${Math.round(140-t*100)})`};
  SH.pts.forEach(p=>{const c=T([p.x,p.y]);s+=`<rect x="${(c[0]-SH.step*sc/2).toFixed(1)}" y="${(c[1]-SH.step*sc/2).toFixed(1)}" width="${(SH.step*sc+.5).toFixed(1)}" height="${(SH.step*sc+.5).toFixed(1)}" fill="${col(p.sun)}" opacity="${p.lawn?.85:.5}"/>`});
  SH.per.forEach(o=>o.polys.forEach(g=>{s+=`<polygon points="${ptsStr(g.map(T))}" fill="none" stroke="#0f2f2c" stroke-opacity=".28" stroke-width=".8"/>`}));
  M.pieces.forEach(p=>{s+=`<polygon points="${ptsStr(p.poly.map(T))}" fill="${p.over?'#c0392b':COL[p.role]}" stroke="#0f2f2c" stroke-width=".8"/>`});
  // label ujung bayangan tiap jam
  SH.per.forEach(o=>{if(!o.polys.length)return;const far=o.polys.flat().reduce((m,q)=>{const d=Math.hypot(q[0],q[1]);return d>m.d?{d,q}:m},{d:-1}).q;const c=T(far);if(c[0]>-50&&c[0]<W-180&&c[1]>0&&c[1]<H)s+=`<text x="${c[0].toFixed(1)}" y="${c[1].toFixed(1)}" font-size="10" fill="#0f2f2c" stroke="#f6fbfa" stroke-width="2.5" paint-order="stroke">${o.h}.00</text>`});
  s+=`<g transform="translate(${W-178},60)"><text font-size="11.5" font-weight="700">Jam matahari langsung</text><text y="16" font-size="10.5" fill="#4f6f6b">${MONTHS[SH.month]} · pukul 07–17 · per 1 jam</text>`;
  for(let i=0;i<=5;i++){const n=Math.round(SH.day*i/5);s+=`<rect x="0" y="${28+i*18}" width="18" height="14" fill="${col(n)}"/><text x="24" y="${39+i*18}" font-size="10.5">${n} jam</text>`}
  s+=`<text y="150" font-size="10.5" fill="#4f6f6b">Rata-rata pada RTH</text><text y="168" font-size="15" font-weight="700">${nf(SH.avgLawn,1)} jam</text>`;
  s+=`<text y="190" font-size="10.5" fill="#4f6f6b">RTH ≥ 4 jam matahari</text><text y="208" font-size="15" font-weight="700">${nf(SH.pct4,0)}%</text>`;
  const n12=SH.per.find(o=>o.h===12);s+=`<text y="230" font-size="10.5" fill="#4f6f6b">Panjang bayangan 09/12/15</text><text y="248" font-size="12.5" font-weight="700">${[9,12,15].map(h=>{const o=SH.per.find(x=>x.h===h);return o&&isFinite(o.len)?nf(o.len,0):'–'}).join(' / ')} m</text></g>`;
  s+=`<g transform="translate(${W-200},${H-30})"><path d="M0,-12 L4,4 L0,1 L-4,4Z" fill="#0e8c84"/><text y="-14" font-size="9" text-anchor="middle" font-weight="700">U</text></g>`;
  s+=`<text x="14" y="${H-12}" font-size="10.5" fill="#4f6f6b">Garis = bayangan per jam (bangunan saja; pohon & bangunan sekitar belum dihitung). Waktu matahari lokal.</text>`;
  $('vsh').innerHTML=s; $('shNote').textContent=`Bulan ${MONTHS[SH.month]} (ubah lewat pilihan bulan di tab 3D). RTH rata-rata ${nf(SH.avgLawn,1)} jam matahari; ${nf(SH.pct4,0)}% RTH mendapat ≥ 4 jam.`;
  return SH;
}

/* ---------- Generator opsi desain ---------- */
let GEN=[];
function generateOptions(){
  const obj=$('genObj').value, cand=[], tg=[100,90,80,70];
  const push=ch=>{const r=simWith(ch);if(!r.allOk)return;const save=S;S=Object.assign({},S,ch);const Y=yieldCalc(r);S=save;cand.push({ch,total:r.total,H:r.H,klb:r.klbUsed,gfa:r.gfaUsed,green:r.green,units:Y.units,typo:ch.typo})};
  for(const t of tg){
    for(const u of [60,70,80,90,100]) push({typo:'blok',use:u,tgt:t});
    for(const n of [2,3,4,6,8]) for(const u of [70,85,100]) push({typo:'kluster',nC:n,use:u,tgt:t});
    for(const nT of [1,2,3,4]) for(let r=.15;r<=1/nT+1e-9;r+=.05) for(const k of [1,2,3,5,8]) for(const u of [80,100]) push({typo:'podium',nT,r:+r.toFixed(2),k,use:u,tgt:t});
  }
  const key={gfa:x=>-x.gfa,low:x=>x.total-x.gfa/1e9,green:x=>-x.green-x.gfa/1e9,units:x=>-x.units-x.gfa/1e9}[obj];
  cand.sort((a,b)=>key(a)-key(b));
  const seen=new Set();GEN=cand.filter(c=>{const k=[c.typo,nf(c.total,1),nf(c.gfa,0)].join();if(seen.has(k))return false;seen.add(k);return true}).slice(0,8);
  const desc=c=>c.typo==='blok'?`blok · pelat ${c.ch.use}%`:c.typo==='kluster'?`kluster ${c.ch.nC} massa · pelat ${c.ch.use}%`:`${c.ch.nT} menara · r ${nf(c.ch.r,2)} · k ${c.ch.k} · podium ${c.ch.use}%`;
  $('genOut').innerHTML=GEN.length?`<table class="t"><tr><th>#</th><th>Opsi</th><th style="text-align:right">KLB</th><th style="text-align:right">Lantai</th><th style="text-align:right">Tinggi</th><th style="text-align:right">RTH</th><th style="text-align:right">Unit</th><th></th></tr>`+
    GEN.map((c,i)=>`<tr><td>${i+1}</td><td>${desc(c)} · KLB target ${c.ch.tgt}%</td><td class="n">${nf(c.klb,2)}</td><td class="n">${nf2(c.total)}</td><td class="n">${nf(c.H,0)} m</td><td class="n">${nf(c.green)} m²</td><td class="n">${nf(c.units)}</td><td><button class="btn ghost sm" data-gen="${i}">Terapkan</button></td></tr>`).join('')+`</table><p class="note">${nf(cand.length)} opsi patuh ditemukan dari kombinasi tipologi, jumlah menara, lebar pelat menara (r), rasio luas (k), pelat dasar, dan target KLB; ditampilkan 8 teratas.</p>`
    :'<p class="note">Tidak ada kombinasi yang patuh. Periksa aturan (mis. KBG terlalu rendah untuk KLB yang diminta) atau GSB.</p>';
  $('genOut').querySelectorAll('[data-gen]').forEach(b=>b.onclick=()=>{const c=GEN[+b.dataset.gen];if(!baseSnap)$('btnBase').click();Object.assign(S,c.ch);persist();simulate();toast('Opsi '+(+b.dataset.gen+1)+' diterapkan')});
}
