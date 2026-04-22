const KV_BASE='https://red-resonance-d4ba.bnbcasamoresca.workers.dev',KV_KEY='rcm_pn26';
const CATS={
  entrata:[{id:'incassi',icon:'💰',name:'Incassi',sub:null}],
  uscita:[
    {id:'personale',   icon:'👤',name:'Personale',              sub:['Joele','Mauro','Livia']},
    {id:'produzione',  icon:'🔧',name:'Produzione',             sub:['Commissioni OTA/Stripe/Ced.','Biancheria','Dotazioni ospiti']},
    {id:'manutenzione',icon:'🔨',name:'Manutenzione e Migliorie',sub:['Decor e migliorie','Manutenzione']},
    {id:'diffusione',  icon:'📣',name:'Diffusione',             sub:['Pubblicità online','Sito/Dominio/Channel Mgr']},
    {id:'spese-fisse', icon:'🏠',name:'Spese fisse',            sub:['Condominio','Giardino','Spiaggia','Utenze']},
  ]
};
const CSV_COLS=['Data','Fornitore','Bene acquistato','Joele','Mauro','Livia','Incassi','Commissioni OTA - Stripe - Cedolare','Biancheria','Dotazioni ospiti','Decor e migliorie','Manutenzione','Diffusione e pubblicità online','Sito - Dominio - Channel Manager','Condominio','Giardino','Spiaggia','Utenze'];
const S2C={'Joele':'Joele','Mauro':'Mauro','Livia':'Livia','Commissioni OTA/Stripe/Ced.':'Commissioni OTA - Stripe - Cedolare','Biancheria':'Biancheria','Dotazioni ospiti':'Dotazioni ospiti','Decor e migliorie':'Decor e migliorie','Manutenzione':'Manutenzione','Pubblicità online':'Diffusione e pubblicità online','Sito/Dominio/Channel Mgr':'Sito - Dominio - Channel Manager','Condominio':'Condominio','Giardino':'Giardino','Spiaggia':'Spiaggia','Utenze':'Utenze','Incassi':'Incassi'};

const lPN=()=>{try{return JSON.parse(localStorage.getItem(KV_KEY)||'[]')}catch{return[]}};
const sPN=d=>localStorage.setItem(KV_KEY,JSON.stringify(d));
let entries=lPN(),tipo='uscita',selCat=null,selSub=null,editId=null,detId=null;

function mergeEntries(local,remote){
  const m=new Map();
  (local||[]).forEach(e=>m.set(e.id,e));
  (remote||[]).forEach(e=>m.set(e.id,e));
  return Array.from(m.values()).sort((a,b)=>b.data.localeCompare(a.data)||b.id.localeCompare(a.id));
}
async function kvLoad(){
  try{
    const r=await fetch(`${KV_BASE}/load?key=${KV_KEY}`);if(!r.ok)return;
    let d;try{d=JSON.parse(await r.text())}catch{d=[];}
    if(!Array.isArray(d))d=[];
    const merged=mergeEntries(entries,d);
    entries=merged;sPN(entries);
    if(merged.length>d.length)await kvSave();
    setSyncBar('✓ Sincronizzato · '+new Date().toLocaleTimeString('it'));
  }catch{setSyncBar('⚠️ Offline — dati locali')}
}
async function kvSave(){
  try{await fetch(`${KV_BASE}/save`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:KV_KEY,data:entries})});}catch{}
}

const fmt=n=>new Intl.NumberFormat('it-IT',{minimumFractionDigits:2,maximumFractionDigits:2}).format(n);
const MESI=['gen','feb','mar','apr','mag','giu','lug','ago','set','ott','nov','dic'];
const fmtD=s=>{if(!s)return'';const[y,m,d]=s.split('-');return`${+d} ${MESI[+m-1]} ${y}`;};
const todayS=()=>new Date().toISOString().slice(0,10);
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2);
const getCat=(t,id)=>(CATS[t]||[]).find(c=>c.id===id);
const catIcon=(t,id)=>{const c=getCat(t,id);return c?c.icon:'📦';};
const catName=(t,id)=>{const c=getCat(t,id);return c?c.name:id;};
const setSyncBar=m=>document.getElementById('sync-bar').textContent=m;
async function forcSync(){setSyncBar('↻ Sincronizzazione…');await kvLoad();renderHome();}

