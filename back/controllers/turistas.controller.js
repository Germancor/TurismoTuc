import { pool } from "../config/DB.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

/* ============================================================
   👥 GESTIÓN DE TURISTAS
   ============================================================ */

// Listar todos los turistas activos
export const getTuristas = (req, res) => {
  const { mostrarArchivadas, page = 1, limit = 10 } = req.query;
  const condiciones = [];
  const params = [];


  if (mostrarArchivadas === "true") {
    condiciones.push("eliminado = 1");
  } else {
    condiciones.push("eliminado = 0");
  }

  const whereClause = condiciones.length > 0 ? `WHERE ${condiciones.join(" AND ")}` : "";
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const baseQuery = `
    FROM Turistas
    ${whereClause}
  `;

  const sqlCount = `SELECT COUNT(*) AS total ${baseQuery}`;
  const sqlData = `
    SELECT 
      id_turista, 
      CONCAT(nombre, ' ', apellido) AS nombre_completo, 
      nombre, 
      apellido, 
      dni, 
      email, 
      telefono,
      eliminado -- 👈 Necesario para el front
    ${baseQuery}
    ORDER BY dni ASC
    LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)};
  `;

  pool.query(sqlCount, (err, countResult) => {
    if (err) return res.status(500).json({ message: "Error al contar turistas" });

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / parseInt(limit));

    pool.query(sqlData, (err, dataResult) => {
      if (err) return res.status(500).json({ message: "Error al obtener turistas" });

      res.json({
        data: dataResult,
        total,
        totalPages,
        currentPage: parseInt(page),
      });
    });
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

/* ============================================================
   🔍 BUSCAR TURISTA POR DNI
   ============================================================ */
export const buscarTuristaPorDNI = (req, res) => {
  const { dni, page = 1, limit = 10, mostrarArchivadas } = req.query;

  if (!dni) {
    return res.status(400).json({ message: "Se requiere el parámetro 'dni'" });
  }

  const offset = (parseInt(page) - 1) * parseInt(limit);
  const searchDNI = `${dni}%`;
  

  const isArchivada = mostrarArchivadas === "true" ? 1 : 0;

  const sqlCount = `SELECT COUNT(*) AS total FROM Turistas WHERE dni LIKE ? AND eliminado = ?`;
  const sqlData = `
    SELECT id_turista, nombre, apellido, CONCAT(nombre, ' ', apellido) AS nombre_completo,
           dni, email, telefono, direccion, nacionalidad, eliminado
    FROM Turistas
    WHERE dni LIKE ? AND eliminado = ?
    ORDER BY nombre ASC
    LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
  `;

  pool.query(sqlCount, [searchDNI, isArchivada], (err, countResult) => {
    if (err) return res.status(500).json({ message: "Error al contar turistas" });

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    pool.query(sqlData, [searchDNI, isArchivada], (err, dataResult) => {
      if (err) return res.status(500).json({ message: "Error al buscar turistas" });

      res.json({
        data: dataResult,
        total,
        totalPages,
        currentPage: parseInt(page),
      });
    });
  });
};

/* ============================================================
   🔍 BUSCAR UN SOLO TURISTA POR DNI
   ============================================================ */
export const buscarTuristaExactoPorDNI = (req, res) => {
  const { dni } = req.query;

  if (!dni) return res.status(400).json({ message: "Se requiere el parámetro 'dni'" });

  const sql = `
    SELECT id_turista, nombre, apellido, CONCAT(nombre, ' ', apellido) AS nombre_completo,
           dni, email, telefono, direccion, nacionalidad
    FROM Turistas
    WHERE dni = ? AND eliminado = 0
    LIMIT 1
  `;

  pool.query(sql, [dni], (err, results) => {
    if (err) return res.status(500).json({ message: "Error al buscar turista", error: err.message });

    if (results.length === 0) return res.status(404).json({ message: "Turista no encontrado" });

    res.json(results[0]);
  });
};

// Crear un nuevo turista (uso interno del panel)
export const createTurista = async (req, res) => {
  const { nombre, apellido, dni, email, telefono, direccion, nacionalidad } = req.body;

  if (!nombre || !apellido || !dni)
    return res.status(400).json({ message: "Faltan datos obligatorios (nombre, apellido o DNI)" });

  try {
    const hashedPassword = await bcrypt.hash(dni, 10); // 🔐 contraseña = DNI encriptado

    const sql = `
      INSERT INTO Turistas (nombre, apellido, dni, email, telefono, direccion, nacionalidad, password)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [nombre, apellido, dni, email, telefono, direccion, nacionalidad, hashedPassword];

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
  } catch (err) {
    console.error("Error al encriptar contraseña:", err);
    res.status(500).json({ message: "Error interno al crear turista" });
  }
};

// 🔹 Modificar un turista existente (versión actualizada)
// 🔹 Modificar un turista existente (versión consistente con login)
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
      id: turista.id_turista, // 👈 clave consistente
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
export const getReservasByTurista = async (req, res) => {
  try {
    const { id } = req.params;
    

    const { historial = 'false', page = 1 } = req.query;

    const isHistorial = historial === 'true';
    const limit = isHistorial ? 10 : 5;
    const offset = (Number(page) - 1) * limit;


    let baseWhere = "WHERE r.id_turista = ? AND r.eliminado = 0";
    if (!isHistorial) {
      baseWhere += " AND r.estado_reserva IN ('confirmada', 'pendiente')";
    }


    const countSql = `SELECT COUNT(*) as total FROM Reservas r ${baseWhere}`;
    const [countResult] = await pool.promise().query(countSql, [id]);
    const totalRegistros = countResult[0].total;
    const totalPages = Math.ceil(totalRegistros / limit) || 1;


    let orderClause = isHistorial
      ? "ORDER BY FIELD(r.estado_reserva, 'confirmada', 'pendiente', 'finalizada', 'cancelada'), f.fecha ASC"
      : "ORDER BY FIELD(r.estado_reserva, 'confirmada', 'pendiente'), f.fecha ASC";

    const sql = `
      SELECT 
        r.id_reserva, e.titulo AS excursion_nombre, 
        CONCAT(u.nombre, ' ', u.apellido) AS guia_nombre, 
        e.ubicacion, r.cantidad_personas, r.monto_total, 
        r.estado_reserva, r.fecha_reserva,
        DATE_FORMAT(f.fecha, '%Y-%m-%d') AS fecha_salida, f.hora_salida
      FROM Reservas r
      LEFT JOIN FechasExcursion f ON r.id_fecha = f.id_fecha
      LEFT JOIN Excursiones e ON f.id_excursion = e.id_excursion
      LEFT JOIN Usuarios u ON e.id_guia = u.id_usuario
      ${baseWhere}
      ${orderClause}
      LIMIT ? OFFSET ?
    `;

    const [reservas] = await pool.promise().query(sql, [id, limit, offset]);


    res.json({
      reservas,
      totalPages,
      currentPage: Number(page),
      totalRegistros
    });

  } catch (error) {
    console.error("Error al obtener reservas del turista:", error);
    res.status(500).json({ message: "Error interno del servidor al obtener reservas" });
  }
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

export const restoreTurista = (req, res) => {
  const { id } = req.params;
  const sql = `UPDATE Turistas SET eliminado=0, fecha_eliminacion=NULL WHERE id_turista=?`;

  pool.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ message: "Error al restaurar turista" });
    if (result.affectedRows === 0) return res.status(404).json({ message: "Turista no encontrado" });
    res.json({ message: "Turista restaurado correctamente" });
  });
};