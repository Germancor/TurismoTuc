import { pool } from "../config/DB.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

/* ============================================================
   👥 GESTIÓN DE TURISTAS
   ============================================================ */

// Listar todos los turistas activos
export const getTuristas = (req, res) => {
  const sql = `
    SELECT id_turista, nombre, apellido, CONCAT(nombre, ' ', apellido) AS nombre_completo, dni, email, telefono, direccion, nacionalidad
    FROM Turistas
    WHERE eliminado = 0
    ORDER BY dni ASC
  `;

  pool.query(sql, (err, results) => {
    if (err) {
      console.error("Error al obtener turistas:", err);
      return res.status(500).json({ message: "Error al obtener turistas" });
    }
    res.json(results);
  });
};

// Obtener un turista por ID
export const getTuristaById = (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT id_turista, nombre, apellido, dni, email, telefono, direccion, nacionalidad
    FROM Turistas
    WHERE id_turista = ? AND eliminado = 0
  `;
  pool.query(sql, [id], (err, results) => {
    if (err) {
      console.error("Error al obtener turista:", err);
      return res.status(500).json({ message: "Error al obtener turista" });
    }
    if (results.length === 0)
      return res.status(404).json({ message: "Turista no encontrado" });
    res.json(results[0]);
  });
};

// Crear un nuevo turista (uso interno del panel)
export const createTurista = (req, res) => {
  const { nombre, apellido, dni, email, telefono, direccion, nacionalidad } = req.body;

  if (!nombre || !apellido || !dni)
    return res.status(400).json({ message: "Faltan datos obligatorios (nombre, apellido o DNI)" });

  const sql = `
    INSERT INTO Turistas (nombre, apellido, dni, email, telefono, direccion, nacionalidad)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [nombre, apellido, dni, email, telefono, direccion, nacionalidad];

  pool.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error al crear turista:", err);
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(400).json({ message: "El DNI ingresado ya existe" });
      }
      return res.status(500).json({ message: "Error al crear turista" });
    }
    res.status(201).json({ message: "Turista agregado correctamente", id: result.insertId });
  });
};

// 🔹 Modificar un turista existente (versión actualizada)
export const updateTurista = async (req, res) => {
  const { id } = req.params;
  const { nombre, apellido, dni, email, telefono, direccion, nacionalidad } = req.body;

  try {
    const [result] = await pool
      .promise()
      .query(
        `
        UPDATE Turistas
        SET nombre=?, apellido=?, dni=?, email=?, telefono=?, direccion=?, nacionalidad=?
        WHERE id_turista=? AND eliminado=0
      `,
        [nombre, apellido, dni, email, telefono, direccion, nacionalidad, id]
      );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Turista no encontrado" });

    // 🔹 Obtener el turista actualizado y devolverlo al front
    const [rows] = await pool
      .promise()
      .query(
        `SELECT id_turista, nombre, apellido, dni, email, telefono, direccion, nacionalidad 
         FROM Turistas WHERE id_turista = ?`,
        [id]
      );

    if (rows.length === 0)
      return res.status(404).json({ message: "Turista no encontrado tras actualizar" });

    const turista = rows[0];

    res.json({
      id_turista: turista.id_turista,
      nombre: turista.nombre,
      apellido: turista.apellido,
      dni: turista.dni,
      email: turista.email,
      telefono: turista.telefono,
      direccion: turista.direccion,
      nacionalidad: turista.nacionalidad,
    });
  } catch (err) {
    console.error("Error al actualizar turista:", err);
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "El DNI o Email ingresado ya existe" });
    }
    res.status(500).json({ message: "Error interno al actualizar turista" });
  }
};

// Baja lógica
export const deleteTurista = (req, res) => {
  const { id } = req.params;
  const sql = `
    UPDATE Turistas
    SET eliminado=1, fecha_eliminacion=NOW()
    WHERE id_turista=?
  `;
  pool.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error al eliminar turista:", err);
      return res.status(500).json({ message: "Error al eliminar turista" });
    }
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Turista no encontrado" });
    res.json({ message: "Turista eliminado (baja lógica) correctamente" });
  });
};

/* ============================================================
   📅 RESERVAS DE UN TURISTA
   ============================================================ */
export const getReservasByTurista = (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT 
      r.id_reserva,
      e.titulo AS excursion,
      e.ubicacion,
      r.cantidad_personas,
      r.monto_total,
      r.estado_reserva,
      r.fecha_reserva,
      DATE_FORMAT(f.fecha, '%Y-%m-%d') AS fecha_salida,
      f.hora_salida
    FROM Reservas r
    JOIN FechasExcursion f ON r.id_fecha = f.id_fecha
    JOIN Excursiones e ON f.id_excursion = e.id_excursion
    WHERE r.id_turista = ? 
      AND r.eliminado = 0
    ORDER BY r.fecha_reserva DESC;
  `;

  pool.query(sql, [id], (err, results) => {
    if (err) {
      console.error("Error al obtener reservas del turista:", err.message);
      return res.status(500).json({ message: "Error al obtener reservas del turista", error: err.message });
    }
    res.json(results);
  });
};

/* ============================================================
   🔐 AUTENTICACIÓN (REGISTER / LOGIN)
   ============================================================ */

// Registro de turista (desde el portal público)
export const registerTurista = async (req, res) => {
  const { nombre, apellido, dni, email, telefono, direccion, nacionalidad, password } = req.body;

  if (!nombre || !apellido || !dni || !email || !password) {
    return res.status(400).json({ message: "Faltan datos obligatorios" });
  }

  try {
    const [existe] = await pool.promise().query("SELECT id_turista FROM Turistas WHERE email = ?", [email]);
    console.log("🟢 Nuevo turista registrado:", { nombre, apellido, dni, email, telefono, direccion, nacionalidad });

    if (existe.length > 0) {
      return res.status(400).json({ message: "El email ya está registrado" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = `
      INSERT INTO Turistas (nombre, apellido, dni, email, password, telefono, direccion, nacionalidad)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [nombre, apellido, dni, email, hashedPassword, telefono, direccion, nacionalidad];
    await pool.promise().query(sql, values);

    res.status(201).json({ message: "Turista registrado correctamente" });
  } catch (err) {
    console.error("Error al registrar turista:", err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Login de turista
export const loginTurista = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: "Faltan datos" });

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
      return res.status(401).json({ message: "Turista no encontrado" });

    const turista = JSON.parse(JSON.stringify(rows[0]));
    const validPassword = await bcrypt.compare(password, turista.password);
    if (!validPassword)
      return res.status(401).json({ message: "Contraseña incorrecta" });

    const token = jwt.sign(
      { id: turista.id_turista, email: turista.email },
      process.env.JWT_SECRET || "clave_supersecreta",
      { expiresIn: "2h" }
    );

    console.log("🟢 Turista logueado:", turista);

    res.json({
      message: "Login exitoso",
      token,
      turista: {
        id_turista: turista.id_turista,
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
    res.status(500).json({ message: "Error interno del servidor" });
  }
};
