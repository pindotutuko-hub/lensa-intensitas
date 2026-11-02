/* ---------- Gambar kecil 2D/3D (dipakai kuis & laporan) ---------- */
function planFig(site,layers,o={}){
  const W=o.w||380,H=o.h||270,bb=bbox(site),pad=26,sc=Math.min((W-2*pad)/(bb.x1-bb.x0),(H-2*pad-14)/(bb.y1-bb.y0));
  const ox=(W-(bb.x1-bb.x0)*sc)/2-bb.x0*sc, oy=(H-14)/2+(bb.y0+bb.y1)/2*sc+4, T=p=>[p[0]*sc+ox,oy-p[1]*sc];
  let s=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%"><rect width="${W}" height="${H}" fill="#f6fbfa"/>`;
  s+=`<polygon points="${ptsStr(site.map(T))}" fill="${o.siteFill||'#eef6f4'}" stroke="#0e8c84" stroke-width="2"/>`;
  layers.forEach(l=>{ if(l.circle){const c=T([l.x,l.y]);s+=`<circle cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" r="${Math.max(1,l.r*sc).toFixed(1)}" fill="${l.fill}" fill-opacity=".6"/>`;return}
    s+=`<polygon points="${ptsStr(l.poly.map(T))}" fill="${l.fill||'none'}" fill-opacity="${l.op??.8}" stroke="${l.stroke||'#0f2f2c'}" stroke-width="${l.sw||1}" ${l.dash?'stroke-dasharray="4 3"':''}/>`;
    if(l.label){const b=bbox(l.poly.map(T));s+=`<text x="${((b.x0+b.x1)/2).toFixed(1)}" y="${((b.y0+b.y1)/2+4).toFixed(1)}" font-size="11.5" font-weight="700" text-anchor="middle" fill="${l.lc||'#fff'}" stroke="${l.ls||'rgba(0,0,0,.35)'}" stroke-width="2.5" paint-order="stroke">${esc(l.label)}</text>`}});
  if(o.edges){site.forEach((p,i)=>{const q=site[(i+1)%site.length],m=T([(p[0]+q[0])/2,(p[1]+q[1])/2]),len=Math.hypot(q[0]-p[0],q[1]-p[1]);s+=`<text x="${m[0].toFixed(1)}" y="${m[1].toFixed(1)}" font-size="10" text-anchor="middle" fill="#0e8c84" stroke="#f6fbfa" stroke-width="3" paint-order="stroke">${nf(len,1)} m</text>`;const v=T(p);s+=`<circle cx="${v[0].toFixed(1)}" cy="${v[1].toFixed(1)}" r="3" fill="#0e8c84"/><text x="${(v[0]+5).toFixed(1)}" y="${(v[1]-5).toFixed(1)}" font-size="10" font-weight="700" fill="#0f2f2c">${i+1}</text>`})}
  const raw=(bb.x1-bb.x0)/4,mag=Math.pow(10,Math.floor(Math.log10(raw))),len=[1,2,5,10].map(k=>k*mag).filter(v=>v<=raw).pop()||mag;
  s+=`<g transform="translate(14,${H-12})"><rect width="${len*sc}" height="4" fill="#0f2f2c"/><text y="-4" font-size="9.5">0</text><text x="${len*sc}" y="-4" font-size="9.5" text-anchor="middle">${nf(len)} m</text></g>`;
  s+=`<g transform="translate(${W-18},24)"><path d="M0,-12 L4,4 L0,1 L-4,4Z" fill="#0e8c84"/><text y="-14" font-size="9" text-anchor="middle" font-weight="700">U</text></g>`;
  if(o.title) s+=`<text x="10" y="16" font-size="11.5" font-weight="700" fill="#0f2f2c">${esc(o.title)}</text>`;
  return s+'</svg>';
}
function axoFig(site,prisms,o={}){
  const W=o.w||380,H=o.h||270,az=-35*Math.PI/180,el=30*Math.PI/180;
  const rot=([x,y,z])=>{const xr=x*Math.cos(az)-y*Math.sin(az),yr=x*Math.sin(az)+y*Math.cos(az);return[xr,-(z*Math.cos(el)+yr*Math.sin(el)),yr*Math.cos(el)-z*Math.sin(el)]};
  const top=Math.max(o.limZ||0,...prisms.map(p=>p.z1),5), pts=[];site.forEach(p=>{pts.push(rot([p[0],p[1],0]));pts.push(rot([p[0],p[1],top]))});
  const x0=Math.min(...pts.map(p=>p[0])),x1=Math.max(...pts.map(p=>p[0])),y0=Math.min(...pts.map(p=>p[1])),y1=Math.max(...pts.map(p=>p[1]));
  const sc=Math.min((W-50)/(x1-x0||1),(H-50)/(y1-y0||1)),ox=W/2-(x0+x1)/2*sc,oy=H/2+8-(y0+y1)/2*sc;
  const P=(x,y,z)=>{const r=rot([x,y,z]);return[r[0]*sc+ox,r[1]*sc+oy,r[2]]};
  const vx=-Math.sin(az),vy=-Math.cos(az);
  let s=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%"><defs><linearGradient id="skyq" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eaf5f6"/><stop offset="1" stop-color="#d8ebe6"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#skyq)"/>`;
  s+=`<polygon points="${ptsStr(site.map(p=>P(p[0],p[1],0)))}" fill="${o.siteFill||'#bcd9a8'}" stroke="#0e8c84" stroke-width="1.6"/>`;
  (o.flat||[]).forEach(f=>{s+=`<polygon points="${ptsStr(f.poly.map(p=>P(p[0],p[1],0.01)))}" fill="${f.fill}" fill-opacity="${f.op??.8}" stroke="${f.stroke||'none'}"/>`});
  const sh=(hex,f)=>{const n=parseInt(hex.slice(1),16);return`rgb(${[n>>16,(n>>8)&255,n&255].map(v=>Math.min(255,Math.round(v*f)))})`};
  const cols=prisms.map(p=>{const c=p.poly.reduce((m,q)=>[m[0]+q[0]/p.poly.length,m[1]+q[1]/p.poly.length],[0,0]);return{p,d:P(c[0],c[1],0)[2]}}).sort((a,b)=>(a.p.z0-b.p.z0)||(b.d-a.d));
  cols.forEach(({p})=>{const n=p.poly.length,faces=[];
    for(let i=0;i<n;i++){const a=p.poly[i],b=p.poly[(i+1)%n],nx=b[1]-a[1],ny=-(b[0]-a[0]),L=Math.hypot(nx,ny)||1;if((nx*vx+ny*vy)/L<=0)continue;
      const q=[P(a[0],a[1],p.z0),P(b[0],b[1],p.z0),P(b[0],b[1],p.z1),P(a[0],a[1],p.z1)],light=.75+.25*((nx*.6-ny*.8)/L+1)/2;let ln='';
      if(p.ftf){const nf_=Math.round((p.z1-p.z0)/p.ftf);if(nf_>1&&nf_<90)for(let k=1;k<nf_;k++){const z=p.z0+k*p.ftf,u=P(a[0],a[1],z),v=P(b[0],b[1],z);ln+=`<line x1="${u[0].toFixed(1)}" y1="${u[1].toFixed(1)}" x2="${v[0].toFixed(1)}" y2="${v[1].toFixed(1)}" stroke="rgba(255,255,255,.35)" stroke-width=".6"/>`}}
      faces.push({d:(q[0][2]+q[1][2]+q[2][2]+q[3][2])/4,s:`<polygon points="${ptsStr(q)}" fill="${sh(p.col,light)}" fill-opacity="${p.op??1}" stroke="rgba(0,0,0,.3)" stroke-width=".6" ${p.dash?'stroke-dasharray="3 3"':''}/>`+ln})}
    faces.sort((a,b)=>b.d-a.d);s+=faces.map(f=>f.s).join('');
    s+=`<polygon points="${ptsStr(p.poly.map(q=>P(q[0],q[1],p.z1)))}" fill="${sh(p.col,1.22)}" fill-opacity="${p.op??1}" stroke="rgba(0,0,0,.3)" stroke-width=".6"/>`;
    if(p.label){const c=p.poly.reduce((m,q)=>[m[0]+q[0]/n,m[1]+q[1]/n],[0,0]),t=P(c[0],c[1],p.z1);s+=`<text x="${t[0].toFixed(1)}" y="${(t[1]-7).toFixed(1)}" font-size="11.5" font-weight="700" text-anchor="middle" fill="#0f2f2c" stroke="#fff" stroke-width="3" paint-order="stroke">${esc(p.label)}</text>`}});
  if(o.limZ){const lp=site.map(p=>P(p[0],p[1],o.limZ));s+=`<polygon points="${ptsStr(lp)}" fill="rgba(179,38,30,.08)" stroke="#b3261e" stroke-dasharray="6 4" stroke-width="1.2"/>`;const r=lp.reduce((m,p)=>p[0]>m[0]?p:m,lp[0]);s+=`<text x="${(r[0]-4).toFixed(1)}" y="${(r[1]-5).toFixed(1)}" font-size="10.5" text-anchor="end" font-weight="700" fill="#b3261e">${esc(o.limLabel||'batas')}</text>`}
  if(o.title) s+=`<text x="10" y="16" font-size="11.5" font-weight="700" fill="#0f2f2c">${esc(o.title)}</text>`;
  return s+'</svg>';
}

