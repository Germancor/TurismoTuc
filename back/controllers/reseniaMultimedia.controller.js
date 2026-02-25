import { pool } from "../config/DB.js";
import { cloudinary } from "../config/cloudinary.js";

// -------------------------------------------------------------------
// SUBIR IMAGEN DE RESEÑA (turista sube foto en su reseña)
// POST /api/resenas/:id/imagen
// -------------------------------------------------------------------
// -------------------------------------------------------------------
// SUBIR IMAGEN DE RESEÑA (turista sube foto en su reseña)
// POST /api/resenas/:id/imagen
// -------------------------------------------------------------------
export const uploadImagenResena = async (req, res) => {
  const { id } = req.params; // ID de la reseña
  const { id_turista } = req.body;
  const file = req.file;

  if (!file) {
    return res.status(400).json({
      ok: false,
      message: "No se envió ninguna imagen",
    });
  }

  try {
    // 0) Buscar la excursión asociada a esta reseña (TABLA: Reseñas)
    const [rowsRes] = await pool.promise().query(
      "SELECT id_excursion FROM Reseñas WHERE id_resena = ?",
      [id]
    );

    if (!rowsRes || rowsRes.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "La reseña no existe o no tiene excursión asociada",
      });
    }

    const id_excursion = rowsRes[0].id_excursion;

    // 1) Subir a Cloudinary usando buffer
    const resultado = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "maavyt_resenas" },
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
      stream.end(file.buffer);
    });

    const secureUrl = resultado.secure_url;
    const publicId = resultado.public_id;

    // 2) Insertar en Multimedia con estado 'pendiente'
    const sql = `
      INSERT INTO Multimedia 
      (tipo, url, descripcion, id_excursion, id_usuario, id_turista, id_resena, eliminado, estado_moderacion)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'pendiente')
    `;

    const values = [
      "foto",
      secureUrl,
      "Foto subida en una reseña",
      id_excursion,
      null, // id_usuario
      id_turista || null,
      id, // id_resena
    ];

    await pool.promise().query(sql, values);

    return res.status(201).json({
      ok: true,
      message: "Imagen subida correctamente",
      url: secureUrl,
      public_id: publicId,
    });
  } catch (error) {
    console.error("Error al subir imagen de reseña:", error);
    return res.status(500).json({
      ok: false,
      message: "Error interno al subir imagen",
    });
  }
};


// -------------------------------------------------------------------
// LISTAR MULTIMEDIA PENDIENTE DE MODERACIÓN
// GET /api/multimedia/pendientes
// -------------------------------------------------------------------
export const getPendientesMultimedia = async (req, res) => {
  try {
    const [rows] = await pool.promise().query(`
      SELECT 
        m.*,
        t.nombre    AS turista_nombre,
        t.apellido  AS turista_apellido,
        e.titulo    AS excursion_titulo
      FROM Multimedia m
      LEFT JOIN Turistas   t ON m.id_turista   = t.id_turista
      LEFT JOIN Excursiones e ON m.id_excursion = e.id_excursion
      WHERE m.tipo = 'foto'
        AND m.eliminado = 0
        AND m.estado_moderacion = 'pendiente'
    `);

    return res.json(rows);
  } catch (error) {
    console.error("Error al obtener multimedia pendiente:", error);
    return res.status(500).json({
      ok: false,
      message: "Error interno al obtener multimedia pendiente",
    });
  }
};

// -------------------------------------------------------------------
// APROBAR MULTIMEDIA
// PUT /api/multimedia/:id/aprobar
// -------------------------------------------------------------------
export const aprobarMultimedia = async (req, res) => {
  const { id } = req.params; // id_multimedia

  try {
    await pool
      .promise()
      .query(
        "UPDATE Multimedia SET estado_moderacion = 'aprobada' WHERE id_multimedia = ?",
        [id]
      );

    return res.json({
      ok: true,
      message: "Multimedia aprobada",
    });
  } catch (error) {
    console.error("Error al aprobar multimedia:", error);
    return res.status(500).json({
      ok: false,
      message: "Error interno al aprobar multimedia",
    });
  }
};

