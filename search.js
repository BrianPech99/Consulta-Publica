// Client-side search across site pages
const PAGES=[
  {url:'index.html',title:'Inicio — IMDAI'},
  {url:'nosotros.html',title:'Nosotros — IMDAI'},
  {url:'mejora-regulatoria.html',title:'Mejora Regulatoria — IMDAI'},
  {url:'consulta-publica.html',title:'Consulta Pública — IMDAI'},
  {url:'dai.html',title:'Desarrollo Administrativo e Innovación — IMDAI'},
  {url:'ventanillaunica.html',title:'Ventanilla Única — IMDAI'},
  {url:'armonizacion-contable.html',title:'Armonización contable — IMDAI'},
  {url:'contacto.html',title:'Contáctenos — IMDAI'},
];
function normalize(s){return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();}
function stripHTML(h){return h.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();}
const cache=new Map();
async function getPageText(u){if(cache.has(u))return cache.get(u);const r=await fetch(u,{cache:'no-store'});const t=stripHTML(await r.text());cache.set(u,t);return t;}
function score(t,q){const tt=normalize(t);let s=0;q.forEach(w=>{const m=tt.match(new RegExp(`\\b${w}\\b`,'g'));s+=m?m.length:0;});return s;}
function snippet(text,q){const tt=normalize(text),qs=normalize(q).split(' ')[0];const i=Math.max(0,tt.indexOf(qs));const st=Math.max(0,i-80),en=Math.min(text.length,st+200);let sn=text.slice(st,en);normalize(q).split(' ').filter(Boolean).forEach(w=>{sn=sn.replace(new RegExp(`(${w})`,'ig'),'<mark>$1</mark>')});return (st>0?'…':'')+sn+(en<text.length?'…':'');}
async function searchSite(q){const Q=normalize(q);if(!Q)return[];const toks=Q.split(' ').filter(Boolean);const cor=await Promise.all(PAGES.map(async p=>{try{const t=await getPageText(p.url);return {...p,text:t,s:score(t,toks)};}catch(e){return {...p,text:'',s:0};}}));return cor.filter(r=>r.s>0).sort((a,b)=>b.s-a.s).slice(0,20).map(r=>({url:r.url,title:r.title,snippet:snippet(r.text,q)}));}
function overlay(){const o=document.createElement('div');o.className='search-overlay';o.innerHTML=`<div class="search-panel" role="dialog" aria-modal="true" aria-label="Buscar en el sitio"><div class="search-head"><input class="search-input" type="search" placeholder="Buscar trámites, secciones, temas…" autofocus /><button class="search-close" aria-label="Cerrar">✕</button></div><div class="search-body"><ul class="search-results"></ul></div></div>`;document.body.appendChild(o);return o;}
const ov=overlay(),input=ov.querySelector('.search-input'),closeBtn=ov.querySelector('.search-close'),list=ov.querySelector('.search-results');
function openS(){ov.style.display='block';input.focus();}function closeS(){ov.style.display='none';}
document.addEventListener('click',e=>{const btn=e.target.closest('.search-btn');if(btn){e.preventDefault();openS();}});
closeBtn.addEventListener('click',closeS);
ov.addEventListener('click',e=>{if(e.target===ov)closeS();});
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openS();}if(e.key==='Escape')closeS();});
let t;input.addEventListener('input',()=>{clearTimeout(t);t=setTimeout(async()=>{const q=input.value.trim();list.innerHTML=q?'<li style="padding:12px 16px;color:#29464f;">Buscando…</li>':'';if(!q)return;const hits=await searchSite(q);list.innerHTML=hits.length?hits.map(h=>`<li><a href="${h.url}">${h.title}</a><p>${h.snippet}</p></li>`).join(''):'<li style="padding:12px 16px;color:#29464f;">Sin resultados.</li>';},220)});
