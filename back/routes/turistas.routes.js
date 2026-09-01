// routes/turistasRoutes.js
import express from "express";
import {
  getTuristas,
  getTuristaById,
  createTurista,
  updateTurista,
  deleteTurista,
  restoreTurista,
  buscarTuristaPorDNI,
  buscarTuristaExactoPorDNI
} from "../controllers/turistas.controller.js";
// Importar la función para obtener reservas de turistas
import { getReservasByTurista } from "../controllers/turistas.controller.js";

const router = express.Router();

// Turistas
router.get("/", getTuristas);
router.get("/buscar", buscarTuristaPorDNI);
router.get("/exacto", buscarTuristaExactoPorDNI);
router.get("/:id/reservas", getReservasByTurista);
router.get("/:id", getTuristaById);
router.post("/", createTurista);
router.put("/:id", updateTurista);
router.delete("/:id", deleteTurista);
router.put("/restore/:id", restoreTurista);



export default router;

