// admin.js — Vista interna (lectura protegida)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { getFirestore, collection, query, orderBy, limit, startAfter, getDocs, Timestamp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDX4VW0Wyse7umyVfpPaU5m4ckIqYUGEBo",
  authDomain: "imdai-consulta.firebaseapp.com",
  projectId: "imdai-consulta",
  storageBucket: "imdai-consulta.appspot.com",
  messagingSenderId: "563693410755",
  appId: "1:563693410755:web:e50bf1c58828b442668576"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const $ = (s)=>document.querySelector(s);
const who = $("#who"), meta=$("#meta"), qInput=$("#q"), limitSel=$("#limit"), tbody=$("#tbody");
const noticeDenied=$("#notice-denied"), noticeAuth=$("#notice-auth");
const btnPrev=$("#btn-prev"), btnNext=$("#btn-next"), btnReload=$("#btn-reload"), btnExport=$("#btn-export"), btnLogout=$("#btn-logout");

const DOMAIN_OK = (email)=>/.*@cancun\.gob\.mx$/i.test(email);
// Whitelist con tu UID
const UID_ALLOWLIST = new Set(["SPim2jfIjfTDZEytGuR1l5bga6C3"]);

let pageSize = Number(limitSel.value);
let lastDoc = null; let firstDoc = null; let stack = [];

function fmtDate(ts){ if(!ts) return ""; const d=ts instanceof Timestamp? ts.toDate(): new Date(ts); return d.toLocaleString(); }
function rowHTML(doc){ const d=doc.data();
  return `<tr>
    <td>${fmtDate(d.createdAt)}</td>
    <td>${(d.nombre||"").replace(/</g,"&lt;")}</td>
    <td>${(d.email||"").replace(/</g,"&lt;")}</td>
    <td>${(d.tema||"").replace(/</g,"&lt;")}</td>
    <td>${(d.comentario||"").replace(/</g,"&lt;")}</td>
    <td>${(d.telefono||"").replace(/</g,"&lt;")}</td>
    <td>${d.archivoURL ? `<a href="${d.archivoURL}" target="_blank" rel="noopener">PDF</a>` : ""}</td>
    <td class="muted">${d.uid||""}</td>
  </tr>`;
}

async function loadPage(direction){
  tbody.innerHTML = `<tr><td colspan="8">Cargando…</td></tr>`;
  let baseQ = query(collection(db,"opiniones"), orderBy("createdAt","desc"), limit(pageSize));
  if(direction==="next" && lastDoc){
    baseQ = query(collection(db,"opiniones"), orderBy("createdAt","desc"), startAfter(lastDoc), limit(pageSize));
  }else if(direction==="prev" && stack.length>1){
    stack.pop(); const prevCursor = stack[stack.length-1];
    baseQ = query(collection(db,"opiniones"), orderBy("createdAt","desc"), startAfter(prevCursor), limit(pageSize));
  }
  const snap = await getDocs(baseQ); const docs = snap.docs;
  if(docs.length===0){ tbody.innerHTML = `<tr><td colspan="8">Sin resultados.</td></tr>`; meta.textContent="0 resultados"; return; }
  firstDoc = docs[0]; lastDoc = docs[docs.length-1]; if(direction!=="prev") stack.push(firstDoc);
  tbody.innerHTML = docs.map(rowHTML).join(""); meta.textContent = `${docs.length} resultados`;
}
btnReload.addEventListener("click", ()=>{ stack=[]; lastDoc=null; loadPage(); });
btnNext.addEventListener("click", ()=> loadPage("next"));
btnPrev.addEventListener("click", ()=> loadPage("prev"));
btnExport.addEventListener("click", ()=>{
  const rows=[...tbody.querySelectorAll("tr")].map(tr=>[...tr.children].map(td=>td.textContent));
  const head=["Fecha","Nombre","Correo","Tema","Comentario","Teléfono","Archivo","UID"];
  const csv=[head,...rows].map(r=>r.map(v=>{const s=String(v).replace(/"/g,'""');return /[",\n]/.test(s)?`"${s}"`:s;}).join(",")).join("\n");
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=`opiniones_${Date.now()}.csv`; a.click(); URL.revokeObjectURL(url);
});
btnLogout.addEventListener("click", ()=> signOut(auth));

onAuthStateChanged(auth, async (user)=>{
  if(!user){ who.textContent="(no autenticado)"; noticeAuth.classList.remove("hidden"); noticeDenied.classList.add("hidden"); tbody.innerHTML=""; return; }
  who.textContent = `${user.email} — UID: ${user.uid}`;
  const allowed = DOMAIN_OK(user.email||"") || UID_ALLOWLIST.has(user.uid);
  if(!allowed){ noticeDenied.classList.remove("hidden"); noticeAuth.classList.add("hidden"); tbody.innerHTML=""; return; }
  noticeDenied.classList.add("hidden"); noticeAuth.classList.add("hidden"); await loadPage();
});
