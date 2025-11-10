import express from "express";
import { pool } from "../config/DB.js";
import {
  getExcursiones,
  getExcursionById,
  createExcursion,
  updateExcursion,
  deleteExcursion,
  getMultimediaByExcursion,
  createMultimedia,
  deleteMultimedia,
  getFechasByExcursion,
  getExcursionesConFechas,
  createFechaExcursion,
  updateFechaExcursion,
  deleteFechaExcursion,
  getGuias,
  getExcursionesPorGuia,
  getParticipantesByExcursion,
  getFechaById,
} from "../controllers/excursiones.controller.js";

const router = express.Router();

// =============================
// Rutas de Excursiones
// =============================

// 🔹 Rutas específicas primero
router.get("/guias", getGuias);

// ✅ Esta ruta debe ir antes que cualquier "/:id"
router.get("/:id/participantes", getParticipantesByExcursion);
router.get("/con-fechas", getExcursionesConFechas);
router.get("/fechas/:id", getFechaById);


// 🔹 Rutas dinámicas
router.get("/", getExcursiones);
router.post("/", createExcursion);
router.put("/:id", updateExcursion);
router.delete("/:id", deleteExcursion);
router.get("/:id", getExcursionById);
router.get("/guia/:id_guia", getExcursionesPorGuia);

// =============================
// MULTIMEDIA
// =============================
router.get("/:id_excursion/multimedia", getMultimediaByExcursion);
router.post("/multimedia", createMultimedia);
router.delete("/multimedia/:id", deleteMultimedia);

// =============================
// Fechas de Excursión
// =============================
router.get("/:id_excursion/fechas", getFechasByExcursion);
router.post("/fechas-excursion", createFechaExcursion);
router.put("/fechas/:id", updateFechaExcursion);
router.delete("/fechas/:id", deleteFechaExcursion);

// =============================
// Obtener info de una fecha (para control de cupos)
// =============================
router.get("/fecha/:id_fecha", async (req, res) => {
  const { id_fecha } = req.params;

  try {
    const [rows] = await pool.promise().query(
      `SELECT id_fecha, cupo_maximo, cupo_disponible, precio, estado
       FROM FechasExcursion
       WHERE id_fecha = ?`,
      [id_fecha]
    );

    if (rows.length === 0)
      return res.status(404).json({ message: "Fecha no encontrada" });

    res.json(rows[0]);
  } catch (err) {
    console.error("❌ Error al obtener datos de la fecha:", err);
    res.status(500).json({ message: "Error interno al obtener datos de la fecha" });
  }
});


export default router;