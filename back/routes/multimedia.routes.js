import express from "express";
import multer from "multer";
import path from "path";
import { createMultimedia, getMultimediaByExcursion } from "../controllers/multimedia.controller.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

router.post("/", upload.single("imagen"), createMultimedia);
router.get("/excursion/:id", getMultimediaByExcursion);

export default router;