//Exporto o requiero EXPRESS y mysql
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

const app = express()

//Se usa la libreria y metodos internos
app.use(express.json())
app.use(cors())

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

// Servir archivos estáticos (imágenes)

app.get("/", (req, res) => {
  res.send("API MAAVYT 🚀🏞");
});
//Levanta el servidor o escucha
app.listen(3000,()=>{
    console.log("Escuchando puerto 3000");
})
