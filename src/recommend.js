/* ---------- Rekomendasi perubahan desain ---------- */
let lastRecs=[];
function simWith(ch){const save=S;S=Object.assign({},S,ch);let r;try{r=compute()}finally{S=save}return r}
function passH(r){return r.C.filter(c=>c.k==='KBG'||c.k==='Tinggi'||c.k==='KLB').every(c=>c.ok)}
function searchParam(key,lo,hi,wantLow,pred,step){ // returns value nearest the current one that satisfies pred
  const okAt=v=>pred(simWith({[key]:v}));
  const end=wantLow?lo:hi; if(!okAt(end)) return null;
  let a=S[key],b=end; for(let i=0;i<40;i++){const m=(a+b)/2; if(okAt(m)) b=m; else a=m}
  let v=b; if(step){v=wantLow?Math.floor(v/step)*step:Math.ceil(v/step)*step; v=+v.toFixed(4); let g=0; while(!okAt(v)&&g++<50) v=+(v+(wantLow?-step:step)).toFixed(4)}
  return okAt(v)?v:null;
}
const fmtV=(k,v)=>k==='r'||k==='k'?nf(v,2):k==='nT'?String(v):nf(v,0)+(k==='tgt'||k==='use'||k==='soft'?'%':'');
function recommend(){
  const R=compute(), recs=[]; if(R.allOk){lastRecs=[];return recs}
  const hBad=R.C.some(c=>(c.k==='KBG'||c.k==='Tinggi')&&!c.ok);
  const add=(title,why,ch)=>{const r=simWith(ch);recs.push({title,why,ch,total:r.total,H:r.H,ok:r.allOk,okH:passH(r),klb:r.klbUsed,green:r.green,
    change:Object.entries(ch).map(([k,v])=>`${k==='nT'?'menara':k==='tgt'?'target KLB':k==='use'?'pelat podium/blok':k==='soft'?'area hijau':k==='typo'?'tipologi':k} ${typeof v==='number'?fmtV(k,S[k])+' → '+fmtV(k,v):S[k]+' → '+v}`).join(' · ')})};
  if(hBad){
    if(S.typo==='podium'){
      const n=Math.max(1,Math.round(S.nT)), rMax=1/n;
      const r=searchParam('r',S.r,rMax,false,passH,0.01);
      if(r!=null) add('Perlebar pelat tipikal menara',`Menara lebih lebar menampung luas yang sama dalam lebih sedikit lantai. Pelat menara menjadi ${nf(r*100,0)}% pelat podium (${nf(R.plate*r)} m²).`,{r});
      const k=searchParam('k',0,S.k,true,passH,0.1);
      if(k!=null) add('Ubah proporsi luas podium : menara',`Pindahkan sebagian luas lantai dari menara ke podium (pelat podium lebih besar, sehingga lebih hemat tinggi). Rasio menara : podium menjadi ${nf(k,1)} : 1.`,{k});
      for(let m=n+1;m<=Math.floor(1/Math.max(S.r,.05));m++){const r2=simWith({nT:m}); if(passH(r2)){add(`Pecah menjadi ${m} menara`,`Luas menara dibagi ke ${m} menara dengan pelat yang sama, sehingga setiap menara lebih pendek.`,{nT:m});break}}
      const comb=searchParam('r',S.r,rMax,false,r2=>passH(r2),0.01);
      if(r==null&&comb==null){const r3=+(rMax).toFixed(2), t=searchParamWith({r:r3},'tgt',10,S.tgt,true);if(t!=null) add('Kombinasi: menara selebar mungkin + kurangi luas lantai',`Pelat menara dimaksimalkan (${nf(r3*100,0)}%) dan target KLB diturunkan.`,{r:r3,tgt:t})}
    }
    if(S.use<100){const u=searchParam('use',S.use,100,false,passH,1); if(u!=null) add('Perbesar pelat lantai dasar/podium',`Pelat dasar dimanfaatkan hingga ${nf(u,0)}% dari luas dasar maksimum.`,{use:u})}
    const t=searchParam('tgt',10,S.tgt,true,passH,1);
    if(t!=null) add('Kurangi luas lantai total (KLB terpakai)',`Target pemakaian KLB diturunkan menjadi ${nf(t,0)}% (${nf(R.gfaMax*t/100)} m²). Bentuk massa tetap, tetapi luas jual/sewa berkurang.`,{tgt:t});
    if(S.typo!=='blok'){const rb=simWith({typo:'blok',use:100}); if(passH(rb)) add('Ganti tipologi menjadi blok penuh',`Satu massa memakai seluruh luas dasar maksimum: ${nf2(rb.total)} lantai.`,{typo:'blok',use:100})}
  }
  if(R.green<R.A*S.kdh/100-1e-6){
    if(R.open>=R.A*S.kdh/100){const s=searchParam('soft',S.soft,100,false,r=>r.green>=r.A*S.kdh/100-1e-6,1); if(s!=null) add('Perluas area hijau (softscape)',`Kurangi perkerasan; ${nf(s,0)}% ruang terbuka dijadikan taman.`,{soft:s})}
    else {const u=searchParam('use',20,S.use,true,r=>r.green>=r.A*S.kdh/100-1e-6&&passH(r),1); if(u!=null) add('Perkecil tapak bangunan',`Pelat dasar menjadi ${nf(u,0)}% dari luas dasar maksimum agar ruang terbuka cukup untuk KDH.`,{use:u,soft:100})}
  }
  // rank: fully compliant first, then smallest relative change
  const rel=x=>Object.entries(x.ch).reduce((s,[k,v])=>s+(typeof v==='number'&&S[k]?Math.abs(v-S[k])/Math.abs(S[k]):0.5),0);
  recs.sort((a,b)=>(b.ok-a.ok)||(b.okH-a.okH)||(rel(a)-rel(b)));
  compute(); lastRecs=recs; return recs;
}
function searchParamWith(base,key,lo,hi,wantLow){const save=S;S=Object.assign({},S,base);let v=null;try{v=searchParam(key,lo,hi,wantLow,passH,1)}finally{S=save}return v}
function renderRecs(R){
  const recs=recommend();
  if(R.allOk){$('advice').innerHTML='<p class="note" style="margin:0">Tidak ada pelanggaran. Coba naikkan target KLB atau ubah tipologi untuk melihat batasnya.</p>';return}
  $('advice').innerHTML=(R.adv.length?'<ul style="margin:0 0 10px;padding-left:18px">'+R.adv.map(a=>`<li style="margin-bottom:4px">${a}</li>`).join('')+'</ul>':'')+
    (recs.length?recs.map((x,i)=>`<div class="rec ${x.ok?'ok':''}"><div class="row" style="justify-content:space-between;align-items:flex-start"><b>${i===0?'★ ':''}${x.title}</b><span class="pill">${x.ok?'patuh semua':'patuh tinggi'}</span></div>
      <div class="note" style="margin:4px 0">${x.why}</div><div class="fx">${x.change}</div>
      <div class="row" style="margin-top:6px;justify-content:space-between"><span class="note">Hasil: <b>${nf2(x.total)} lantai</b> · ${nf(x.H,1)} m · KLB ${nf(x.klb,2)}</span><button class="btn sm" data-rec="${i}">Terapkan</button></div></div>`).join('')+
      '<p class="note" style="margin:6px 0 0">Saat diterapkan, desain sekarang otomatis ditandai sebagai desain awal agar perubahannya terlihat (garis putus-putus) dan bisa dibandingkan.</p>'
    :'<p class="note">Tidak ditemukan perubahan satu parameter yang membuat desain patuh; ubah beberapa parameter sekaligus atau tinjau aturan.</p>');
  $('advice').querySelectorAll('[data-rec]').forEach(b=>b.onclick=()=>{const x=lastRecs[+b.dataset.rec]; if(!baseSnap) $('btnBase').click(); Object.assign(S,x.ch); persist(); simulate(); toast('Rekomendasi diterapkan: '+x.title)});
}
