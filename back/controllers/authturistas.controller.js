import { pool } from "../config/DB.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// ============================
// 🔐 REGISTRO DE TURISTA
// ============================
export const registerTurista = async (req, res) => {
  const { nombre, apellido, dni, email, telefono, direccion, nacionalidad, password } = req.body;

  // Validación de campos obligatorios
  if (!nombre || !apellido || !dni || !email || !password || !telefono || !direccion || !nacionalidad) {
    return res.status(400).json({ message: "Todos los campos son obligatorios." });
  }

  try {
    // Verificar si el email ya está registrado
    const [existe] = await pool.promise().query("SELECT id_turista FROM Turistas WHERE email = ?", [email]);
    if (existe.length > 0) {
      return res.status(400).json({ message: "El email ya está registrado." });
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar nuevo turista
    const sql = `
      INSERT INTO Turistas (nombre, apellido, dni, email, password, telefono, direccion, nacionalidad)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [nombre, apellido, dni, email, hashedPassword, telefono, direccion, nacionalidad];
    await pool.promise().query(sql, values);

    res.status(201).json({ message: "Turista registrado correctamente." });
  } catch (err) {
    console.error("Error al registrar turista:", err);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

// ============================
// 🔓 LOGIN DE TURISTA
// ============================
export const loginTurista = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: "Faltan datos." });

  try {
    const [rows] = await pool
      .promise()
      .query(
        `SELECT id_turista, nombre, apellido, dni, email, telefono, direccion, nacionalidad, password
         FROM Turistas
         WHERE email = ? AND eliminado = 0`,
        [email]
      );

    if (rows.length === 0)
      return res.status(401).json({ message: "Turista no encontrado." });

    // 🔹 Convertir RowDataPacket a objeto plano
    const turista = JSON.parse(JSON.stringify(rows[0]));

    const validPassword = await bcrypt.compare(password, turista.password);
    if (!validPassword)
      return res.status(401).json({ message: "Contraseña incorrecta." });

    // Crear token JWT
    const token = jwt.sign(
      { id: turista.id_turista, email: turista.email },
      process.env.JWT_SECRET || "clave_supersecreta",
      { expiresIn: "2h" }
    );

    console.log("🟢 Turista logueado:", turista);

    // Enviar todos los datos relevantes del turista
    res.json({
      message: "Login exitoso",
      token,
      turista: {
        id: turista.id_turista,
        nombre: turista.nombre,
        apellido: turista.apellido,
        dni: turista.dni,
        email: turista.email,
        telefono: turista.telefono,
        direccion: turista.direccion,
        nacionalidad: turista.nacionalidad,
      },
    });
  } catch (err) {
    console.error("Error al iniciar sesión:", err);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};
