import express from "express";
import {
  getCategoriasExcursion,
  updateCategoriaExcursion,
} from "../controllers/categorias.controller.js";

const router = express.Router();

router.get("/", getCategoriasExcursion);
router.post("/actualizar", updateCategoriaExcursion);

export default router;