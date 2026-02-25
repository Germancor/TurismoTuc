import express from "express";
import multer from "multer";
import { createMultimedia, getMultimediaByExcursion } from "../controllers/excursiones.controller.js";

const router = express.Router();



const upload = multer({ storage });

router.post("/", upload.single("imagen"), createMultimedia);
router.get("/excursion/:id", getMultimediaByExcursion);


export default router;