/* ---------- Kuis berbasis persil asli ---------- */
function newQuiz(){
  quiz=[]; const box=$('quiz');
  if(!S.poly||S.poly.length<3){ box.innerHTML=`<div class="card"><h3>Persil belum digambar</h3><p>Kuis memakai bentuk dan luas <b>persil asli</b> dari peta. Gambar persil terlebih dahulu di halaman Peta tapak (tombol ✎ Gambar persil), lalu kembali ke sini.</p><a class="btn acc" href="#peta">Gambar persil di peta →</a></div>`; $('qScore').textContent=''; $('quizHead').innerHTML=''; return }
  const site=localSite(), A=Math.round(areaOfPoly()), r1=(a,b,st=1)=>rnd(a,b,st);
  $('quizHead').innerHTML=`<div class="card" style="display:grid;grid-template-columns:300px 1fr;gap:16px;align-items:center"><div>${planFig(site,[],{edges:true,title:'Persil asli',w:300,h:220})}</div><div><h3>Data persil</h3><dl class="sitebox"><dt>Lokasi</dt><dd>${esc(S.place)}${S.kab?', '+esc(S.kab):''}</dd><dt>Koordinat</dt><dd>${S.lat.toFixed(5)}, ${S.lng.toFixed(5)}</dd><dt>Luas</dt><dd>${nf(A)} m²</dd><dt>Keliling</dt><dd>${nf(site.reduce((s,p,i)=>s+Math.hypot(site[(i+1)%site.length][0]-p[0],site[(i+1)%site.length][1]-p[1]),0),1)} m</dd><dt>Titik sudut</dt><dd>${site.length}</dd></dl><p class="note">Semua soal memakai luas & bentuk persil ini; angka aturan diacak setiap “Soal baru”.</p></div></div>`;
  // Q1 KDB
  {const kdb=r1(40,80,5),fp=A*kdb/100; quiz.push({q:`Persil ini ${nf(A)} m² dengan KDB ${kdb}%. Berapa luas dasar bangunan maksimum?`,a:fp,u:'m²',why:`${kdb}% × ${nf(A)} = ${nf(fp)} m²`,
    fig:rv=>[planFig(site,[{poly:scaleP(site,kdb/100),fill:'#2f5d8a',op:rv?.8:.25,dash:!rv,label:rv?`${nf(fp)} m²`:`KDB ${kdb}% = ?`}],{title:'2D · denah persil'}),
             axoFig(site,[{poly:scaleP(site,kdb/100),z0:0,z1:4,col:'#2f5d8a',op:rv?1:.35,label:rv?'tapak '+nf(fp)+' m²':'?'}],{title:'3D · tapak bangunan'})]})}
  // Q2 KLB
  {const klb=r1(1,6,0.5),kdb=60,G=A*klb,n=klb/(kdb/100); quiz.push({q:`Pada persil yang sama, KLB ${nf2(klb)}. Berapa total luas lantai maksimum yang boleh dibangun?`,a:G,u:'m²',why:`${nf2(klb)} × ${nf(A)} = ${nf(G)} m² (jika pelat ${kdb}% lahan, setara ±${nf(n,1)} lantai)`,
    fig:rv=>[planFig(site,[{poly:scaleP(site,kdb/100),fill:'#2f5d8a',op:.55,label:`pelat ${kdb}%`}],{title:'2D · pelat lantai'}),
             axoFig(site,[{poly:scaleP(site,kdb/100),z0:0,z1:n*4,ftf:4,col:'#2f5d8a',op:rv?1:.3,label:rv?`Σ ${nf(G)} m²`:'Σ luas lantai = ?'}],{title:'3D · tumpukan lantai'})]})}
  // Q3 lantai
  {const kdb=r1(40,80,5),klb=r1(2,8,0.5),n=klb/(kdb/100); quiz.push({q:`KDB ${kdb}% dan KLB ${nf2(klb)}; setiap lantai memakai luas dasar maksimum. Berapa jumlah lantai (boleh desimal)?`,a:n,u:'lantai',why:`KLB ÷ KDB = ${nf2(klb)} ÷ ${kdb/100} = ${nf(n,2)} lantai`,
    fig:rv=>[planFig(site,[{poly:scaleP(site,kdb/100),fill:'#2f5d8a',label:`KDB ${kdb}%`}],{title:'2D · tapak'}),
             axoFig(site,[{poly:scaleP(site,kdb/100),z0:0,z1:(rv?n:Math.max(1,n*.35))*3.5,ftf:3.5,col:'#2f5d8a',op:rv?1:.35,dash:!rv,label:rv?`${nf(n,2)} lantai`:'? lantai'}],{title:'3D · massa'})]})}
  // Q4 podium + menara
  {const kdb=r1(60,80,5),klb=r1(4,8,1),k=r1(2,6,1),r=[0.2,0.25,0.3,0.4][r1(0,3)],kbg=r1(15,30,5);const G=A*klb,foot=A*kdb/100,fP=G/(1+k)/foot,fT=G*k/(1+k)/(foot*r),tot=fP+fT,ok=tot<=kbg;
   quiz.push({q:`Podium + menara tunggal di persil ini: KDB ${kdb}%, KLB ${klb}, luas menara = ${k}× luas podium, pelat menara = ${nf2(r)}× pelat podium, KBG ${kbg} lantai. Berapa total lantai (desimal)? Patuh KBG?`,a:tot,u:'lantai',why:`podium ${nf(fP,2)} + menara ${nf(fT,2)} = ${nf(tot,2)} lantai → ${ok?'patuh':'melanggar'} KBG ${kbg}`,
    fig:rv=>{const pod=scaleP(site,kdb/100),tw=scaleP(site,kdb/100*r),zp=fP*4.5,zt=rv?fT*3.3:Math.min(fT,kbg)*1.2;const pr=[{poly:pod,z0:0,z1:zp,ftf:4.5,col:'#2f5d8a'}];
      if(rv&&!ok){pr.push({poly:tw,z0:zp,z1:zp+(kbg-fP)*3.3,ftf:3.3,col:'#d98a2b'},{poly:tw,z0:zp+(kbg-fP)*3.3,z1:zp+fT*3.3,ftf:3.3,col:'#c0392b',label:`${nf(tot,2)} lt`})}else pr.push({poly:tw,z0:zp,z1:zp+zt,ftf:3.3,col:'#d98a2b',op:rv?1:.35,dash:!rv,label:rv?`${nf(tot,2)} lt`:'? lt'});
      return[planFig(site,[{poly:pod,fill:'#2f5d8a',label:'podium'},{poly:tw,fill:'#d98a2b',op:.95,label:'menara'}],{title:'2D · podium & menara'}),axoFig(site,pr,{limZ:zp+(kbg-fP)*3.3,limLabel:`KBG ${kbg} lt`,title:'3D · cek KBG'})]}})}
  // Q5 KDH
  {const kdb=r1(50,80,5),kdh=r1(10,30,5),soft=r1(30,90,10),open=A*(1-kdb/100),green=open*soft/100,need=A*kdh/100;
   quiz.push({q:`KDB ${kdb}% dipakai penuh; ${soft}% ruang terbuka dijadikan taman. Berapa luas RTH yang terbentuk? (KDH minimum ${kdh}% → ${green>=need?'terpenuhi':'tidak terpenuhi'}; isi luasnya.)`,a:green,u:'m²',why:`ruang terbuka ${nf(open)} × ${soft}% = ${nf(green)} m² ${green>=need?'≥':'<'} KDH ${nf(need)} m²`,
    fig:rv=>{const fp=scaleP(site,kdb/100),pav=scaleP(site,kdb/100+(1-kdb/100)*(1-soft/100));return[planFig(site,[{poly:pav,fill:'#d9d4ca',op:1,stroke:'#b9b1a3'},{poly:fp,fill:'#2f5d8a',label:'bangunan'}],{siteFill:rv?(green>=need?'#7fae5a':'#e3a79c'):'#cfe3c0',title:'2D · RTH (hijau) vs perkerasan'}),
      axoFig(site,[{poly:fp,z0:0,z1:8,ftf:4,col:'#2f5d8a'}],{flat:[{poly:pav,fill:'#d9d4ca',op:1}],siteFill:rv?(green>=need?'#7fae5a':'#e3a79c'):'#bcd9a8',title:rv?`3D · RTH ${nf(green)} m²`:'3D · RTH = ?'})]}})}
  // Q6 tinggi meter
  {const n=r1(4,40,1),ftf=[3,3.3,3.5,4][r1(0,3)],hm=r1(30,140,5),H=n*ftf,ok=H<=hm;
   quiz.push({q:`Bangunan ${n} lantai dengan tinggi lantai ${nf2(ftf)} m. Berapa tingginya (m)? Batas tinggi (mis. KKOP) ${hm} m → ${ok?'patuh':'melanggar'}.`,a:H,u:'m',why:`${n} × ${nf2(ftf)} = ${nf(H,1)} m ${ok?'≤':'>'} ${hm} m`,
    fig:rv=>{const fp=scaleP(site,.5);return[planFig(site,[{poly:fp,fill:'#2f5d8a',label:`${n} lantai`}],{title:'2D · tapak'}),axoFig(site,[{poly:fp,z0:0,z1:H,ftf,col:rv&&!ok?'#c0392b':'#2f5d8a',op:rv?1:.4,label:rv?`${nf(H,1)} m`:'? m'}],{limZ:hm,limLabel:`batas ${hm} m`,title:'3D · tinggi vs batas'})]}})}
  renderQuiz(false);
}
function renderQuiz(check){
  if(!quiz.length) return; let sc=0;
  $('quiz').innerHTML=quiz.map((x,i)=>{const v=parseFloat(String(x.ans||'').replace(/\./g,'').replace(',','.'));const ok=check&&isFinite(v)&&Math.abs(v-x.a)<=Math.abs(x.a)*0.01+0.011;if(ok)sc++;const f=x.fig(check);
    return `<div class="q ${check?(ok?'ok':'bad'):''}"><div class="qgrid"><div><div class="qn">SOAL ${i+1}</div><div>${x.q}</div><div class="ir" style="margin-top:8px;max-width:320px"><input type="text" data-i="${i}" value="${esc(x.ans||'')}" placeholder="jawaban"><span class="u">${x.u}</span></div>${check?`<div class="note" style="margin-top:8px">${ok?'<b style="color:var(--ok)">Benar.</b>':'<b style="color:var(--bad)">Belum tepat.</b> Jawaban: '+nf(x.a,2)+' '+x.u}<br>Cara: <span class="fx">${x.why}</span></div>`:''}</div><div class="qfig">${f[0]}</div><div class="qfig">${f[1]}</div></div></div>`}).join('');
  $('quiz').querySelectorAll('input').forEach(inp=>inp.oninput=()=>{quiz[+inp.dataset.i].ans=inp.value});
  $('qScore').textContent=check?`Skor ${sc}/${quiz.length}`:'';
}

