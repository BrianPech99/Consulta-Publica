// admin.js — Panel de administración (sin Firebase)
(function () {
  const API = "http://localhost:3000/api";
  const $ = (s) => document.querySelector(s);

  function getToken() { return localStorage.getItem("imdai_token"); }
  function getEmail() { return localStorage.getItem("imdai_email"); }
  function clearSession() {
    localStorage.removeItem("imdai_token");
    localStorage.removeItem("imdai_email");
  }

  const whoEl = $("#who");
  const noticeDenied = $("#notice-denied");
  const noticeAuth = $("#notice-auth");
  const tbody = $("#tbody");
  const meta = $("#meta");
  const qInput = $("#q");
  const limitSel = $("#limit");
  const btnPrev = $("#btn-prev");
  const btnNext = $("#btn-next");
  const btnReload = $("#btn-reload");
  const btnExport = $("#btn-export");
  const btnLogout = $("#btn-logout");

  let currentPage = 1;
  let currentTotal = 0;

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

  async function loadPage(page) {
    const token = getToken();
    if (!token) return;
    const limit = Number(limitSel?.value || 25);
    const q = qInput?.value.trim() || "";
    tbody.innerHTML = `<tr><td colspan="9">Cargando…</td></tr>`;
    try {
      const params = new URLSearchParams({ page, limit });
      if (q) params.set("q", q);
      const res = await fetch(`${API}/opiniones?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401 || res.status === 403) {
        noticeDenied?.classList.remove("hidden");
        tbody.innerHTML = "";
        return;
      }
      const data = await res.json();
      if (!res.ok) { tbody.innerHTML = `<tr><td colspan="9">${esc(data.error)}</td></tr>`; return; }

      currentTotal = data.total;
      currentPage = data.page;
      const totalPages = Math.ceil(data.total / data.limit);

      if (data.rows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9">Sin resultados.</td></tr>`;
      } else {
        tbody.innerHTML = data.rows.map(rowHTML).join("");
      }
      if (meta) meta.textContent = `${data.total} total — página ${currentPage} de ${totalPages}`;
      if (btnPrev) btnPrev.disabled = currentPage <= 1;
      if (btnNext) btnNext.disabled = currentPage >= totalPages;
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="9">Error de red.</td></tr>`;
    }
  }

  function exportCSV() {
    const head = ["Fecha", "Nombre", "Correo", "Grupo", "Dependencia", "Opinión", "Teléfono", "Archivo", "Estado"];
    const rows = [...tbody.querySelectorAll("tr")].map((tr) =>
      [...tr.children].map((td) => td.textContent.trim())
    );
    const csv = [head, ...rows]
      .map((r) =>
        r.map((v) => { const s = String(v).replace(/"/g, '""'); return /[",\n]/.test(s) ? `"${s}"` : s; }).join(",")
      )
      .join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `opiniones_${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  btnReload?.addEventListener("click", () => loadPage(1));
  btnPrev?.addEventListener("click", () => { if (currentPage > 1) loadPage(currentPage - 1); });
  btnNext?.addEventListener("click", () => loadPage(currentPage + 1));
  btnExport?.addEventListener("click", exportCSV);
  qInput?.addEventListener("input", () => loadPage(1));
  limitSel?.addEventListener("change", () => loadPage(1));
  btnLogout?.addEventListener("click", () => { clearSession(); location.href = "consulta-publica.html"; });

  // Inicializar
  const token = getToken();
  const email = getEmail();
  if (!token) {
    noticeAuth?.classList.remove("hidden");
    noticeDenied?.classList.add("hidden");
    if (whoEl) whoEl.textContent = "(no autenticado)";
  } else {
    if (whoEl) whoEl.textContent = email || "";
    noticeAuth?.classList.add("hidden");
    noticeDenied?.classList.add("hidden");
    loadPage(1);
  }
})();
