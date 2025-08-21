// src/routes/sorteos.ts
import { Router } from "express";
import sqlite3 from "sqlite3";
import path from "path";

const router = Router();

const dbPath = path.resolve(__dirname, "../../quini6.db");
const db = new sqlite3.Database(dbPath);

router.get("/ultimos", (req, res) => {
  db.all(
    "SELECT * FROM sorteos ORDER BY sorteoNro DESC LIMIT 10",
    [],
    (err, rows) => {
      if (err) {
        console.error("Error consultando la base de datos:", err);
        return res.status(500).json({ error: "Error en el servidor" });
      }
      res.json(rows);
    }
  );
});

export default router;