function showScr(id){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));document.getElementById(id).classList.add('active');}

function renderHome(){
  let ent=0,usc=0;entries.forEach(e=>e.tipo==='entrata'?ent+=e.importo:usc+=e.importo);
  const sal=ent-usc;
  document.getElementById('bal-ent').textContent='€ '+fmt(ent);
  document.getElementById('bal-usc').textContent='€ '+fmt(usc);
  const se=document.getElementById('bal-sal');
  se.textContent='€ '+fmt(sal);se.style.color=sal>=0?'var(--olive)':'var(--red)';
  document.getElementById('forn-list').innerHTML=[...new Set(entries.map(e=>e.forn).filter(Boolean))].map(f=>`<option value="${f}">`).join('');
  const byDate={};
  [...entries].sort((a,b)=>b.data.localeCompare(a.data)).forEach(e=>{(byDate[e.data]||(byDate[e.data]=[])).push(e);});
  const list=document.getElementById('entries-list');
  if(!entries.length){list.innerHTML='<div class="empty"><div class="empty-icon">📒</div><p>Nessuna voce ancora.<br>Tocca <strong>＋</strong> per iniziare.</p></div>';return;}
  let html='';
  Object.entries(byDate).forEach(([date,items])=>{
    html+=`<div class="mo-lbl">${date===todayS()?'Oggi · ':''}${fmtD(date)}</div>`;
    items.forEach(e=>{
      const[,m,d]=e.data.split('-');
      const calCls=e.tipo==='entrata'?'ent':'usc';
      const amtColor=e.tipo==='entrata'?'var(--olive)':'var(--red)';
      const sign=e.tipo==='entrata'?'+':'-';
      const pillCls=e.tipo==='entrata'?'pill-d':'pill-r';
      html+=`<div class="bk" onclick="openDetail('${e.id}')">
        <div class="bk-row">
          <div class="bk-cal ${calCls}"><div class="dy">${+d}</div><div class="mo">${MESI[+m-1]}</div></div>
          <div class="bk-inf">
            <div class="bk-name">${e.forn||e.desc||'—'}</div>
            ${e.desc&&e.forn?`<div class="bk-sub">${e.desc}</div>`:''}
          </div>
          <div class="bk-amt" style="color:${amtColor}">${sign}€ ${fmt(e.importo)}</div>
        </div>
        <div class="bk-foot">
          <span class="pill ${pillCls}">${catIcon(e.tipo,e.cat)} ${catName(e.tipo,e.cat)}</span>
          ${e.sub?`<span class="pill pill-p">${e.sub}</span>`:''}
        </div>
      </div>`;
    });
  });
  list.innerHTML=html;
}

function openForm(id){
  editId=id;selCat=null;selSub=null;
  if(id){
    const e=entries.find(x=>x.id===id);if(!e)return;
    document.getElementById('form-title').textContent='Modifica voce';
    document.getElementById('f-imp').value=e.importo;document.getElementById('f-data').value=e.data;
    document.getElementById('f-forn').value=e.forn||'';document.getElementById('f-desc').value=e.desc||'';
    selCat=e.cat;selSub=e.sub||null;setTipo(e.tipo,true);
  }else{
    document.getElementById('form-title').textContent='Nuova voce';
    document.getElementById('f-imp').value='';document.getElementById('f-data').value=todayS();
    document.getElementById('f-forn').value='';document.getElementById('f-desc').value='';
    setTipo('uscita',true);
  }
  showScr('screen-form');setTimeout(()=>document.getElementById('f-imp').focus(),300);
}