/* ---------- Laporan ---------- */
const DOCS=[];
const PDF_WORKER_URL='/*PDF_WORKER_URL*/';
function pdfReady(){ if(!window.pdfjsLib) return false; if(!pdfjsLib.GlobalWorkerOptions.workerSrc){ const inl=document.getElementById('pdfWorkerSrc'); pdfjsLib.GlobalWorkerOptions.workerSrc=PDF_WORKER_URL||(inl&&inl.textContent.length>100?URL.createObjectURL(new Blob([inl.textContent],{type:'text/javascript'})):'') } return true }
function detectRules(text){
  const out=[], T=text.replace(/\s+/g,' ');
  const pats=[['kdb',/(KDB|Koefisien Dasar Bangunan)[^0-9]{0,30}?(\d{1,3}(?:[.,]\d+)?)\s*(%|persen)/gi],['klb',/(KLB|Koefisien Lantai Bangunan)[^0-9]{0,30}?(\d{1,2}(?:[.,]\d+)?)(?!\s*(%|persen|tahun|ayat))/gi],
    ['kdh',/(KDH|Koefisien Daerah Hijau)[^0-9]{0,30}?(\d{1,3}(?:[.,]\d+)?)\s*(%|persen)/gi],['kbg',/(KBG|Ketinggian Bangunan(?: Gedung)?|tinggi bangunan(?: maksimal| paling tinggi)?)[^0-9]{0,30}?(\d{1,3})\s*(lantai|lt\b)/gi]];
  pats.forEach(([k,re])=>{let m;while((m=re.exec(T))&&out.length<80){let v=parseFloat(m[2].replace(',','.'));if((k==='kdb'||k==='kdh')&&v<=1)v*=100;out.push({k,v,ctx:T.slice(Math.max(0,m.index-70),Math.min(T.length,m.index+m[0].length+50))})}});
  return out;
}
async function readDoc(file){
  const ext=(file.name.split('.').pop()||'').toLowerCase(), d={name:file.name,ext,size:file.size,text:'',tables:[],found:[],note:''};
  try{
    if(ext==='csv'){const t=await file.text();d.tables=[{name:'CSV',rows:parseCSV(t)}];d.text=t}
    else if(ext==='xlsx'||ext==='xls'){ if(!window.XLSX) throw new Error('pustaka SheetJS tidak termuat'); const wb=XLSX.read(await file.arrayBuffer(),{type:'array'});
      wb.SheetNames.forEach(n=>{const rows=XLSX.utils.sheet_to_json(wb.Sheets[n],{header:1,raw:false,defval:''});d.tables.push({name:n,rows});d.text+=rows.map(r=>r.join(' ')).join('\n')+'\n'})}
    else if(ext==='docx'){ if(!window.mammoth) throw new Error('pustaka mammoth tidak termuat'); const r=await mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()}); d.text=r.value}
    else if(ext==='pdf'){ if(!pdfReady()) throw new Error('pustaka PDF.js tidak termuat'); const pdf=await pdfjsLib.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise; d.pages=pdf.numPages;
      const N=Math.min(pdf.numPages,80); for(let i=1;i<=N;i++){const pg=await pdf.getPage(i);const tc=await pg.getTextContent();d.text+=tc.items.map(it=>it.str).join(' ')+'\n'} if(pdf.numPages>N) d.note=`Hanya ${N} dari ${pdf.numPages} halaman dibaca.`; if(d.text.trim().length<20) d.note+=' Teks hampir kosong: kemungkinan PDF hasil pindaian (perlu OCR).'}
    else throw new Error('format tidak didukung');
    d.found=detectRules(d.text);
  }catch(e){d.err=e.message}
  return d;
}
function renderDocs(){
  $('docList').innerHTML=DOCS.length?DOCS.map((d,i)=>`<div class="q" style="background:var(--card)"><div class="row" style="justify-content:space-between"><b>${esc(d.name)}</b><span class="pill">${d.ext.toUpperCase()} · ${nf(d.size/1024,0)} KB${d.pages?` · ${d.pages} hlm`:''}${d.tables.length?` · ${d.tables.length} tabel`:''}</span></div>
    ${d.err?`<p class="note" style="color:var(--bad)">Gagal dibaca: ${esc(d.err)}</p>`:''}${d.note?`<p class="note">${esc(d.note)}</p>`:''}
    ${d.found.length?`<table class="t" style="margin-top:6px"><tr><th>Temuan</th><th style="text-align:right">Nilai</th><th>Konteks dalam dokumen</th><th></th></tr>${d.found.slice(0,12).map((f,j)=>`<tr><td>${f.k.toUpperCase()}</td><td class="n">${nf2(f.v)}${f.k==='kdb'||f.k==='kdh'?'%':f.k==='kbg'?' lt':''}</td><td class="note">…${esc(f.ctx)}…</td><td><button class="btn ghost sm" data-ap="${i}:${j}">Terapkan</button></td></tr>`).join('')}</table><p class="note">Temuan dideteksi otomatis dari teks; cocokkan dengan pasal/zona yang benar sebelum diterapkan.</p>`:(!d.err?'<p class="note">Tidak ditemukan angka KDB/KLB/KDH/KBG yang jelas.</p>':'')}
    ${d.tables.length?`<div class="row" style="margin-top:6px"><button class="btn ghost sm" data-tz="${i}">Tambahkan tabel ke daftar zona</button><button class="btn ghost sm" data-rm="${i}">Hapus</button></div>`:`<div class="row" style="margin-top:6px"><button class="btn ghost sm" data-rm="${i}">Hapus</button></div>`}</div>`).join(''):'<p class="note">Belum ada dokumen.</p>';
  $('docList').querySelectorAll('[data-ap]').forEach(b=>b.onclick=()=>{const [i,j]=b.dataset.ap.split(':').map(Number),f=DOCS[i].found[j];S[f.k]=f.v;S.zone='custom';S.ruleSrc=`${f.k.toUpperCase()} dari ${DOCS[i].name}`;persist();syncInputs();renderMini();compute();toast(`${f.k.toUpperCase()} = ${nf2(f.v)} diterapkan`)});
  $('docList').querySelectorAll('[data-tz]').forEach(b=>b.onclick=()=>{const d=DOCS[+b.dataset.tz];d.tables.forEach(t=>importCSV(t.rows.map(r=>r.map(c=>String(c).replace(/[;,]/g,' ')).join(';')).join('\n'),d.name+' / '+t.name))});
  $('docList').querySelectorAll('[data-rm]').forEach(b=>b.onclick=()=>{DOCS.splice(+b.dataset.rm,1);renderDocs()});
}
$('docFiles').onchange=async e=>{const fs=[...e.target.files];$('docList').insertAdjacentHTML('afterbegin','<p class="note" id="docBusy">Membaca dokumen…</p>');for(const f of fs) DOCS.push(await readDoc(f));e.target.value='';renderDocs()};
function svgToPng(svgEl,w=1400){return new Promise(res=>{try{const s=typeof svgEl==='string'?svgEl:new XMLSerializer().serializeToString(svgEl);const svg=s.includes('xmlns=')?s:s.replace('<svg','<svg xmlns="http://www.w3.org/2000/svg"');
  const vb=(svg.match(/viewBox="([\d.\s-]+)"/)||[])[1],[,,vw,vh]=vb?vb.split(/\s+/).map(Number):[0,0,760,480],h=Math.round(w*vh/vw);
  const st='<style>text{font-family:Inter,Arial,Helvetica,sans-serif}</style>';const img=new Image();img.onload=()=>{const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,w,h);g.drawImage(img,0,0,w,h);res({url:c.toDataURL('image/png'),w,h})};img.onerror=()=>res(null);
  img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg.replace(/<svg([^>]*)>/,`<svg$1 width="${w}" height="${h}">${st}`))}catch(e){res(null)}})}
