
const express = require("express");
const { Pool } = require("pg");

const app = express();
const port = 3000;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  connectionTimeoutMillis: 5000,
  max: 10
});

app.use(express.static("public"));

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/api/db-check", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT current_database() AS database, NOW() AS checked_at"
    );

    res.json({
      status: "connected",
      database: result.rows[0].database,
      checked_at: result.rows[0].checked_at
    });
  } catch (error) {
    console.error("Database check failed:", error.message);
    res.status(503).json({ status: "database_unavailable" });
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Learning platform listening on port ${port}`);
});
