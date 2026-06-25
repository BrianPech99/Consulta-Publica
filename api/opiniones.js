const express = require("express");
const multer = require("multer");
const path = require("path");
const jwt = require("jsonwebtoken");
const pool = require("../conexion");
const { JWT_SECRET } = require("./auth");

const router = express.Router();

// Multer: guarda PDFs en uploads/opiniones/
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "../uploads/opiniones")),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}_${Math.round(Math.random() * 1e6)}`;
    cb(null, `${unique}_${file.originalname}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Solo se permiten archivos PDF."));
  }
});

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "No autenticado." });
  const token = header.replace("Bearer ", "");
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Sesión expirada o inválida." });
  }
}

function adminMiddleware(req, res, next) {
  const DOMAIN_OK = /.*@cancun\.gob\.mx$/i.test(req.user?.email || "");
  const WHITELIST = new Set(["1"]);
  if (!DOMAIN_OK && !WHITELIST.has(String(req.user?.id))) {
    return res.status(403).json({ error: "Acceso denegado." });
  }
  next();
}

// POST /api/opiniones — ciudadano autenticado envía opinión
router.post("/", authMiddleware, upload.single("archivo"), async (req, res) => {
  const { nombre, telefono, grupo, edad, dependencia, opinion, id_publicacion } = req.body;
  if (!nombre || !grupo || !edad || !dependencia || !opinion) {
    return res.status(400).json({ error: "Faltan campos obligatorios." });
  }

  const archivoUrl = req.file ? `/uploads/opiniones/${req.file.filename}` : null;

  try {
    await pool.query(
      `INSERT INTO opiniones
        (id_usuario, id_publicacion, nombre, telefono, grupo, edad, dependencia, opinion, archivo_url, estado, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'recibida', NOW())`,
      [req.user.id, id_publicacion || null, nombre, telefono || null, grupo, edad, dependencia, opinion, archivoUrl]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error("[opiniones/POST]", err);
    res.status(500).json({ error: "Error al guardar la opinión." });
  }
});

// GET /api/opiniones — solo admin
router.get("/", authMiddleware, adminMiddleware, async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 25);
  const offset = (page - 1) * limit;
  const q = req.query.q ? `%${req.query.q}%` : null;
  const estado = req.query.estado || null;

  try {
    let where = [];
    let params = [];
    if (q) { where.push("(o.nombre LIKE ? OR o.opinion LIKE ? OR u.email LIKE ?)"); params.push(q, q, q); }
    if (estado) { where.push("o.estado = ?"); params.push(estado); }
    const whereSQL = where.length ? "WHERE " + where.join(" AND ") : "";

    const [rows] = await pool.query(
      `SELECT o.id_opinion, o.nombre, u.email, o.telefono, o.grupo, o.edad,
              o.dependencia, o.opinion, o.archivo_url, o.estado,
              o.created_at, o.id_publicacion
       FROM opiniones o
       LEFT JOIN usuarios u ON u.id_usuario = o.id_usuario
       ${whereSQL}
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM opiniones o LEFT JOIN usuarios u ON u.id_usuario = o.id_usuario ${whereSQL}`,
      params
    );

    res.json({ rows, total, page, limit });
  } catch (err) {
    console.error("[opiniones/GET]", err);
    res.status(500).json({ error: "Error al obtener opiniones." });
  }
});

module.exports = router;
