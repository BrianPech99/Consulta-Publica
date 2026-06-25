const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: "127.0.0.1",
  user: "root",
  password: "",
  database: "imdai_consulta_publica",
  waitForConnections: true,
  connectionLimit: 10,
  timezone: "-05:00"
});

module.exports = pool;
