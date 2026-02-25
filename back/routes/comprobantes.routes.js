import { Router } from "express";
import { uploadComprobante } from "../middlewares/uploadComprobante.js";
import { subirComprobante, getPendientesComprobantes, aprobarComprobante, rechazarComprobante, eliminarComprobante } from "../controllers/comprobantes.controller.js";

const router = Router();

// POST /api/comprobantes (file field: "archivo")
router.post("/", uploadComprobante.single("archivo"), subirComprobante);
router.get("/pendientes", getPendientesComprobantes);
router.put("/:id/aprobar", aprobarComprobante);
router.put("/:id/rechazar", rechazarComprobante);
router.put("/:id/eliminar", eliminarComprobante);

export default router;
