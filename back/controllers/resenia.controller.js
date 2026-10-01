// controllers/resenasController.js
import { pool } from "../config/DB.js";

// =============================
// TOKENS DE RESEÑA
// =============================

// Listar tokens disponibles (no usados)
export const getTokens = (req, res) => {
  const sql = `
    SELECT 
      tr.id_token,
      CONCAT(t.nombre, ' ', t.apellido) AS turista,
      e.titulo AS excursion,
      tr.token,
      tr.usado,
      tr.fecha_expiracion
    FROM TokensReseña tr
    JOIN Reservas r ON tr.id_reserva = r.id_reserva
    JOIN Turistas t ON r.id_turista = t.id_turista
    JOIN FechasExcursion f ON r.id_fecha = f.id_fecha
    JOIN Excursiones e ON f.id_excursion = e.id_excursion
    WHERE tr.eliminado = 0
    ORDER BY tr.fecha_creacion DESC;
  `;

  pool.query(sql, (err, results) => {
    if (err) {
      console.error("Error al obtener tokens:", err);
      return res.status(500).json({ message: "Error al obtener tokens" });
    }
    res.json(results);
  });
};

// Validar token
export const validarToken = (req, res) => {
  const { token } = req.params;
  const sql = `
    SELECT id_token, id_reserva, usado, fecha_expiracion
    FROM TokensReseña
    WHERE token = ? AND eliminado = 0
  `;
  pool.query(sql, [token], (err, results) => {
    if (err) {
      console.error("Error al validar token:", err);
      return res.status(500).json({ message: "Error al validar token" });
    }
    if (results.length === 0)
      return res.status(404).json({ message: "Token inválido o no encontrado" });

    const tokenData = results[0];
    if (tokenData.usado === 1)
      return res.status(400).json({ message: "El token ya fue usado" });

    if (tokenData.fecha_expiracion && new Date(tokenData.fecha_expiracion) < new Date())
      return res.status(400).json({ message: "El token ha expirado" });

    res.json({ message: "Token válido", id_reserva: tokenData.id_reserva });
  });
};

// =============================
// RESEÑAS
// =============================

// Obtener todas las reseñas publicadas
export const getResenas = (req, res) => {
  const { page = 1, limit = 10, q = "", ordenCalificacion, fechaDesde, fechaHasta } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let whereClause = "r.eliminado = 0";
  let queryParams = [];


  if (q) {
    whereClause += " AND (e.titulo LIKE ? OR t.nombre LIKE ? OR t.apellido LIKE ?)";
    const search = `%${q}%`;
    queryParams.push(search, search, search);
  }


  if (fechaDesde) {
    whereClause += " AND DATE(r.fecha_resena) >= ?";
    queryParams.push(fechaDesde);
  }
  if (fechaHasta) {
    whereClause += " AND DATE(r.fecha_resena) <= ?";
    queryParams.push(fechaHasta);
  }


  let orderClause = "r.fecha_resena DESC"; // Por defecto
  if (ordenCalificacion === "asc") {

    orderClause = "r.calificacion ASC, r.id_resena DESC"; 
  } else if (ordenCalificacion === "desc") {
    orderClause = "r.calificacion DESC, r.id_resena DESC";
  }

  const baseQuery = `
    FROM Reseñas r
    JOIN Excursiones e ON r.id_excursion = e.id_excursion
    LEFT JOIN Reservas resv ON r.id_reserva = resv.id_reserva
    LEFT JOIN Turistas t ON resv.id_turista = t.id_turista
    WHERE ${whereClause}
  `;

  const sqlCount = `SELECT COUNT(*) AS total ${baseQuery}`;
  const sqlData = `
    SELECT 
      r.id_resena, e.titulo AS excursion, CONCAT(t.nombre, ' ', COALESCE(t.apellido, '')) AS turista,
      r.calificacion, r.comentario, r.fecha_resena, r.estado
    ${baseQuery}
    ORDER BY ${orderClause}
    LIMIT ? OFFSET ?
  `;


  pool.query(sqlCount, queryParams, (err, countResult) => {
    if (err) {
      console.error("Error al contar reseñas:", err);
      return res.status(500).json({ message: "Error al contar reseñas" });
    }

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / parseInt(limit));


    pool.query(sqlData, [...queryParams, parseInt(limit), parseInt(offset)], (err, dataResult) => {
      if (err) {
        console.error("Error al obtener reseñas:", err);
        return res.status(500).json({ message: "Error al obtener reseñas" });
      }

      res.json({
        data: dataResult,
        total,
        totalPages: totalPages || 1,
        currentPage: parseInt(page),
      });
    });
  });
};

