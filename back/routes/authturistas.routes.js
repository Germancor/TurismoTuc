const router = express.Router();
import express from "express";
import { registerTurista, loginTurista } from "../controllers/authturistas.controller.js";

router.post("/register", registerTurista);
router.post("/login", loginTurista);

export default router;