function setTipo(t,skipReset){
  tipo=t;
  document.getElementById('btn-ent').className='sbtn'+(t==='entrata'?' a-ent':'');
  document.getElementById('btn-usc').className='sbtn'+(t==='uscita'?' a-usc':'');
  document.getElementById('lbl-forn').textContent=t==='entrata'?'Fonte / Cliente':'Fornitore';
  const bs=document.getElementById('btn-save');
  bs.className='btn '+(t==='entrata'?'btn-olive':'btn-danger');
  if(t==='uscita')bs.style.cssText='box-shadow:0 4px 14px rgba(176,48,48,.25)';else bs.style.cssText='';
  if(!skipReset){selCat=null;selSub=null;}
  renderCats();
}

function renderCats(){
  const cats=CATS[tipo]||[];
  const isEnt=tipo==='entrata';
  const selColor=isEnt?'var(--olive)':'var(--red)';
  const selBg=isEnt?'var(--olive-lt)':'var(--red-lt)';
  const totByCat={};
  entries.forEach(e=>{if(e.tipo===tipo&&e.cat)totByCat[e.cat]=(totByCat[e.cat]||0)+e.importo;});
  let html='';
  for(let i=0;i<cats.length;i++){
    const c=cats[i];
    const isSel=c.id===selCat;
    const tot=totByCat[c.id]||0;
    html+=`<div class="tile tile-sm" style="cursor:pointer;border-top:4px solid ${isSel?selColor:'var(--border)'};background:${isSel?selBg:'var(--white)'}" onclick="pickCat('${c.id}')">
      <div class="tile-icon">${c.icon}</div>
      <div class="tile-label" style="${isSel?`color:${selColor}`:''}">${c.name}</div>
      <div class="tile-sub" style="color:${isSel?selColor:(tot>0?'var(--arch)':'var(--muted)')}">${tot>0?'€ '+fmt(tot):'—'}</div>
    </div>`;
    if(i%2===1||i===cats.length-1){
      const pairStart=Math.floor(i/2)*2;
      const sel=cats.slice(pairStart,i+1).find(c=>c.id===selCat);
      if(sel&&sel.sub){
        html+=`<div style="grid-column:1/-1;display:flex;gap:8px;flex-wrap:wrap;padding:4px 2px 6px">
          ${sel.sub.map(s=>{const on=s===selSub;return`<span class="season-pill" style="cursor:pointer;${on?`background:${selBg};border-color:${selColor};color:${selColor}`:''}" onclick="event.stopPropagation();pickSub('${s}')">${s}</span>`;}).join('')}
        </div>`;
      }
    }
  }
  document.getElementById('cat-grid').innerHTML=html;
}
function pickCat(id){selCat=id;selSub=null;renderCats();}
function pickSub(s){selSub=s;renderCats();}

function saveEntry(){
  const importo=parseFloat(document.getElementById('f-imp').value);
  const data=document.getElementById('f-data').value;
  const forn=document.getElementById('f-forn').value.trim();
  const desc=document.getElementById('f-desc').value.trim();
  if(!importo||importo<=0){alert('Inserisci un importo valido.');return;}
  if(!data){alert('Inserisci la data.');return;}
  if(!selCat){alert('Seleziona una categoria.');return;}
  const cat=getCat(tipo,selCat);
  if(cat&&cat.sub&&!selSub){alert('Seleziona la sottocategoria.');return;}
  const entry={id:editId||uid(),importo,data,forn,desc,tipo,cat:selCat,sub:selSub};
  if(editId){const i=entries.findIndex(e=>e.id===editId);if(i>=0)entries[i]=entry;else entries.push(entry);}
  else entries.push(entry);
  sPN(entries);kvSave();showScr('screen-home');renderHome();
}

