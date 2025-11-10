import express from "express";
import { iniciarPagoPayway, callbackPayway, registrarTransferencia } from "../controllers/pagos.controller.js";

const router = express.Router();

// 🟢 Simulación Payway
router.post("/payway/iniciar", iniciarPagoPayway);
router.post("/payway/callback", callbackPayway);

// 🟢 Transferencia bancaria
router.post("/transferencia", registrarTransferencia);

export default router;
