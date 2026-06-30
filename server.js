const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

// Servir archivos estáticos del frontend
app.use(express.static(__dirname));

// Servir archivos subidos (PDFs)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Rutas de la API
app.use("/api/auth", require("./api/auth"));
app.use("/api/opiniones", require("./api/opiniones"));
app.use("/api/publicaciones", require("./api/publicaciones"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor IMDAI corriendo en http://localhost:${PORT}`);
});
