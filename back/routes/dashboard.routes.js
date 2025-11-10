import express from "express";
import {
  getMetricas,
  getReservasHoy,
  getReservasProximas,
} from "../controllers/dashboard.controller.js";

const router = express.Router();

router.get("/metricas", getMetricas);
router.get("/reservas/hoy", getReservasHoy);
router.get("/reservas/proximas", getReservasProximas);

export default router;
