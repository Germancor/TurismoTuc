import express from "express";
import { crearPago, webhookMercadoPago, iniciarPagoPayway, callbackPayway, registrarTransferencia, getPagos, updatePagoEstado, deletePago } from "../controllers/pagos.controller.js";

const router = express.Router();

//Simulacion mercadopago
router.post("/crear-pago", crearPago);
router.post("/webhook/mercadopago", webhookMercadoPago);


// Simulación Payway
router.post("/payway/iniciar", iniciarPagoPayway);
router.post("/payway/callback", callbackPayway);

// Transferencia bancaria
router.post("/transferencia", registrarTransferencia);

// GET todos los pagos
router.get("/", getPagos);

// PUT actualizar estado
router.put("/:id_pago", updatePagoEstado);

// DELETE eliminar pago
router.delete("/:id_pago", deletePago);

export default router;
