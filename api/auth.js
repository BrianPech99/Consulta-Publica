const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../conexion");

const router = express.Router();
const JWT_SECRET = "imdai_cancun_2025_secret";

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email y contraseña requeridos." });
  if (password.length < 6) return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres." });

  try {
    const [rows] = await pool.query("SELECT id_usuario FROM usuarios WHERE email = ?", [email]);
    if (rows.length > 0) return res.status(409).json({ error: "El correo ya está registrado." });

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO usuarios (email, password_hash, fecha_registro) VALUES (?, ?, NOW())",
      [email, hash]
    );
    const token = jwt.sign({ id: result.insertId, email }, JWT_SECRET, { expiresIn: "8h" });
    res.json({ token, email });
  } catch (err) {
    console.error("[auth/register]", err);
    res.status(500).json({ error: "Error al registrar usuario." });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email y contraseña requeridos." });

  try {
    const [rows] = await pool.query("SELECT * FROM usuarios WHERE email = ?", [email]);
    if (rows.length === 0) return res.status(401).json({ error: "Correo o contraseña incorrectos." });

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Correo o contraseña incorrectos." });

    const token = jwt.sign({ id: user.id_usuario, email: user.email }, JWT_SECRET, { expiresIn: "8h" });
    res.json({ token, email: user.email });
  } catch (err) {
    console.error("[auth/login]", err);
    res.status(500).json({ error: "Error al iniciar sesión." });
  }
});

module.exports = router;
module.exports.JWT_SECRET = JWT_SECRET;
