IMDAI — Sitio completo listo (Auth + Opinión + Admin + Buscador + Diagnóstico)

Qué incluye:
- Páginas del sitio (index, nosotros, mejora-regulatoria, consulta-publica, etc.)
- Buscador (Ctrl/Cmd + K) — search.js
- Autenticación + envío de opiniones con PDF (consulta-publica.html + app.js)
- Panel admin protegido (admin.html + admin.js) — whitelist con tu UID
- Diagnóstico para probar Auth/Firestore (diagnostico.html + app_debug.js)
- Reglas: firestore.rules.txt y storage.rules.txt (pégalos en Firebase Console)

PASOS RÁPIDOS
1) Firebase Console: habilita Authentication (Email/Password), Firestore (Production), Storage.
2) (Opcional pero recomendado para Storage) Activa plan Blaze.
3) En Firestore → Rules pega firestore.rules.txt (incluye tu UID whitelisted).
4) En Storage → Rules pega storage.rules.txt.
5) Sube todos los archivos del ZIP a tu hosting (mantén carpeta 'imagenes/' existente).
6) Prueba:
   - consulta-publica.html → crea cuenta / login → envía opinión con/ sin PDF.
   - diagnostico.html → prueba login y escritura (verás IDs creados).
   - admin.html → debe mostrar opiniones si tu UID o correo institucional están autorizados.

Nota: El storageBucket ya está corregido a imdai-consulta.appspot.com.
