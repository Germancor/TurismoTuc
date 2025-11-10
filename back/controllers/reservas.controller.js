// controllers/reservasController.js
import { pool } from "../config/DB.js";

// =============================
// RESERVAS
// =============================

// Obtener las reservas con información relacionada y filtro
export const getReservas = (req, res) => {
  const {
    filtro,
    estadoreserva,
    fechaDesde,
    fechaHasta,
    page = 1,
    limit = 10,
  } = req.query;
  const condiciones = [];
  const params = [];

  // Filtro por activas/eliminadas
  if (filtro === "activas") condiciones.push("r.eliminado = 0");
  if (filtro === "eliminadas") condiciones.push("r.eliminado = 1");

  // Filtro por estado de reserva
  if (estadoreserva && estadoreserva !== "todas") {
    condiciones.push(`r.estado_reserva = '${estadoreserva}'`);
  }

    // Filtro por fechas
  if (fechaDesde && fechaHasta) {
    condiciones.push(
      `DATE(r.fecha_reserva) BETWEEN '${fechaDesde}' AND '${fechaHasta}'`
    );
  } else if (fechaDesde) {
    condiciones.push(`DATE(r.fecha_reserva) >= '${fechaDesde}'`);
  } else if (fechaHasta) {
    condiciones.push(`DATE(r.fecha_reserva) <= '${fechaHasta}'`);
  }

  const whereClause =
    condiciones.length > 0 ? `WHERE ${condiciones.join(" AND ")}` : "";

  // Paginación
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const baseQuery = `
    FROM Reservas r
    JOIN Turistas t ON r.id_turista = t.id_turista
    JOIN FechasExcursion f ON r.id_fecha = f.id_fecha
    JOIN Excursiones e ON f.id_excursion = e.id_excursion
    ${whereClause}
  `;

  const sqlCount = `SELECT COUNT(*) AS total ${baseQuery}`;
  const sqlData = `
    SELECT 
      r.id_reserva, 
      t.dni AS dni_turista,
      CONCAT(t.nombre, ' ', t.apellido) AS turista,
      e.titulo AS excursion,
      f.fecha AS fecha_excursion,
      r.cantidad_personas,
      r.monto_total,
      r.estado_reserva,
      r.fecha_reserva,
      r.eliminado
    ${baseQuery}
    ORDER BY r.fecha_reserva DESC
    LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)};
  `;

  // Ejecutamos ambas consultas
  pool.query(sqlCount, (err, countResult) => {
    if (err) {
      console.error("Error al contar reservas:", err);
      return res.status(500).json({ message: "Error al contar reservas" });
    }

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    pool.query(sqlData, (err, dataResult) => {
      if (err) {
        console.error("Error al obtener reservas:", err);
        return res.status(500).json({ message: "Error al obtener reservas" });
      }

      res.json({
        data: dataResult,
        total,
        totalPages,
        currentPage: parseInt(page),
      });
    });
  });
};

