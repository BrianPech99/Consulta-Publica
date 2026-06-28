// admin.js — Panel de administración (sin Firebase)
(function () {
  const API = "http://localhost:3000/api";
  const $ = (s) => document.querySelector(s);

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

  function showPanel(panel) {
    $("#panel-login").classList.toggle("hidden", panel !== "login");
    $("#panel-admin").classList.toggle("hidden", panel !== "admin");
    $("#header-logout").classList.toggle("hidden", panel !== "admin");
  }

  // --- Login desde admin.html ---
  $("#form-login-admin")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = $("#admin-email").value.trim();
    const pass = $("#admin-pass").value.trim();
    const loginError = $("#login-error");
    loginError.classList.add("hidden");

    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass }),
      });
      const data = await res.json();
      if (!res.ok) {
        loginError.textContent = data.error || "Correo o contraseña incorrectos.";
        loginError.classList.remove("hidden");
        return;
      }
      saveSession(data.token, data.email);
      initAdmin();
    } catch {
      loginError.textContent = "Error de red. Verifica que el servidor esté corriendo.";
      loginError.classList.remove("hidden");
    }
  });

  // --- Logout ---
  $("#btn-logout")?.addEventListener("click", () => {
    clearSession();
    showPanel("login");
  });

  // --- Tabla de opiniones ---
  function esc(str) {
    return String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function fmtDate(str) {
    if (!str) return "";
    return new Date(str).toLocaleString("es-MX");
  }
  function rowHTML(r) {
    const pdf = r.archivo_url
      ? `<a href="${esc(r.archivo_url)}" target="_blank" rel="noopener">PDF</a>`
      : "";
    return `<tr>
      <td>${fmtDate(r.created_at)}</td>
      <td>${esc(r.nombre)}</td>
      <td>${esc(r.email)}</td>
      <td>${esc(r.grupo)}</td>
      <td>${esc(r.dependencia)}</td>
      <td>${esc(r.opinion)}</td>
      <td>${esc(r.telefono)}</td>
      <td>${pdf}</td>
      <td><span class="pill">${esc(r.estado)}</span></td>
    </tr>`;
  }

  let currentPage = 1;

  async function loadPage(page) {
    const token = getToken();
    if (!token) return;
    const tbody = $("#tbody");
    const meta = $("#meta");
    const limit = Number($("#limit")?.value || 25);
    const q = $("#q")?.value.trim() || "";

    tbody.innerHTML = `<tr><td colspan="9">Cargando…</td></tr>`;
    try {
      const params = new URLSearchParams({ page, limit });
      if (q) params.set("q", q);
      const res = await fetch(`${API}/opiniones?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401 || res.status === 403) {
        clearSession();
        showPanel("login");
        return;
      }
      const data = await res.json();
      if (!res.ok) { tbody.innerHTML = `<tr><td colspan="9">${esc(data.error)}</td></tr>`; return; }

      currentPage = data.page;
      const totalPages = Math.ceil(data.total / data.limit);

      tbody.innerHTML = data.rows.length
        ? data.rows.map(rowHTML).join("")
        : `<tr><td colspan="9">Sin resultados.</td></tr>`;

      if (meta) meta.textContent = `${data.total} total — página ${currentPage} de ${totalPages}`;
      $("#btn-prev").disabled = currentPage <= 1;
      $("#btn-next").disabled = currentPage >= totalPages;
    } catch {
      tbody.innerHTML = `<tr><td colspan="9">Error de red.</td></tr>`;
    }
  }

  function exportCSV() {
    const tbody = $("#tbody");
    const head = ["Fecha","Nombre","Correo","Grupo","Dependencia","Opinión","Teléfono","Archivo","Estado"];
    const rows = [...tbody.querySelectorAll("tr")].map((tr) =>
      [...tr.children].map((td) => td.textContent.trim())
    );
    const csv = [head, ...rows]
      .map((r) => r.map((v) => { const s = String(v).replace(/"/g,'""'); return /[",\n]/.test(s)?`"${s}"`:s; }).join(","))
      .join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `opiniones_${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  function initAdmin() {
    const email = getEmail();
    showPanel("admin");
    const whoEl = $("#who");
    if (whoEl) whoEl.textContent = email || "";
    loadPage(1);

    $("#btn-reload")?.addEventListener("click", () => loadPage(1));
    $("#btn-prev")?.addEventListener("click", () => { if (currentPage > 1) loadPage(currentPage - 1); });
    $("#btn-next")?.addEventListener("click", () => loadPage(currentPage + 1));
    $("#btn-export")?.addEventListener("click", exportCSV);
    $("#q")?.addEventListener("input", () => loadPage(1));
    $("#limit")?.addEventListener("change", () => loadPage(1));
  }

  // --- Inicializar ---
  if (getToken()) {
    initAdmin();
  } else {
    showPanel("login");
  }
})();