// Crear nueva reseña (usando token)
// Crear nueva reseña (solo si la reserva está finalizada y no existe otra)
export const createResena = (req, res) => {
  const { id_reserva, id_turista, puntuacion, comentario } = req.body;

  if (!id_reserva || !id_turista || !puntuacion) {
    return res.status(400).json({ message: "Faltan datos obligatorios." });
  }


    const sqlReserva = `
    SELECT r.id_reserva, r.id_turista, r.estado_reserva, e.id_excursion
    FROM Reservas r
    JOIN FechasExcursion f ON r.id_fecha = f.id_fecha
    JOIN Excursiones e ON f.id_excursion = e.id_excursion
    WHERE r.id_reserva = ?
      AND r.id_turista = ?
    `;

  pool.query(sqlReserva, [id_reserva, id_turista], (err, resultReserva) => {
    if (err) {
      console.error("Error al verificar reserva:", err);
      return res.status(500).json({ message: "Error interno al validar la reserva." });
    }

    if (resultReserva.length === 0) {
      return res.status(404).json({ message: "Reserva no encontrada." });
    }

    const reserva = resultReserva[0];
    if (reserva.estado_reserva !== "finalizada") {
      return res.status(400).json({
        message: "Solo podés calificar excursiones finalizadas.",
      });
    }


    const sqlCheck = `
    SELECT id_resena
    FROM Reseñas
    WHERE id_reserva = ?
      AND id_turista = ?
  `;
    pool.query(sqlCheck, [id_reserva, id_turista], (err2, resultCheck) => {
      if (err2) {
        console.error("Error al verificar reseña existente:", err2);
        return res.status(500).json({ message: "Error al validar reseña existente." });
      }

      if (resultCheck.length > 0) {
        return res.status(400).json({
          message: "Ya realizaste una reseña para esta excursión.",
        });
      }


      const sqlInsert = `
        INSERT INTO Reseñas (id_excursion, id_reserva, id_turista, calificacion, comentario, estado)
        VALUES (?, ?, ?, ?, ?, 'publicada')
      `;
      const values = [
        reserva.id_excursion,
        id_reserva,
        id_turista,
        puntuacion,
        comentario || "",
      ];

      pool.query(sqlInsert, values, (err3, resultInsert) => {
        if (err3) {
          console.error("Error al crear reseña:", err3);
          return res.status(500).json({ message: "Error al crear reseña." });
        }

        console.log(`✅ Nueva reseña creada para la reserva #${id_reserva}`);
        res.status(201).json({
          message: "Reseña creada correctamente.",
          id: resultInsert.insertId,
        });
      });
    });
  });
};


// Eliminar reseña (baja lógica)
export const deleteResena = (req, res) => {
  const { id } = req.params;
  const sql = `
    UPDATE Reseñas
    SET eliminado=1, fecha_eliminacion=NOW()
    WHERE id_resena=?
  `;
  pool.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error al eliminar reseña:", err);
      return res.status(500).json({ message: "Error al eliminar reseña" });
    }
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Reseña no encontrada" });
    res.json({ message: "Reseña eliminada (baja lógica) correctamente" });
  });
};

// =============================
// MULTIMEDIA
// =============================

// Obtener multimedia de una excursión
export const getMultimediaByExcursion = (req, res) => {
  const { id_excursion } = req.params;
  const sql = `
    SELECT id_multimedia, tipo, url, descripcion, id_resena
    FROM Multimedia
    WHERE id_excursion = ? AND eliminado = 0
  `;
  pool.query(sql, [id_excursion], (err, results) => {
    if (err) {
      console.error("Error al obtener multimedia:", err);
      return res.status(500).json({ message: "Error al obtener multimedia" });
    }
    res.json(results);
  });
};

