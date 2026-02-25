import { pool } from "../config/DB.js";

// -------------------------------------------------------------------
// SUBIR COMPROBANTE
// POST /api/comprobantes  (file field: "archivo")
// body: { id_reserva, id_turista, descripcion? }
// -------------------------------------------------------------------
export const subirComprobante = async (req, res) => {
  try {
    const { id_reserva, id_turista, descripcion } = req.body;

    if (!id_reserva) return res.status(400).json({ message: "Falta id_reserva" });
    if (!id_turista) return res.status(400).json({ message: "Falta id_turista" });
    if (!req.file) return res.status(400).json({ message: "Falta archivo" });

    // Si tu middleware uploadComprobante guarda en uploads/comprobantes
    const url = `/uploads/comprobantes/${req.file.filename}`;

    const sql = `
      INSERT INTO Multimedia
        (tipo, url, descripcion, id_turista, id_reserva, eliminado, estado_moderacion)
      VALUES
        (?, ?, ?, ?, ?, 0, 'pendiente')
    `;

    const params = ["comprobante", url, descripcion || null, id_turista, id_reserva];

    // ✅ mysql2 promise wrapper (NO uses await pool.query)
    const [result] = await pool.promise().query(sql, params);

    return res.status(201).json({
      ok: true,
      id_multimedia: result.insertId,
      url,
    });
  } catch (err) {
    console.error("subirComprobante error:", err);
    return res.status(500).json({ ok: false, message: "Error al guardar comprobante" });
  }
};

// -------------------------------------------------------------------
// LISTAR COMPROBANTES PENDIENTES
// GET /api/comprobantes/pendientes
// -------------------------------------------------------------------
export const getPendientesComprobantes = async (req, res) => {
  try {
    const [rows] = await pool.promise().query(`
      SELECT
        m.id_multimedia,
        m.tipo,
        m.url,
        m.descripcion,
        m.id_turista,
        m.id_reserva,
        m.estado_moderacion,
        t.nombre   AS turista_nombre,
        t.apellido AS turista_apellido,
        t.email    AS email,
        e.titulo   AS excursion_titulo,
        fe.fecha   AS fecha
      FROM Multimedia m
      LEFT JOIN Turistas t ON m.id_turista = t.id_turista
      LEFT JOIN Reservas r ON m.id_reserva = r.id_reserva
      LEFT JOIN FechasExcursion fe ON r.id_fecha = fe.id_fecha
      LEFT JOIN Excursiones e ON fe.id_excursion = e.id_excursion
      WHERE m.tipo = 'comprobante'
        AND m.eliminado = 0
        AND m.estado_moderacion = 'pendiente'
      ORDER BY m.id_multimedia DESC
    `);

    return res.json(rows);
  } catch (error) {
    console.error("Error al obtener comprobantes pendientes:", error);
    return res.status(500).json({
      ok: false,
      message: "Error interno al obtener comprobantes pendientes",
    });
  }
};

// -------------------------------------------------------------------
// APROBAR COMPROBANTE
// PUT /api/comprobantes/:id/aprobar
// -------------------------------------------------------------------
export const aprobarComprobante = async (req, res) => {
  const { id } = req.params;

  const conn = await pool.promise().getConnection();

  try {
    await conn.beginTransaction();

    // 1️⃣ Aprobar comprobante
    const [updateMultimedia] = await conn.query(
      "UPDATE Multimedia SET estado_moderacion = 'aprobada' WHERE id_multimedia = ? AND tipo = 'comprobante'",
      [id]
    );

    if (updateMultimedia.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ message: "Comprobante no encontrado" });
    }

    // 2️⃣ Obtener id_reserva del comprobante
    const [rows] = await conn.query(
      "SELECT id_reserva FROM Multimedia WHERE id_multimedia = ?",
      [id]
    );

    const id_reserva = rows?.[0]?.id_reserva;

    if (!id_reserva) {
      await conn.rollback();
      return res.status(400).json({
        message: "El comprobante no tiene id_reserva asociado"
      });
    }

    // 3️⃣ Aprobar pago asociado
    await conn.query(
      `UPDATE Pagos 
       SET estado_pago = 'aprobado'
       WHERE id_reserva = ? 
       AND eliminado = 0`,
      [id_reserva]
    );

    await conn.commit();

    return res.json({
      ok: true,
      message: "Comprobante aprobado y pago actualizado automáticamente"
    });

  } catch (error) {
    await conn.rollback();
    console.error("Error al aprobar comprobante:", error);
    return res.status(500).json({
      message: "Error interno al aprobar comprobante"
    });
  } finally {
    conn.release();
  }
};


// -------------------------------------------------------------------
// RECHAZAR COMPROBANTE
// PUT /api/comprobantes/:id/rechazar
// -------------------------------------------------------------------
export const rechazarComprobante = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool
      .promise()
      .query(
        "UPDATE Multimedia SET estado_moderacion = 'rechazada' WHERE id_multimedia = ? AND tipo='comprobante'",
        [id]
      );

    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, message: "Comprobante no encontrado" });
    }

    return res.json({ ok: true, message: "Comprobante rechazado" });
  } catch (error) {
    console.error("Error al rechazar comprobante:", error);
    return res.status(500).json({
      ok: false,
      message: "Error interno al rechazar comprobante",
    });
  }
};

// -------------------------------------------------------------------
// ELIMINAR COMPROBANTE (BORRADO LÓGICO)
// PUT /api/comprobantes/:id/eliminar
// -------------------------------------------------------------------
export const eliminarComprobante = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool
      .promise()
      .query(
        `
        UPDATE Multimedia
        SET eliminado = 1, fecha_eliminacion = NOW()
        WHERE id_multimedia = ? AND tipo='comprobante'
        `,
        [id]
      );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        message: "Comprobante no encontrado",
      });
    }

    return res.json({
      ok: true,
      message: "Comprobante eliminado correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar comprobante:", error);
    return res.status(500).json({
      ok: false,
      message: "Error interno al eliminar comprobante",
    });
  }
};