// -------------------------------------------------------------------
// RECHAZAR MULTIMEDIA
// PUT /api/multimedia/:id/rechazar
// -------------------------------------------------------------------
export const rechazarMultimedia = async (req, res) => {
  const { id } = req.params; // id_multimedia

  try {
    await pool
      .promise()
      .query(
        "UPDATE Multimedia SET estado_moderacion = 'rechazada' WHERE id_multimedia = ?",
        [id]
      );

    return res.json({
      ok: true,
      message: "Multimedia rechazada",
    });
  } catch (error) {
    console.error("Error al rechazar multimedia:", error);
    return res.status(500).json({
      ok: false,
      message: "Error interno al rechazar multimedia",
    });
  }
};

// -------------------------------------------------------------------
// LISTAR MULTIMEDIA DE UNA RESEÑA
// GET /api/resenas/:id/multimedia?soloAprobadas=true
// -------------------------------------------------------------------
export const getMultimediaByResena = async (req, res) => {
  const { id } = req.params;           // id_resena
  const { soloAprobadas } = req.query; // "true" | undefined

  try {
    let sql = `
      SELECT 
        id_multimedia,
        tipo,
        url,
        descripcion,
        id_excursion,
        id_usuario,
        id_turista,
        id_resena,
        estado_moderacion
      FROM Multimedia
      WHERE id_resena = ?
        AND eliminado = 0
        AND tipo = 'foto'
    `;
    const params = [id];

    if (soloAprobadas === "true") {
      sql += ` AND estado_moderacion = 'aprobada'`;
    }

    sql += ` ORDER BY id_multimedia DESC`;

    const [rows] = await pool.promise().query(sql, params);

    return res.json({
      ok: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error al obtener multimedia por reseña:", error);
    return res.status(500).json({
      ok: false,
      message: "Error interno al obtener multimedia de la reseña",
    });
  }
};

// -------------------------------------------------------------------
// ELIMINAR MULTIMEDIA (BORRADO LÓGICO)
// PUT /api/multimedia/:id/eliminar
// -------------------------------------------------------------------
export const eliminarMultimedia = async (req, res) => {
  const { id } = req.params; // id_multimedia

  try {
    const [result] = await pool
      .promise()
      .query(
        `
        UPDATE Multimedia 
        SET eliminado = 1, fecha_eliminacion = NOW()
        WHERE id_multimedia = ?
      `,
        [id]
      );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        message: "Multimedia no encontrada",
      });
    }

    return res.json({
      ok: true,
      message: "Multimedia eliminada correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar multimedia:", error);
    return res.status(500).json({
      ok: false,
      message: "Error interno al eliminar multimedia",
    });
  }
};

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
// PUT /api/multimedia/comprobantes/:id/aprobar
// -------------------------------------------------------------------
export const aprobarComprobante = async (req, res) => {
  const { id } = req.params;

  try {
    await pool
      .promise()
      .query(
        "UPDATE Multimedia SET estado_moderacion = 'aprobada' WHERE id_multimedia = ? AND tipo='comprobante'",
        [id]
      );

    return res.json({ ok: true, message: "Comprobante aprobado" });
  } catch (error) {
    console.error("Error al aprobar comprobante:", error);
    return res.status(500).json({
      ok: false,
      message: "Error interno al aprobar comprobante",
    });
  }
};

// -------------------------------------------------------------------
// RECHAZAR COMPROBANTE
// PUT /api/multimedia/comprobantes/:id/rechazar
// -------------------------------------------------------------------
export const rechazarComprobante = async (req, res) => {
  const { id } = req.params;

  try {
    await pool
      .promise()
      .query(
        "UPDATE Multimedia SET estado_moderacion = 'rechazada' WHERE id_multimedia = ? AND tipo='comprobante'",
        [id]
      );

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
// PUT /api/multimedia/comprobantes/:id/eliminar
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

    return res.json({ ok: true, message: "Comprobante eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar comprobante:", error);
    return res.status(500).json({
      ok: false,
      message: "Error interno al eliminar comprobante",
    });
  }
};
