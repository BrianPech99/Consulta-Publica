// publicaciones.js — Carga publicaciones desde API Node.js (sin Firebase)
(function () {
  const API = "/api";
  const $ = (s) => document.querySelector(s);

  function esc(str) {
    return String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function fmtFecha(str) {
    if (!str) return "";
    return new Date(str).toLocaleDateString("es-MX");
  }

  async function cargar(herramienta) {
    const tbody = $("#tbody");
    const meta = $("#meta");
    const q = $("#q")?.value.trim() || "";
    const estatus = $("#estatus")?.value || "";

    if (meta) meta.textContent = "0 resultados";
    if (tbody) tbody.innerHTML = '<tr><td colspan="6">Cargando…</td></tr>';

    try {
      const params = new URLSearchParams({ herramienta });
      if (q) params.set("q", q);
      if (estatus) params.set("estatus", estatus);

      const res = await fetch(`${API}/publicaciones?${params}`);
      const data = await res.json();

      if (!res.ok) {
        tbody.innerHTML = `<tr><td colspan="6" style="color:#a02222">Error: ${esc(data.error)}</td></tr>`;
        return;
      }

      const rows = data.rows || [];
      if (rows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6">Sin resultados.</td></tr>';
      } else {
        tbody.innerHTML = rows.map((r) => {
          const docLink = r.doc_url
            ? `<a href="${esc(r.doc_url)}" target="_blank" rel="noopener">Abrir</a>`
            : "—";
          const opinarLink = `<a class="btn" href="consulta-publica.html?pub=${r.id_publicacion}">Opinar</a>`;
          return `<tr>
            <td>${esc(fmtFecha(r.fecha_publicacion))}</td>
            <td>${esc(r.sujeto)}</td>
            <td>${esc(r.titulo)}</td>
            <td>${esc(r.estatus_etiqueta || r.estatus)}</td>
            <td>${docLink}</td>
            <td>${opinarLink}</td>
          </tr>`;
        }).join("");
      }
      if (meta) meta.textContent = `${rows.length} resultados`;
    } catch (err) {
      if (tbody) tbody.innerHTML = `<tr><td colspan="6" style="color:#a02222">Error de red: ${esc(err.message)}</td></tr>`;
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    const btn = $("#btn-recargar");
    const herramienta = btn?.dataset?.tool || "agenda";
    cargar(herramienta);
    btn?.addEventListener("click", () => cargar(herramienta));
    $("#q")?.addEventListener("input", () => cargar(herramienta));
    $("#estatus")?.addEventListener("change", () => cargar(herramienta));
  });
})();
