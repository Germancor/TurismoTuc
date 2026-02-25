// back/routes/carrito.routes.js
import express from "express";
import {
  getCarritoByTurista,
  createCarrito,
  addItemCarrito,
  getItemsCarrito,
  deleteItemCarrito,
  vaciarCarrito,
  updateCantidadItem
} from "../controllers/carrito.controller.js";

const router = express.Router();

// ✅ ahora las URLs quedan prolijas

// GET  /api/carrito/9                -> carrito de turista 9
router.get("/:id_turista", getCarritoByTurista);

// POST /api/carrito                  -> crear carrito (casi no lo vamos a usar desde el front)
router.post("/", createCarrito);

// POST /api/carrito/item             -> agregar item
router.post("/item", addItemCarrito);

// GET  /api/carrito/5/items          -> items del carrito 5
router.get("/:id_carrito/items", getItemsCarrito);

// DELETE /api/carrito/item/12        -> borrar item
router.delete("/item/:id_item", deleteItemCarrito);
// PUT    /api/carrito/item/15        -> actualizar cantidad item
router.put("/item/:id_item", updateCantidadItem);
// DELETE /api/carrito/vaciar/9      -> vaciar carrito del turista 9
router.delete("/vaciar/:id_turista", vaciarCarrito);

export default router;
