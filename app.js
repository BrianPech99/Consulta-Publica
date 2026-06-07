// app.js para encuesta idéntica al Google Form (CDN v12.3.0)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendEmailVerification } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-storage.js";

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
const storage = getStorage(app);

const $ = (s)=>document.querySelector(s);

// Auth UI
const accountOut=$("#account-signed-out"), accountIn=$("#account-signed-in"), userEmail=$("#user-email"), userUID=$("#user-uid");
const formRegister=$("#form-register"), formLogin=$("#form-login"), btnLogout=$("#btn-logout");
document.querySelectorAll("#btn-open-login")?.forEach(b=>b.addEventListener("click",()=>{ formRegister.classList.add("hidden"); formLogin.classList.remove("hidden"); }));
document.querySelectorAll("#btn-open-register")?.forEach(b=>b.addEventListener("click",()=>{ formLogin.classList.add("hidden"); formRegister.classList.remove("hidden"); }));
formRegister?.addEventListener("submit", async (e)=>{ e.preventDefault(); const email=$("#reg-email").value.trim(), pass=$("#reg-pass").value.trim(); try{ const cred=await createUserWithEmailAndPassword(auth,email,pass); try{ await sendEmailVerification(cred.user);}catch(_){}}catch(err){ alert("Error al registrar: "+(err?.message||err)); } });
formLogin?.addEventListener("submit", async (e)=>{ e.preventDefault(); const email=$("#login-email").value.trim(), pass=$("#login-pass").value.trim(); try{ await signInWithEmailAndPassword(auth,email,pass);}catch(err){ alert("Error al iniciar sesión: "+(err?.message||err)); } });
btnLogout?.addEventListener("click", ()=> signOut(auth));

const formLocked=$("#form-locked"), opinionForm=$("#opinion-form"), sentOK=$("#sent-ok"), sentError=$("#sent-error"), statusEl=$("#status");
onAuthStateChanged(auth, (user)=>{
  const signed=!!user;
  accountOut?.classList.toggle("hidden", signed);
  accountIn?.classList.toggle("hidden", !signed);
  formLocked?.classList.toggle("hidden", signed);
  opinionForm?.classList.toggle("hidden", !signed);
  sentOK?.classList.add("hidden"); sentError?.classList.add("hidden");
  if(signed){ userEmail && (userEmail.textContent=user.email||"(sin correo)"); userUID && (userUID.textContent=user.uid); }
});

// Envío (mapa 1:1 con preguntas del Form)
opinionForm?.addEventListener("submit", async (e)=>{
  e.preventDefault();
  statusEl && (statusEl.textContent="Enviando…"); sentOK?.classList.add("hidden"); sentError?.classList.add("hidden");
  const user=auth.currentUser; if(!user){ statusEl&&(statusEl.textContent=""); alert("Inicia sesión primero."); return; }

  const nombre=$("#nombre").value.trim();
  const telefono=$("#telefono").value.trim();
  const grupo=(document.querySelector('input[name="grupo"]:checked')?.value)||"";
  const edad=(document.querySelector('input[name="edad"]:checked')?.value)||"";
  const dependencia=$("#dependencia").value.trim();
  const opinion=$("#opinion").value.trim();
  const file=$("#archivo").files[0];

  try{
    let archivoURL=null;
    if(file){
      if(file.size>10*1024*1024) throw new Error("El archivo excede 10 MB");
      const r=ref(storage, `opiniones/${user.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(r, file);
      archivoURL = await getDownloadURL(r);
    }

    await addDoc(collection(db,"opiniones"), {
      uid:user.uid, email:user.email||null,
      nombre, telefono,
      grupo, edad, dependencia, opinion,
      archivoURL, createdAt: serverTimestamp(), estado:"recibida"
    });

    statusEl && (statusEl.textContent="");
    opinionForm.reset();
    sentOK?.classList.remove("hidden");
  }catch(err){
    console.error(err);
    statusEl && (statusEl.textContent="");
    sentError?.classList.remove("hidden");
  }
});
