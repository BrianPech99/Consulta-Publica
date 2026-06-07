import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDX4VW0Wyse7umyVfpPaU5m4ckIqYUGEBo",
  authDomain: "imdai-consulta.firebaseapp.com",
  projectId: "imdai-consulta",
  storageBucket: "imdai-consulta.appspot.com",
  messagingSenderId: "563693410755",
  appId: "1:563693410755:web:e50bf1c58828b442668576"
};

const $ = (s)=>document.querySelector(s);
const log = (m)=>{ const el=$('#log'); el.textContent += `\n${new Date().toLocaleTimeString()} — ${m}`; el.scrollTop=el.scrollHeight; console.log(m); };

let app, auth, db, storage;
try{ app = initializeApp(firebaseConfig); $('#sdk-app').textContent='OK'; }catch(e){ $('#sdk-app').textContent='ERROR'; log('init error: '+(e?.message||e)); }
try{ auth = getAuth(app); $('#sdk-auth').textContent='OK'; }catch(e){ $('#sdk-auth').textContent='ERROR'; log('auth error: '+(e?.message||e)); }
try{ db = getFirestore(app); $('#sdk-db').textContent='OK'; }catch(e){ $('#sdk-db').textContent='ERROR'; log('db error: '+(e?.message||e)); }
try{ storage = getStorage(app); $('#sdk-st').textContent='OK'; }catch(e){ $('#sdk-st').textContent='ERROR'; log('st error: '+(e?.message||e)); }

onAuthStateChanged(auth, (user)=>{
  if(user){ $('#auth-state').textContent='Estado: autenticado'; $('#who').textContent=`${user.email} — UID: ${user.uid}`; log('Autenticado '+(user.email||user.uid)); }
  else{ $('#auth-state').textContent='Estado: sin sesión'; $('#who').textContent='—'; log('Sin sesión'); }
});

$('#btn-register').addEventListener('click', async()=>{
  const email=$('#email').value.trim(); const pass=$('#pass').value.trim();
  try{ await createUserWithEmailAndPassword(auth, email, pass); log('Cuenta creada: '+email); }
  catch(e){ log('Error registro: '+(e?.message||e)); alert('Error registro: '+(e?.message||e)); }
});
$('#btn-login').addEventListener('click', async()=>{
  const email=$('#email').value.trim(); const pass=$('#pass').value.trim();
  try{ await signInWithEmailAndPassword(auth, email, pass); log('Login OK: '+email); }
  catch(e){ log('Error login: '+(e?.message||e)); alert('Error login: '+(e?.message||e)); }
});
$('#btn-logout').addEventListener('click', async()=>{ try{ await signOut(auth); log('Logout OK'); }catch(e){ log('Error logout: '+(e?.message||e)); } });

$('#btn-write').addEventListener('click', async()=>{
  const user = auth.currentUser; if(!user){ alert('Inicia sesión primero.'); return; }
  try{
    const ref = await addDoc(collection(db,'opiniones'), {
      uid:user.uid, email:user.email||null, nombre:'(Prueba)', telefono:'',
      tema:($('#test-tema').value.trim()||'Prueba'), comentario:($('#test-comentario').value.trim()||'Comentario de prueba'),
      archivoURL:null, createdAt: serverTimestamp(), estado:'recibida'
    }); $('#write-result').textContent='Documento creado con ID: '+ref.id; log('Write OK id '+ref.id);
  }catch(e){ log('Error write: '+(e?.message||e)); alert('Error write: '+(e?.message||e)); }
});