function snap3D(w=1400,h=860){ if(!GL.ok) return null; try{GL.r.setSize(w,h,false);GL.cam.aspect=w/h;GL.cam.updateProjectionMatrix();GL.ctl.update();GL.r.render(GL.scene,GL.cam);const u=GL.r.domElement.toDataURL('image/png');GL.resize();return{url:u,w,h}}catch(e){GL.resize();return null}}
let REPORT=null;
async function buildReport(){
  $('repStatus').textContent='Menyusun laporan…';
  const prevTab=vizTab; location.hash!=='#laporan'; simulate(); const R=lastRes, M=R._M, site=M.site, A=R.A;
  const per=site.reduce((s,p,i)=>s+Math.hypot(site[(i+1)%site.length][0]-p[0],site[(i+1)%site.length][1]-p[1]),0), bb=bbox(site);
  setView('iso'); const img3=snap3D(); setView('eye'); const imgEye=snap3D(1400,780); setView('iso');
  const imgs={persil:await svgToPng(planFig(site,[],{edges:true,title:'Geometri persil (koordinat lokal dari geotag)',w:760,h:480})),
    denah:await svgToPng($('v2d')),potongan:await svgToPng($('vsec')),lokasi:await svgToPng($('vloc')),d3:img3,eye:imgEye};
  if(!imgs.d3){draw3D(R);imgs.d3=await svgToPng($('v3d'))}
  const by={};(M.trees||[]).forEach(t=>by[t.sp]=(by[t.sp]||0)+1);
  const meta={judul:$('rp_judul').value||'Laporan Kajian Intensitas Bangunan',penyusun:$('rp_penyusun').value,instansi:$('rp_instansi').value,catatan:$('rp_catatan').value,tgl:new Date().toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'})};
  const refs=[...document.querySelectorAll('#v-rujukan ol.reflist li')].map(li=>({t:li.childNodes[1]?li.textContent.replace(/https?:\/\/\S+$/,'').replace(/^\S+\s/,'').trim():li.textContent,u:(li.querySelector('a')||{}).href}));
  const stepsTxt=[...document.querySelectorAll('#steps li')].map(li=>li.innerText.replace(/\n+/g,' · '));
  REPORT={meta,R,site,per,bb,imgs,by,refs,stepsTxt,docs:DOCS.slice(),S:JSON.parse(JSON.stringify(S)),base:baseSnap};
  renderReportHTML(); $('repStatus').textContent=`Laporan disusun ${new Date().toLocaleTimeString('id-ID')}. Periksa pratinjau, lalu cetak/unduh.`; vizTab=prevTab;
}
function repTable(head,rows){return `<table class="rt"><tr>${head.map(h=>`<th>${h}</th>`).join('')}</tr>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</table>`}
function renderReportHTML(){
  const {meta,R,site,per,bb,imgs,by,refs,stepsTxt,docs,S:s}=REPORT; const fig=(im,cap,n)=>im?`<figure><img src="${im.url}" alt=""><figcaption>Gambar ${n}. ${cap}</figcaption></figure>`:'';
  const ok=R.allOk, bad=R.C.filter(c=>!c.ok);
  const coords=(s.poly||[]).map((p,i)=>[i+1,p[0].toFixed(6),p[1].toFixed(6)]);
  let h=`<div class="rcover"><div class="rk">LAPORAN KAJIAN</div><h1>${esc(meta.judul)}</h1><p>${esc(s.name)} · ${esc(s.place)}${s.kab?', '+esc(s.kab):''}${s.prov?', '+esc(s.prov):''}</p><p>${meta.penyusun?'Disusun oleh: <b>'+esc(meta.penyusun)+'</b><br>':''}${meta.instansi?esc(meta.instansi)+'<br>':''}${meta.tgl}</p><div class="rbadge ${ok?'ok':'bad'}">${ok?'PATUH SEMUA KETENTUAN':'MELANGGAR: '+bad.map(c=>c.k).join(', ')}</div></div>`;
  h+=`<h2>Ringkasan</h2><p>Persil seluas <b>${nf(R.A)} m²</b> di ${esc(s.place)} (${s.lat.toFixed(5)}, ${s.lng.toFixed(5)}) dikaji dengan ketentuan KDB ${s.kdb}%, KLB ${nf2(s.klb)}, KDH ${s.kdh}%, dan KBG ${s.kbg} lantai${s.hmax?`, batas tinggi ${s.hmax} m`:''}. Skenario <b>${({blok:'blok tunggal',podium:'podium + menara',kluster:'kluster'})[s.typo]}</b> menghasilkan <b>${nf2(R.total)} lantai</b> (±${nf(R.H,1)} m), luas lantai ${nf(R.gfaUsed)} m² (KLB terpakai ${nf(R.klbUsed,2)}), tapak ${nf(R.footprint)} m², dan RTH ${nf(R.green)} m² dengan ${R.treeCount} tanaman. Status: <b style="color:${ok?'#2e6b3f':'#b3261e'}">${ok?'patuh':'melanggar '+bad.map(c=>c.k).join(', ')}</b>.</p>`;
  h+=`<h2>1. Lokasi dan persil</h2>${fig(imgs.lokasi,'Lokasi persil pada peta Indonesia.',1)}${fig(imgs.persil,'Geometri persil hasil penggambaran pada peta geotag; nomor = titik sudut, angka = panjang sisi.',2)}
    ${repTable(['Parameter','Nilai'],[['Luas persil',nf(R.A)+' m² ('+nf(R.A/10000,3)+' ha)'],['Keliling',nf(per,1)+' m'],['Bentang (B–T × U–S)',nf(bb.x1-bb.x0,1)+' × '+nf(bb.y1-bb.y0,1)+' m'],['Jumlah titik sudut',site.length],['Sumber geometri',s.poly?'Poligon digambar pada peta (WGS84)':'Luas diisi manual (bentuk diasumsikan bujur sangkar)']])}
    ${coords.length?'<h3>Koordinat titik sudut (WGS84)</h3>'+repTable(['No.','Lintang','Bujur'],coords):''}`;
  h+=`<h2>2. Ketentuan intensitas</h2>${repTable(['Ketentuan','Nilai','Keterangan'],[['KDB',s.kdb+'%','Luas dasar maks '+nf(R.footMax)+' m²'],['KLB',nf2(s.klb),'Luas lantai maks '+nf(R.gfaMax)+' m²'],['KDH',s.kdh+'%','RTH minimum '+nf(R.A*s.kdh/100)+' m²'],['KBG',s.kbg+' lantai',''],['Batas tinggi',s.hmax?s.hmax+' m':'—','mis. KKOP']])}
    <p class="rnote">Sumber nilai: ${esc(s.ruleSrc||(s.zone==='custom'?'diisi pengguna':'contoh zona ilustratif (bukan kutipan peraturan)'))}. Definisi mengikuti PP 16/2021; nilai yang sah mengacu RDTR/peraturan zonasi dan KKPR persil.</p>`;
  h+=`<h2>3. Skenario desain</h2>${repTable(['Parameter','Nilai'],[['Tipologi',({blok:'Blok tunggal',podium:'Podium + menara',kluster:'Kluster'})[s.typo]],['Target pemakaian KLB',s.tgt+'%'],['Pelat dasar/podium',s.use+'% dari luas dasar maks = '+nf(R.plate)+' m²'],...(s.typo==='podium'?[['Rasio luas menara : podium (k)',nf2(s.k)],['Pelat menara (r)',nf2(s.r)+' × pelat podium = '+nf(R.towerPlate)+' m²'],['Jumlah menara',R.nT]]:[]),...(s.typo==='kluster'?[['Jumlah massa',R.n]]:[]),['Tinggi lantai',s.ftfP+' m'+(s.typo==='podium'?' (podium) / '+s.ftfT+' m (menara)':'')],['Pembulatan',({exact:'eksak',ceil:'ke atas',floor:'patuh KLB'})[s.rnd]]])}`;
  h+=`<h2>4. Perhitungan</h2><ol class="rsteps">${stepsTxt.map(x=>`<li>${esc(x)}</li>`).join('')}</ol>`;
  h+=`<h2>5. Kepatuhan</h2>${repTable(['Aspek','Hasil','Status'],R.C.map(c=>[c.k,esc(c.m),c.warn?'⚠ catatan':c.ok?'✓ patuh':'✕ melanggar']))}${R.adv.length?'<h3>Saran agar patuh</h3><ul>'+R.adv.map(a=>`<li>${a}</li>`).join('')+'</ul>':''}`;
  h+=`<h2>6. Visualisasi</h2>${fig(imgs.d3,'Model 3D massa bangunan di atas persil (lantai merah = di atas KBG; bidang merah putus-putus = batas KBG).',3)}${fig(imgs.eye,'Pandangan setinggi mata manusia.',4)}${fig(imgs.denah,'Denah tapak 2D: tapak bangunan, perkerasan, RTH dan tajuk pohon.',5)}${fig(imgs.potongan,'Potongan barat–timur terhadap batas KBG.',6)}`;
  h+=`<h2>7. RTH dan vegetasi</h2><p>Area hijau ${nf(R.green)} m² (${nf(R.green/R.A*100,1)}% lahan) dari ruang terbuka ${nf(R.open)} m²; KDH ${s.kdh}% ${R.green>=R.A*s.kdh/100?'terpenuhi':'belum terpenuhi'}.</p>${repTable(['Jenis','Nama ilmiah','Jumlah','Tinggi × tajuk (m)'],Object.entries(TREES).filter(([k])=>s.spp.includes(k)).map(([k,T])=>[T.n,'<i>'+T.sci+'</i>',by[k]||0,nf(T.H*s.grow/100,1)+' × '+nf(T.D*s.grow/100,1)]))}<p class="rnote">Ukuran mengacu rentang pada sumber spesies (Rujukan); penataan pohon otomatis bersifat ilustratif.</p>`;
  if(REPORT.base) h+=`<h2>8. Perbandingan dengan desain awal</h2>${repTable(['Indikator','Desain awal','Desain sekarang'],[['Total lantai',nf2(REPORT.base.total),nf2(R.total)],['KLB terpakai',nf(REPORT.base.klb,2),nf(R.klbUsed,2)],['Tapak (m²)',nf(REPORT.base.fp),nf(R.footprint)],['Status',REPORT.base.ok?'patuh':'melanggar',R.allOk?'patuh':'melanggar']])}`;
  if(docs.length){h+=`<h2>${REPORT.base?9:8}. Dokumen pendukung yang diimpor</h2>`+docs.map(d=>`<h3>${esc(d.name)}</h3><p class="rnote">${d.ext.toUpperCase()}${d.pages?' · '+d.pages+' halaman':''}${d.tables.length?' · '+d.tables.length+' tabel':''}${d.err?' · gagal dibaca: '+esc(d.err):''}</p>${d.found.length?repTable(['Temuan','Nilai','Konteks'],d.found.slice(0,10).map(f=>[f.k.toUpperCase(),nf2(f.v),'…'+esc(f.ctx)+'…'])):''}${d.tables.slice(0,3).map(t=>`<p class="rnote">Tabel “${esc(t.name)}” (maks. 25 baris pertama)</p>`+repTable(t.rows[0]?t.rows[0].slice(0,8).map(esc):[],t.rows.slice(1,26).map(r=>r.slice(0,8).map(c=>esc(c))))).join('')}${!d.tables.length&&d.text?`<p class="rnote">Cuplikan teks: ${esc(d.text.slice(0,600))}…</p>`:''}`).join('')}
  if(meta.catatan) h+=`<h2>Catatan</h2><p>${esc(meta.catatan).replace(/\n/g,'<br>')}</p>`;
  h+=`<h2>Rujukan</h2><ol class="rrefs">${refs.map(r=>`<li>${esc(r.t)} <a href="${r.u}">${r.u}</a></li>`).join('')}</ol><p class="rnote">Dihasilkan oleh Lensa Intensitas (Pindo Tutuko, Arsitektur UNMER Malang). Angka dihitung otomatis dari masukan pengguna; verifikasi terhadap dokumen RDTR/KKPR resmi sebelum dipakai untuk keputusan.</p>`;
  $('repDoc').innerHTML=h; $('repDoc').hidden=false; REPORT.html=h;
}
async function saveFile(name,blob){
  try{ if(window.claude&&claude.use){const d=await Promise.race([claude.use('downloads'),new Promise(r=>setTimeout(()=>r(null),1500))]); if(d){await d.save({filename:name,data:blob});return}} }catch(e){}
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500);
}
const REP_CSS=`body{font-family:Inter,Arial,sans-serif;color:#0f2f2c;max-width:860px;margin:30px auto;padding:0 24px;line-height:1.55;font-size:14px}h1{font-size:30px;margin:6px 0}h2{color:#0e8c84;border-bottom:2px solid #0e8c84;padding-bottom:4px;margin-top:28px;font-size:20px}h3{font-size:15px;margin:16px 0 6px}.rcover{padding:28px;border-radius:12px;background:#e6f1ef;margin-bottom:20px}.rk{letter-spacing:.2em;font-size:11px;color:#0e8c84;font-weight:700}.rbadge{display:inline-block;padding:6px 14px;border-radius:99px;color:#fff;font-weight:700;font-size:12.5px}.rbadge.ok{background:#2e6b3f}.rbadge.bad{background:#b3261e}table.rt{width:100%;border-collapse:collapse;margin:8px 0;font-size:12.5px}table.rt th{background:#0e8c84;color:#fff;text-align:left;padding:6px}table.rt td{border-bottom:1px solid #d5e6e3;padding:5px 6px;vertical-align:top}figure{margin:14px 0;page-break-inside:avoid}figure img{width:100%;border:1px solid #d5e6e3;border-radius:6px}figcaption{font-size:12px;color:#4f6f6b;margin-top:4px}.rnote{font-size:12px;color:#4f6f6b}.rrefs{font-size:11.5px}.rrefs a{word-break:break-all}`;
$('repBuild').onclick=buildReport;
$('repHTML').onclick=()=>{if(!REPORT){toast('Susun laporan dulu');return} saveFile(slug()+'.html',new Blob([`<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><title>${esc(REPORT.meta.judul)}</title><style>${REP_CSS}</style></head><body>${REPORT.html}</body></html>`],{type:'text/html'}))};
$('repPrint').onclick=()=>{if(!REPORT){toast('Susun laporan dulu');return} try{document.body.classList.add('printing');window.print();setTimeout(()=>document.body.classList.remove('printing'),500)}catch(e){toast('Cetak tidak tersedia di sini; unduh HTML/DOCX lalu cetak')}};
const slug=()=>(REPORT.meta.judul+'-'+REPORT.S.place).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60);
$('repDocx').onclick=async()=>{
  if(!REPORT){toast('Susun laporan dulu');return} if(!window.docx){toast('Pustaka DOCX tidak termuat');return}
  const D=window.docx,{Document,Packer,Paragraph,TextRun,HeadingLevel,Table,TableRow,TableCell,WidthType,ImageRun,AlignmentType,ShadingType}=D;
  const P=(t,o={})=>new Paragraph({children:[new TextRun({text:String(t),...o})],spacing:{after:120}});
  const H=(t,l=1)=>new Paragraph({text:t,heading:l===1?HeadingLevel.HEADING_1:HeadingLevel.HEADING_2,spacing:{before:240,after:120}});
  const TB=(head,rows)=>new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[new TableRow({tableHeader:true,children:head.map(h=>new TableCell({shading:{type:ShadingType.CLEAR,fill:'0E8C84',color:'auto'},children:[new Paragraph({children:[new TextRun({text:String(h),bold:true,color:'FFFFFF',size:20})]})]}))}),...rows.map(r=>new TableRow({children:r.map(c=>new TableCell({children:[new Paragraph({children:[new TextRun({text:String(c).replace(/<[^>]+>/g,''),size:20})]})]}))}))]});
  const IMG=(im,cap)=>{if(!im)return[];const b=Uint8Array.from(atob(im.url.split(',')[1]),c=>c.charCodeAt(0)),w=600,h=Math.round(w*im.h/im.w);return[new Paragraph({children:[new ImageRun({type:'png',data:b,transformation:{width:w,height:h}})]}),new Paragraph({children:[new TextRun({text:cap,italics:true,size:18,color:'4F6F6B'})],spacing:{after:200}})]};
  const {meta,R,site,per,bb,imgs,by,refs,stepsTxt,docs,S:s}=REPORT, bad=R.C.filter(c=>!c.ok);
  const ch=[new Paragraph({children:[new TextRun({text:'LAPORAN KAJIAN',bold:true,color:'0E8C84',size:20})]}),new Paragraph({children:[new TextRun({text:meta.judul,bold:true,size:44})],spacing:{after:200}}),
    P(`${s.name} · ${s.place}${s.kab?', '+s.kab:''}${s.prov?', '+s.prov:''}`),meta.penyusun?P('Disusun oleh: '+meta.penyusun,{bold:true}):P(''),meta.instansi?P(meta.instansi):P(''),P(meta.tgl),
    P(R.allOk?'STATUS: PATUH SEMUA KETENTUAN':'STATUS: MELANGGAR '+bad.map(c=>c.k).join(', '),{bold:true,color:R.allOk?'2E6B3F':'B3261E'}),
    H('Ringkasan'),P(`Persil ${nf(R.A)} m² di ${s.place} (${s.lat.toFixed(5)}, ${s.lng.toFixed(5)}); KDB ${s.kdb}%, KLB ${nf2(s.klb)}, KDH ${s.kdh}%, KBG ${s.kbg} lantai. Hasil: ${nf2(R.total)} lantai (±${nf(R.H,1)} m), KLB terpakai ${nf(R.klbUsed,2)}, tapak ${nf(R.footprint)} m², RTH ${nf(R.green)} m², ${R.treeCount} tanaman.`),
    H('1. Lokasi dan persil'),...IMG(imgs.lokasi,'Gambar 1. Lokasi persil.'),...IMG(imgs.persil,'Gambar 2. Geometri persil dari peta geotag.'),
    TB(['Parameter','Nilai'],[['Luas persil',nf(R.A)+' m²'],['Keliling',nf(per,1)+' m'],['Bentang',nf(bb.x1-bb.x0,1)+' × '+nf(bb.y1-bb.y0,1)+' m'],['Titik sudut',site.length]]),
    ...(s.poly?[H('Koordinat titik sudut (WGS84)',2),TB(['No.','Lintang','Bujur'],s.poly.map((p,i)=>[i+1,p[0].toFixed(6),p[1].toFixed(6)]))]:[]),
    H('2. Ketentuan intensitas'),TB(['Ketentuan','Nilai'],[['KDB',s.kdb+'%'],['KLB',nf2(s.klb)],['KDH',s.kdh+'%'],['KBG',s.kbg+' lantai'],['Batas tinggi',s.hmax?s.hmax+' m':'—']]),P('Sumber nilai: '+(s.ruleSrc||'diisi pengguna / contoh ilustratif'),{italics:true,size:18}),
    H('3. Perhitungan'),...stepsTxt.map((x,i)=>P(`${i+1}. ${x}`)),
    H('4. Kepatuhan'),TB(['Aspek','Hasil','Status'],R.C.map(c=>[c.k,c.m,c.warn?'catatan':c.ok?'patuh':'melanggar'])),...R.adv.map(a=>P('• '+a.replace(/<[^>]+>/g,''))),
    H('5. Visualisasi'),...IMG(imgs.d3,'Gambar 3. Model 3D massa bangunan.'),...IMG(imgs.eye,'Gambar 4. Pandangan setinggi mata.'),...IMG(imgs.denah,'Gambar 5. Denah tapak 2D.'),...IMG(imgs.potongan,'Gambar 6. Potongan terhadap KBG.'),
    H('6. RTH dan vegetasi'),P(`Area hijau ${nf(R.green)} m² (${nf(R.green/R.A*100,1)}% lahan).`),TB(['Jenis','Nama ilmiah','Jumlah','Tinggi × tajuk (m)'],Object.entries(TREES).filter(([k])=>s.spp.includes(k)).map(([k,T])=>[T.n,T.sci,by[k]||0,nf(T.H*s.grow/100,1)+' × '+nf(T.D*s.grow/100,1)])),
    ...(docs.length?[H('7. Dokumen pendukung'),...docs.flatMap(d=>[H(d.name,2),...(d.found.length?[TB(['Temuan','Nilai','Konteks'],d.found.slice(0,10).map(f=>[f.k.toUpperCase(),nf2(f.v),'…'+f.ctx+'…']))]:[P('Tidak ada temuan angka aturan.')])])]:[]),
    ...(meta.catatan?[H('Catatan'),P(meta.catatan)]:[]),
    H('Rujukan'),...refs.map((r,i)=>P(`[${i+1}] ${r.t} ${r.u||''}`,{size:18}))];
  const doc=new Document({creator:meta.penyusun||'Lensa Intensitas',title:meta.judul,styles:{default:{document:{run:{font:'Calibri',size:22}}}},sections:[{children:ch}]});
  const blob=await Packer.toBlob(doc); saveFile(slug()+'.docx',blob);
};