// Agregar multimedia (foto/video)
export const addMultimedia = (req, res) => {
  const { tipo, url, descripcion, id_excursion, id_turista, id_resena } = req.body;

  if (!tipo || !url || !id_excursion)
    return res.status(400).json({ message: "Faltan datos obligatorios" });

  const sql = `
    INSERT INTO Multimedia (tipo, url, descripcion, id_excursion, id_turista, id_resena)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const values = [tipo, url, descripcion, id_excursion, id_turista, id_resena];

  pool.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error al agregar multimedia:", err);
      return res.status(500).json({ message: "Error al agregar multimedia" });
    }
    res.status(201).json({ message: "Archivo multimedia agregado correctamente", id: result.insertId });
  });
};

// Eliminar multimedia (baja lógica)
export const deleteMultimedia = (req, res) => {
  const { id } = req.params;
  const sql = `
    UPDATE Multimedia
    SET eliminado=1, fecha_eliminacion=NOW()
    WHERE id_multimedia=?
  `;
  pool.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error al eliminar multimedia:", err);
      return res.status(500).json({ message: "Error al eliminar multimedia" });
    }
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Archivo no encontrado" });
    res.json({ message: "Archivo eliminado (baja lógica) correctamente" });
  });
};


// Obtener reseña por ID
export const getResenaById = (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT 
      r.id_resena, e.titulo AS excursion, t.nombre AS turista,
      r.calificacion, r.comentario, r.fecha_resena, r.estado
    FROM Reseñas r
    JOIN Excursiones e ON r.id_excursion = e.id_excursion
    LEFT JOIN Reservas resv ON r.id_reserva = resv.id_reserva
    LEFT JOIN Turistas t ON resv.id_turista = t.id_turista
    WHERE r.id_resena = ? AND r.eliminado = 0
  `;
  pool.query(sql, [id], (err, results) => {
    if (err) {
      console.error("Error al obtener reseña:", err);
      return res.status(500).json({ message: "Error al obtener reseña" });
    }
    if (results.length === 0)
      return res.status(404).json({ message: "Reseña no encontrada" });
    res.json(results[0]);
  });
};

// =============================
// ACTUALIZAR RESEÑA (Admin)
// =============================
export const updateResena = (req, res) => {
  const { id } = req.params;
  const { comentario, estado } = req.body;

  if (!comentario && !estado) {
    return res
      .status(400)
      .json({ message: "Debe enviar al menos un campo para actualizar." });
  }

  const sql = `
    UPDATE Reseñas
    SET comentario = ?, estado = ?
    WHERE id_resena = ? AND eliminado = 0
  `;
  const values = [comentario || "", estado || "pendiente", id];

  pool.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error al actualizar reseña:", err);
      return res.status(500).json({ message: "Error al actualizar reseña" });
    }

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Reseña no encontrada" });

    res.json({ message: "Reseña actualizada correctamente" });
  });
};


// =============================
// 🔹 OBTENER RESEÑAS POR EXCURSIÓN (para frontend público)
// =============================
export const getResenasByExcursion = (req, res) => {
  const { id_excursion } = req.params;

  const sql = `
    SELECT 
      r.id_resena,
      r.comentario,
      r.calificacion AS puntuacion,
      CONCAT(t.nombre, ' ', t.apellido) AS nombre_turista,
      r.fecha_resena
    FROM Reseñas r
    JOIN Reservas resv ON r.id_reserva = resv.id_reserva
    JOIN Turistas t ON resv.id_turista = t.id_turista
    WHERE r.id_excursion = ? 
      AND r.eliminado = 0 
      AND r.estado = 'publicada'
    ORDER BY r.fecha_resena DESC
  `;

  pool.query(sql, [id_excursion], (err, results) => {
    if (err) {
      console.error("❌ Error al obtener reseñas por excursión:", err);
      return res.status(500).json({ message: "Error al obtener reseñas" });
    }

    res.json(results);
  });
};