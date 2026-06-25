// app.js — Autenticación ciudadana y envío de opiniones (sin Firebase)
(function () {
  const API = "http://localhost:3000/api";
  const $ = (s) => document.querySelector(s);

  // --- Estado de sesión ---
  function getToken() { return localStorage.getItem("imdai_token"); }
  function getEmail() { return localStorage.getItem("imdai_email"); }
  function saveSession(token, email) {
    localStorage.setItem("imdai_token", token);
    localStorage.setItem("imdai_email", email);
  }
  function clearSession() {
    localStorage.removeItem("imdai_token");
    localStorage.removeItem("imdai_email");
  }

  function updateUI() {
    const signed = !!getToken();
    $("#account-signed-out")?.classList.toggle("hidden", signed);
    $("#account-signed-in")?.classList.toggle("hidden", !signed);
    $("#form-locked")?.classList.toggle("hidden", signed);
    $("#opinion-form")?.classList.toggle("hidden", !signed);
    $("#sent-ok")?.classList.add("hidden");
    $("#sent-error")?.classList.add("hidden");
    if (signed) {
      const emailEl = $("#user-email");
      if (emailEl) emailEl.textContent = getEmail() || "";
    }
  }

  // --- Mostrar/ocultar paneles de auth ---
  document.querySelectorAll("#btn-open-login").forEach((b) =>
    b.addEventListener("click", () => {
      $("#form-register")?.classList.add("hidden");
      $("#form-login")?.classList.remove("hidden");
    })
  );
  document.querySelectorAll("#btn-open-register").forEach((b) =>
    b.addEventListener("click", () => {
      $("#form-login")?.classList.add("hidden");
      $("#form-register")?.classList.remove("hidden");
    })
  );

  // --- Registro ---
  $("#form-register")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = $("#reg-email").value.trim();
    const pass = $("#reg-pass").value.trim();
    try {
      const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Error al registrar."); return; }
      saveSession(data.token, data.email);
      updateUI();
    } catch (err) {
      alert("Error de red al registrar.");
    }
  });

  // --- Login ---
  $("#form-login")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = $("#login-email").value.trim();
    const pass = $("#login-pass").value.trim();
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Error al iniciar sesión."); return; }
      saveSession(data.token, data.email);
      updateUI();
    } catch (err) {
      alert("Error de red al iniciar sesión.");
    }
  });

  // --- Logout ---
  $("#btn-logout")?.addEventListener("click", () => {
    clearSession();
    updateUI();
  });

  // --- Envío de opinión ---
  $("#opinion-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const token = getToken();
    if (!token) { alert("Inicia sesión primero."); return; }

    const statusEl = $("#status");
    if (statusEl) statusEl.textContent = "Enviando…";
    $("#sent-ok")?.classList.add("hidden");
    $("#sent-error")?.classList.add("hidden");

    const file = $("#archivo")?.files[0];
    if (file && file.size > 10 * 1024 * 1024) {
      if (statusEl) statusEl.textContent = "";
      alert("El archivo excede 10 MB.");
      return;
    }

    // Leer id_publicacion de la URL si viene en ?pub=X
    const urlParams = new URLSearchParams(window.location.search);
    const idPub = urlParams.get("pub") || "";

    const fd = new FormData();
    fd.append("nombre", $("#nombre").value.trim());
    fd.append("telefono", $("#telefono").value.trim());
    fd.append("grupo", document.querySelector('input[name="grupo"]:checked')?.value || "");
    fd.append("edad", document.querySelector('input[name="edad"]:checked')?.value || "");
    fd.append("dependencia", $("#dependencia").value);
    fd.append("opinion", $("#opinion").value.trim());
    if (idPub) fd.append("id_publicacion", idPub);
    if (file) fd.append("archivo", file);

    try {
      const res = await fetch(`${API}/opiniones`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (statusEl) statusEl.textContent = "";
      if (res.ok) {
        $("#opinion-form").reset();
        $("#sent-ok")?.classList.remove("hidden");
      } else {
        alert(data.error || "Error al enviar.");
        $("#sent-error")?.classList.remove("hidden");
      }
    } catch (err) {
      if (statusEl) statusEl.textContent = "";
      $("#sent-error")?.classList.remove("hidden");
    }
  });

  // Inicializar UI al cargar
  updateUI();
})();
