import express from "express";
import { pool } from "../config/DB.js";
import {
  getExcursiones, getExcursionById, createExcursion, updateExcursion, deleteExcursion, restoreExcursion,
  notificarGuia, getMultimediaByExcursion, createMultimedia, deleteMultimedia,
  getFechasByExcursion, getExcursionesConFechas, getTodasLasFechasPaginadas,
  restoreFechaExcursion, createFechaExcursion, updateFechaExcursion, deleteFechaExcursion,
  getGuias, getExcursionesPorGuia, getParticipantesByExcursion, getFechaById,
  updateCategoriasExcursionMultiple
} from "../controllers/excursiones.controller.js";

const router = express.Router();

// =============================
// 1. RUTAS DE APOYO Y ESTADÍSTICAS
// =============================
router.get("/guias", getGuias);
router.get("/con-fechas", getExcursionesConFechas);
router.get("/:id/participantes", getParticipantesByExcursion);
router.post("/notificar/:id_excursion", notificarGuia);

// =============================
// 2. RUTAS DE FECHAS (Aquí agrupamos todo lo de fechas para que no choque)
// =============================
router.get("/fechas-paginadas", getTodasLasFechasPaginadas); // Paginador de tabla plana
router.get("/fechas/:id", getFechaById); 
router.post("/fechas-excursion", createFechaExcursion);  
router.put("/fechas/restore/:id", restoreFechaExcursion);
router.put("/fechas/:id", updateFechaExcursion);
router.delete("/fechas/:id", deleteFechaExcursion);
router.get("/:id_excursion/fechas", getFechasByExcursion); // Las fechas de una excursión específica
router.get("/fecha/:id_fecha", async (req, res) => { /* ... tu lógica inline ... */ });

// =============================
// 3. RUTAS DE EXCURSIONES (CRUD PRINCIPAL)
// =============================
router.get("/", getExcursiones);
router.post("/", createExcursion);
router.put("/restore/:id", restoreExcursion); 
router.put("/:id", updateExcursion);
router.delete("/:id", deleteExcursion);
router.get("/:id", getExcursionById);
router.get("/guia/:id_guia", getExcursionesPorGuia);

// =============================
// 4. MULTIMEDIA
// =============================
router.get("/:id_excursion/multimedia", getMultimediaByExcursion);
router.post("/multimedia", createMultimedia);
router.delete("/multimedia/:id", deleteMultimedia);

// =============================
// 5. CATEGORÍAS
// =============================
router.put("/:id/categorias", updateCategoriasExcursionMultiple);

export default router;