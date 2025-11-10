// routes/resenasRoutes.js
import express from "express";
import {
  getTokens,
  validarToken,
  getResenas,
  getResenaById,
  updateResena,
  createResena,
  deleteResena,
  getMultimediaByExcursion,
  addMultimedia,
  deleteMultimedia,
} from "../controllers/resenia.controller.js";

const router = express.Router();

// Tokens
router.get("/tokens", getTokens);
router.get("/tokens/:token", validarToken);

// Reseñas
router.get("/", getResenas);
router.post("/", createResena);
router.delete("/:id", deleteResena);
router.get("/:id", getResenaById);
router.put("/:id", updateResena);


// Multimedia
router.get("/multimedia/:id_excursion", getMultimediaByExcursion);
router.post("/multimedia", addMultimedia);
router.delete("/multimedia/:id", deleteMultimedia);

export default router;
