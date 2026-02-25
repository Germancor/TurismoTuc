// Exporto o requiero EXPRESS y mysql
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

import usuariosRoutes from "./routes/usuarios.routes.js";
import reservasRoutes from "./routes/reservas.routes.js";
import turistasRoutes from "./routes/turistas.routes.js";
import excursionesRoutes from "./routes/excursiones.routes.js";
import reseniasRoutes from "./routes/resenia.routes.js";
import personalizacionRoutes from "./routes/personalizacion.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import categoriasRoutes from "./routes/categorias.routes.js";
import authTuristasRoutes from "./routes/authturistas.routes.js";
import carritoRoutes from "./routes/carrito.routes.js";
import pagosRoutes from "./routes/pagos.routes.js";
import contactoRoutes from "./routes/contacto.routes.js";

import botRoutes from "./routes/bot.routes.js";

import cloudinaryRoutes from './routes/cloudinary.routes.js'; 
import excursionUploadRoutes from './routes/uploadExcursiones.routes.js';
import resenasMultimediaRoutes from "./routes/reseniaMultimedia.routes.js";

import comprobantesRoutes from "./routes/comprobantes.routes.js";

const app = express();

// Middlewares básicos
app.use(express.json());

// CORS: permitir front local y el de Vercel
const allowedOrigins = [
  "http://localhost:5173",                    // desarrollo
  "https://altotucuman-turismo.vercel.app"    // producción
];



app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// Rutas
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/reservas", reservasRoutes);
app.use("/api/turistas", turistasRoutes);
app.use("/api/excursiones", excursionesRoutes);
app.use("/api/resenias", reseniasRoutes);
app.use("/api/categorias", categoriasRoutes);
app.use("/api/personalizacion", personalizacionRoutes);
app.use("/api/carrito", carritoRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/auth/turistas", authTuristasRoutes);
app.use("/api/pagos", pagosRoutes);

app.use("/api/bot", botRoutes);

app.use("/api", contactoRoutes);
app.use('/api', cloudinaryRoutes);
app.use('/api', excursionUploadRoutes);
app.use("/api", resenasMultimediaRoutes);


app.use("/api/comprobantes", comprobantesRoutes);

// para poder acceder al archivo luego
app.use("/uploads", express.static("uploads"));

// Endpoint raíz
app.get("/", (req, res) => {
  res.send("API MAAVYT 🚀🏞");
});

// Redirecciones post-pago (Mercado Pago)
app.get("/pago-exitoso", (req, res) => {
  res.redirect("http://localhost:5173/perfil-turista");
});

// Levanta el servidor o escucha
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Escuchando puerto ${PORT}`);
});