function openDetail(id){
  detId=id;const e=entries.find(x=>x.id===id);if(!e)return;
  document.getElementById('detail-ttl').textContent=catIcon(e.tipo,e.cat)+' '+(e.forn||e.desc||'Voce');
  document.getElementById('detail-rows').innerHTML=[
    ['Data',fmtD(e.data)],['Tipo',e.tipo==='entrata'?'↑ Entrata':'↓ Uscita'],
    ['Categoria',catName(e.tipo,e.cat)+(e.sub?` · ${e.sub}`:'')],
    e.forn?['Fornitore',e.forn]:null,e.desc?['Descrizione',e.desc]:null,
    ['Importo',(e.tipo==='entrata'?'+ ':'– ')+'€ '+fmt(e.importo)],
  ].filter(Boolean).map(([l,v])=>`<div class="sr"><span>${l}</span><strong>${v}</strong></div>`).join('');
  document.getElementById('detail-overlay').classList.add('open');
}
function overlayTap(e){if(e.target===document.getElementById('detail-overlay'))closeDetail();}
function closeDetail(){document.getElementById('detail-overlay').classList.remove('open');}
function editFromDetail(){closeDetail();setTimeout(()=>openForm(detId),200);}
function deleteEntry(){
  if(!confirm('Eliminare questa voce?'))return;
  entries=entries.filter(e=>e.id!==detId);sPN(entries);kvSave();closeDetail();renderHome();
}

function renderDash(){
  let totEnt=0,totUsc=0;const byCat={},bySub={};
  entries.forEach(e=>{
    if(e.tipo==='entrata')totEnt+=e.importo;
    else{totUsc+=e.importo;byCat[e.cat]=(byCat[e.cat]||0)+e.importo;}
    if(e.cat==='personale'&&e.sub)bySub[e.sub]=(bySub[e.sub]||0)+e.importo;
  });
  const sal=totEnt-totUsc;
  let html=`<div class="dash-kpi-grid">
    <div class="kpi full ${sal>=0?'green':'red'}"><div class="kpi-label">Saldo netto</div><div class="kpi-value">€ ${fmt(sal)}</div></div>
    <div class="kpi green"><div class="kpi-label">↑ Entrate</div><div class="kpi-value">€ ${fmt(totEnt)}</div></div>
    <div class="kpi red"><div class="kpi-label">↓ Uscite</div><div class="kpi-value">€ ${fmt(totUsc)}</div></div>
  </div>`;
  const catUsc=CATS.uscita.filter(c=>byCat[c.id]);
  if(catUsc.length){
    html+=`<div class="dash-section">Uscite per categoria</div><div class="dash-kpi-grid">`;
    catUsc.forEach(c=>{html+=`<div class="kpi red"><div class="kpi-label">${c.icon} ${c.name}</div><div class="kpi-value">€ ${fmt(byCat[c.id])}</div></div>`;});
    html+='</div>';
  }
  if(Object.keys(bySub).length){
    html+=`<div class="dash-section">👤 Personale — dettaglio</div><div class="dash-kpi-grid">`;
    Object.entries(bySub).forEach(([s,v])=>{html+=`<div class="kpi red"><div class="kpi-label">${s}</div><div class="kpi-value">€ ${fmt(v)}</div></div>`;});
    html+='</div>';
  }
  html+=`<div style="margin-top:8px"><button class="btn btn-gold" onclick="exportCSV()">📥 Esporta CSV per Google Sheets</button></div>`;
  document.getElementById('dash-body').innerHTML=html;
}

function exportCSV(){
  const rows=[...entries].sort((a,b)=>a.data.localeCompare(b.data)).map(e=>{
    const row={};CSV_COLS.forEach(c=>row[c]='');
    row['Data']=e.data;row['Fornitore']=e.forn||'';row['Bene acquistato']=e.desc||'';
    const col=e.tipo==='entrata'?'Incassi':(e.sub?S2C[e.sub]:null);
    if(col&&row.hasOwnProperty(col))row[col]=(e.tipo==='uscita'?'-':'')+e.importo.toFixed(2).replace('.',',');
    return CSV_COLS.map(c=>row[c]);
  });
  const csv=[CSV_COLS,...rows].map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(';')).join('\r\n');
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'}));
  a.download=`prima-nota-${todayS()}.csv`;a.click();
}

renderHome();
document.getElementById('ldr').classList.remove('on');
kvLoad().then(()=>renderHome());
