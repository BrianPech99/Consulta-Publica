const express = require("express");
const pool = require("../conexion");

const router = express.Router();

// GET /api/publicaciones?herramienta=agenda&q=texto&estatus=vigente
router.get("/", async (req, res) => {
  const { herramienta, q, estatus } = req.query;
  if (!herramienta) return res.status(400).json({ error: "Parámetro 'herramienta' requerido." });

  try {
    let where = ["h.clave = ?"];
    let params = [herramienta];
    if (q) { where.push("(p.titulo LIKE ? OR p.sujeto LIKE ?)"); params.push(`%${q}%`, `%${q}%`); }
    if (estatus) { where.push("ep.clave = ?"); params.push(estatus); }

    const [rows] = await pool.query(
      `SELECT p.id_publicacion, p.titulo, p.sujeto, p.fecha_publicacion,
              p.doc_url, ep.clave AS estatus, ep.etiqueta AS estatus_etiqueta
       FROM publicaciones p
       JOIN herramientas h ON h.id_herramienta = p.id_herramienta
       JOIN estatus_publicacion ep ON ep.id_estatus = p.id_estatus
       WHERE ${where.join(" AND ")}
       ORDER BY p.fecha_publicacion DESC`,
      params
    );
    res.json({ rows });
  } catch (err) {
    console.error("[publicaciones/GET]", err);
    res.status(500).json({ error: "Error al obtener publicaciones." });
  }
});

module.exports = router;