// Obtener reserva por ID
export const getReservaById = (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT 
      r.id_reserva,
      r.id_turista,
      r.id_fecha, 
      COALESCE(t.nombre, '') AS nombre,
      COALESCE(t.apellido, '') AS apellido,
      COALESCE(t.dni, '') AS dni,
      e.id_excursion,
      e.titulo AS excursion,
      f.fecha AS fecha_excursion,
      r.cantidad_personas,
      r.monto_total,
      r.estado_reserva,
      r.fecha_reserva
    FROM Reservas r
    JOIN Turistas t ON r.id_turista = t.id_turista
    JOIN FechasExcursion f ON r.id_fecha = f.id_fecha
    JOIN Excursiones e ON f.id_excursion = e.id_excursion
    WHERE r.id_reserva = ? AND r.eliminado = 0
  `;

  pool.query(sql, [id], (err, results) => {
    if (err) {
      console.error("Error al obtener reserva:", err);
      return res.status(500).json({ message: "Error al obtener reserva" });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: "Reserva no encontrada" });
    }

    const reserva = results[0];
    res.json({
      id_reserva: reserva.id_reserva,
      id_turista: reserva.id_turista,
      id_fecha: reserva.id_fecha,
      id_excursion: reserva.id_excursion,
      cantidad_personas: reserva.cantidad_personas,
      monto_total: reserva.monto_total,
      estado_reserva: reserva.estado_reserva,
      fecha_reserva: reserva.fecha_reserva,
      excursion: reserva.excursion,
      fecha_excursion: reserva.fecha_excursion,
      turista: `${reserva.nombre ?? ""}  ${reserva.apellido ?? ""}`.trim(),
      dni: reserva.dni,
    });
  });
};

// Crear nueva reserva (versión corregida)
// Crear nueva reserva (sin modificar cupos todavía)
export const createReserva = (req, res) => {
  const { id_turista, id_fecha, cantidad_personas, estado_reserva } = req.body;

  console.log(" Datos recibidos para crear reserva:", req.body);

  // Validar datos obligatorios
  if (!id_turista || !id_fecha || !cantidad_personas) {
    return res.status(400).json({ message: "Faltan datos obligatorios" });
  }

  // Obtener precio base de la excursión (sin restar cupos)
  const sqlPrecio = `
    SELECT e.precio_base
    FROM FechasExcursion f
    JOIN Excursiones e ON f.id_excursion = e.id_excursion
    WHERE f.id_fecha = ? AND f.eliminado = 0
  `;

  pool.query(sqlPrecio, [id_fecha], (err, results) => {
    if (err) {
      console.error("Error al obtener precio de excursión:", err);
      return res.status(500).json({ message: "Error al calcular monto total" });
    }

    if (results.length === 0) {
      return res
        .status(404)
        .json({ message: "Fecha de excursión no encontrada" });
    }

    const precioBase = results[0].precio_base;
    const monto_total = precioBase * cantidad_personas;

    // Insertar la reserva como pendiente (sin tocar cupos aún)
    const sqlInsert = `
      INSERT INTO Reservas
      (id_fecha, id_turista, cantidad_personas, monto_total, estado_reserva)
      VALUES (?, ?, ?, ?, ?)
    `;

    pool.query(
      sqlInsert,
      [
        id_fecha,
        id_turista,
        cantidad_personas,
        monto_total,
        estado_reserva || "pendiente",
      ],
      (err2, result) => {
        if (err2) {
          console.error("Error al crear reserva:", err2);
          return res.status(500).json({ message: "Error al crear reserva" });
        }

        console.log(`✅ Reserva creada con ID ${result.insertId}`);

        res.status(201).json({
          message: "Reserva creada correctamente (pendiente de pago)",
          id_reserva: result.insertId,
          monto_total,
        });
      }
    );
  });
};

// Actualizar estado o datos de una reserva
export const updateReserva = (req, res) => {
  const { id } = req.params;
  const {
    id_fecha,
    id_excursion,
    cantidad_personas,
    monto_total,
    estado_reserva,
  } = req.body;

  // Validaciones simples
  if (!id_fecha || !cantidad_personas || !estado_reserva) {
    return res.status(400).json({ message: "Faltan datos obligatorios" });
  }

  // Actualizar los datos principales de la reserva
  const sql = `
    UPDATE Reservas
    SET id_fecha = ?, cantidad_personas = ?, monto_total = ?, estado_reserva = ?
    WHERE id_reserva = ?;
  `;

  pool.query(
    sql,
    [id_fecha, cantidad_personas, monto_total, estado_reserva, id],
    (err, result) => {
      if (err) {
        console.error("Error al actualizar reserva:", err);
        return res
          .status(500)
          .json({ message: "Error al actualizar la reserva" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Reserva no encontrada" });
      }

      //  Si también viene id_excursion, actualizamos la relación en FechasExcursion
      // (esto es opcional; la relación excursión-fecha normalmente se define por id_fecha)
      if (id_excursion) {
        const sqlExcursion = `
          UPDATE FechasExcursion 
          SET id_excursion = ?
          WHERE id_fecha = ?;
        `;
        pool.query(sqlExcursion, [id_excursion, id_fecha], (err2) => {
          if (err2) {
            console.error("Error al actualizar excursión:", err2);
            return res.status(500).json({
              message: "Reserva actualizada, pero error en excursión",
            });
          }
          res.json({ message: "Reserva actualizada correctamente" });
        });
      } else {
        res.json({ message: "Reserva actualizada correctamente" });
      }
    }
  );
};

// Baja lógica de reserva
export const deleteReserva = (req, res) => {
  const { id } = req.params;
  const sql = `
    UPDATE Reservas
    SET eliminado=1, fecha_eliminacion=NOW()
    WHERE id_reserva=?
  `;
  pool.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error al eliminar reserva:", err);
      return res.status(500).json({ message: "Error al eliminar reserva" });
    }
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Reserva no encontrada" });
    res.json({ message: "Reserva eliminada (baja lógica) correctamente" });
  });
};

export const restoreReserva = (req, res) => {
  const { id } = req.params;
  const sql = `
    UPDATE Reservas
    SET eliminado = 0, fecha_eliminacion = NULL
    WHERE id_reserva = ?
  `;
  pool.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error al restaurar reserva:", err);
      return res.status(500).json({ message: "Error al restaurar reserva" });
    }
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Reserva no encontrada" });
    res.json({ message: "Reserva restaurada correctamente" });
  });
};

// =============================
// PAGOS
// =============================

// Obtener pagos con info relacionada
export const getPagos = (req, res) => {
  const sql = `
    SELECT 
      p.id_pago, 
      CONCAT(t.nombre, ' ', t.apellido) AS turista,
      e.titulo AS excursion,
      m.nombre_medio AS medio_pago,
      p.monto, p.moneda, p.estado_pago, p.fecha_pago
    FROM Pagos p
    JOIN Reservas r ON p.id_reserva = r.id_reserva
    JOIN Turistas t ON r.id_turista = t.id_turista
    JOIN FechasExcursion f ON r.id_fecha = f.id_fecha
    JOIN Excursiones e ON f.id_excursion = e.id_excursion
    JOIN MediosPago m ON p.id_medio_pago = m.id_medio_pago
    WHERE p.eliminado = 0
    ORDER BY p.fecha_pago DESC;
  `;

  pool.query(sql, (err, results) => {
    if (err) {
      console.error("Error al obtener pagos:", err);
      return res.status(500).json({ message: "Error al obtener pagos" });
    }
    res.json(results);
  });
};

// Crear nuevo pago
export const createPago = (req, res) => {
  const { id_reserva, id_medio_pago, monto, estado_pago, moneda } = req.body;

  if (!id_reserva || !id_medio_pago || !monto)
    return res.status(400).json({ message: "Faltan datos obligatorios" });

  const sql = `
    INSERT INTO Pagos (id_reserva, id_medio_pago, monto, estado_pago, moneda)
    VALUES (?, ?, ?, ?, ?)
  `;
  const values = [
    id_reserva,
    id_medio_pago,
    monto,
    estado_pago || "pendiente",
    moneda || "ARS",
  ];

  pool.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error al registrar pago:", err);
      return res.status(500).json({ message: "Error al registrar pago" });
    }
    res
      .status(201)
      .json({ message: "Pago registrado correctamente", id: result.insertId });
  });
};

// Baja lógica de pago
export const deletePago = (req, res) => {
  const { id } = req.params;
  const sql = `
    UPDATE Pagos
    SET eliminado=1, fecha_eliminacion=NOW()
    WHERE id_pago=?
  `;
  pool.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error al eliminar pago:", err);
      return res.status(500).json({ message: "Error al eliminar pago" });
    }
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Pago no encontrado" });
    res.json({ message: "Pago eliminado (baja lógica) correctamente" });
  });
};

export const getParticipantesPorExcursion = (req, res) => {
  const { id_excursion } = req.params;

  const sql = `
    SELECT u.id_usuario, u.nombre, u.apellido, u.dni, u.email
    FROM Reservas r
    JOIN FechasExcursion f ON r.id_fecha = f.id_fecha
    JOIN Usuarios u ON r.id_turista = u.id_usuario
    WHERE f.id_excursion = ? AND r.eliminado = 0
    ORDER BY u.apellido ASC
  `;

  pool.query(sql, [id_excursion], (err, results) => {
    if (err) {
      console.error("Error al obtener participantes:", err);
      return res
        .status(500)
        .json({ message: "Error al obtener participantes" });
    }
    res.json(results);
  });
};

// =============================
// BUSCAR RESERVAS POR DNI
// =============================
// Buscar reservas por DNI
export const buscarReservasPorDNI = (req, res) => {
  const { dni } = req.query;

  if (!dni || dni.trim() === "") {
    return res.status(200).json([]);
  }

  const sql = `
    SELECT
      r.id_reserva,
      r.id_turista,
      r.id_fecha,
      COALESCE(t.nombre, '') AS nombre,
      COALESCE(t.apellido, '') AS apellido,
      COALESCE(t.dni, '') AS dni,
      -- obtenemos datos de la excursion desde la tabla relacionada
      e.id_excursion,
      COALESCE(e.titulo, '') AS excursion,
      f.fecha AS fecha_excursion,
      r.cantidad_personas,
      r.monto_total,
      r.estado_reserva,
      r.fecha_reserva,
      COALESCE(r.eliminado, 0) AS eliminado
    FROM Reservas r
    JOIN Turistas t ON r.id_turista = t.id_turista
    JOIN FechasExcursion f ON r.id_fecha = f.id_fecha
    JOIN Excursiones e ON f.id_excursion = e.id_excursion
    WHERE t.dni LIKE ? AND (r.eliminado IS NULL OR r.eliminado = 0)
    ORDER BY f.fecha DESC
  `;

  pool.query(sql, [`%${dni}%`], (err, results) => {
    if (err) {
      console.error("Error al buscar reservas por DNI:", err);
      return res.status(500).json({ message: "Error al buscar reservas" });
    }

    const rows = results.map((r) => ({
      id_reserva: r.id_reserva,
      id_turista: r.id_turista,
      id_fecha: r.id_fecha,
      id_excursion: r.id_excursion,
      cantidad_personas: r.cantidad_personas,
      monto_total: r.monto_total,
      estado_reserva: r.estado_reserva,
      fecha_reserva: r.fecha_reserva,
      excursion: r.excursion,
      fecha_excursion: r.fecha_excursion,
      turista: `${r.nombre ?? ""} ${r.apellido ?? ""}`.trim(),
      dni_turista: r.dni,
      eliminado: r.eliminado,
    }));

    // Devolvemos array (vacío si no encontró nada). Esto evita 404 en búsquedas.
    return res.json(rows);
  });
};
