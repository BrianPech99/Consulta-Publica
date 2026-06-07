// publicaciones.js — fallback sin índice (ordena en cliente)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDX4VW0Wyse7umyVfpPaU5m4ckIqYUGEBo",
  authDomain: "imdai-consulta.firebaseapp.com",
  projectId: "imdai-consulta"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const $ = (s)=>document.querySelector(s);

function showError(msg){
  const tbody = $('#tbody');
  tbody.innerHTML = `<tr><td colspan="6" style="color:#a02222">Error: ${msg}</td></tr>`;
  console.error('[publicaciones]', msg);
}

async function cargar(tool){
  const qstr = $('#q').value.trim().toLowerCase();
  const est = $('#estatus').value;
  const tbody = $('#tbody');
  $('#meta').textContent = '0 resultados';
  tbody.innerHTML = '<tr><td colspan="6">Cargando…</td></tr>';

  try {
    const q = query(collection(db,'publicaciones'), where('herramienta','==', tool));
    const snap = await getDocs(q);

    let rows = [];
    snap.forEach(doc=> rows.push({ id: doc.id, ...doc.data() }));

    // filtros
    rows = rows.filter(r=>{
      const txt = `${r.titulo||''} ${r.sujeto||''} ${r.estatus||''}`.toLowerCase();
      const okQ = qstr ? txt.includes(qstr) : true;
      const okE = est ? (r.estatus===est) : true;
      return okQ && okE;
    });

    // ordenar por fecha desc (cliente)
    rows.sort((a,b)=>{
      const ta = a.fecha?.seconds ?? (a.fecha?.toDate?.()?.getTime?.() ?? 0)/1000 ?? 0;
      const tb = b.fecha?.seconds ?? (b.fecha?.toDate?.()?.getTime?.() ?? 0)/1000 ?? 0;
      return tb - ta;
    });

    if(!rows.length){
      tbody.innerHTML = '<tr><td colspan="6">Sin resultados.</td></tr>';
    }else{
      tbody.innerHTML = rows.map(r=>{
        const fecha = r.fecha?.toDate ? r.fecha.toDate().toLocaleDateString() : (r.fecha || '');
        const docURL = r.docURL ? `<a href="${r.docURL}" target="_blank" rel="noopener">Abrir</a>` : '—';
        return `<tr>
          <td>${fecha}</td>
          <td>${r.sujeto||''}</td>
          <td>${r.titulo||''}</td>
          <td>${r.estatus||''}</td>
          <td>${docURL}</td>
          <td><a class="btn" href="consulta-publica.html">Opinar</a></td>
        </tr>`;
      }).join('');
    }
    $('#meta').textContent = `${rows.length} resultados`;
  } catch(e){
    showError(e?.message || e);
  }
}

document.addEventListener('DOMContentLoaded', ()=>{
  const btn = document.querySelector('#btn-recargar');
  const tool = btn?.dataset?.tool || 'agenda';
  cargar(tool);
  btn?.addEventListener('click', ()=>cargar(tool));
  $('#q')?.addEventListener('input', ()=>cargar(tool));
  $('#estatus')?.addEventListener('change', ()=>cargar(tool));
});
