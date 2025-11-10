// routes/reservasRoutes.js
import express from "express";
import {
  getReservas,
  getReservaById,
  createReserva,
  updateReserva,
  deleteReserva,
  restoreReserva,
  getParticipantesPorExcursion,
  getPagos,
  createPago,
  deletePago,
  buscarReservasPorDNI,
} from "../controllers/reservas.controller.js";

const router = express.Router();

// Reservas
router.get("/", getReservas);
router.get("/buscar", buscarReservasPorDNI);
router.get("/:id", getReservaById);
router.post("/", createReserva);
router.put("/:id", updateReserva);
router.delete("/:id", deleteReserva);
router.put("/restore/:id", restoreReserva);
router.get("/excursion/:id_excursion/participantes", getParticipantesPorExcursion);


// Pagos
router.get("/pagos/listar", getPagos);
router.post("/pagos", createPago);
router.delete("/pagos/:id", deletePago);

export default router;