import { pool } from "../config/DB.js";
import nodemailer from "nodemailer";

// =============================
// EXCURSIONES
// =============================

// Obtener todas las excursiones con sus categorías
export const getExcursiones = (req, res) => {
  const { 
    ubicacion, precio_min, precio_max, duracion, estado, q, categoria, 
    page = 1, limit = 10, mostrarArchivadas 
  } = req.query;

  const condiciones = [];
  const values = [];


  if (mostrarArchivadas === "true") {
    condiciones.push("e.eliminado = 1");
  } else {
    condiciones.push("e.eliminado = 0");

    if (!estado || estado === "todas") {
      condiciones.push("e.estado = 'activa'");
    }
  }


  if (estado && estado !== "todas") {
    condiciones.push("e.estado = ?");
    values.push(estado);
  }


  if (q) {
    condiciones.push("(e.titulo LIKE ? OR e.ubicacion LIKE ?)");
    values.push(`%${q}%`, `%${q}%`);
  }


  if (ubicacion) { condiciones.push("e.ubicacion LIKE ?"); values.push(`%${ubicacion}%`); }
  if (duracion) { condiciones.push("e.duracion LIKE ?"); values.push(`%${duracion}%`); }
  if (precio_min) { condiciones.push("e.precio_base >= ?"); values.push(precio_min); }
  if (precio_max) { condiciones.push("e.precio_base <= ?"); values.push(precio_max); }
  if (categoria) { condiciones.push("c.nombre_categoria = ?"); values.push(categoria); }

  const whereClause = condiciones.length > 0 ? `WHERE ${condiciones.join(" AND ")}` : "";


  const sqlCount = `
    SELECT COUNT(DISTINCT e.id_excursion) AS total 
    FROM Excursiones e
    LEFT JOIN ExcursionCategorias ec ON e.id_excursion = ec.id_excursion
    LEFT JOIN CategoriasExcursion c ON ec.id_categoria_excursion = c.id_categoria_excursion
    ${whereClause}
  `;

  pool.query(sqlCount, values, (err, countResult) => {
    if (err) return res.status(500).json({ message: "Error al contar excursiones" });

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / parseInt(limit));
    const offset = (parseInt(page) - 1) * parseInt(limit);


    const sqlData = `
      SELECT e.id_excursion, e.titulo, e.descripcion, e.precio_base, e.duracion,
             e.ubicacion, e.incluye, e.politicas, e.estado, e.fecha_creacion, e.eliminado,
             e.id_guia, u.nombre AS nombre_guia, u.apellido AS apellido_guia,
             c.id_categoria_excursion, c.nombre_categoria,
             (
               SELECT m.url 
               FROM Multimedia m 
               WHERE m.id_excursion = e.id_excursion 
                 AND m.eliminado = 0 
               ORDER BY m.id_multimedia ASC 
               LIMIT 1
             ) AS imagen_url
      FROM (
        SELECT DISTINCT e.id_excursion, e.fecha_creacion
        FROM Excursiones e
        LEFT JOIN ExcursionCategorias ec ON e.id_excursion = ec.id_excursion
        LEFT JOIN CategoriasExcursion c ON ec.id_categoria_excursion = c.id_categoria_excursion
        ${whereClause}
        ORDER BY e.fecha_creacion DESC
        LIMIT ? OFFSET ?
      ) as sub
      JOIN Excursiones e ON sub.id_excursion = e.id_excursion
      LEFT JOIN Usuarios u ON e.id_guia = u.id_usuario
      LEFT JOIN ExcursionCategorias ec ON e.id_excursion = ec.id_excursion
      LEFT JOIN CategoriasExcursion c ON ec.id_categoria_excursion = c.id_categoria_excursion
      ORDER BY e.fecha_creacion DESC
    `;

    pool.query(sqlData, [...values, parseInt(limit), offset], (err, results) => {
      if (err) return res.status(500).json({ message: "Error al obtener excursiones" });

      const agrupadas = {};
      results.forEach((row) => {
        if (!agrupadas[row.id_excursion]) {
          agrupadas[row.id_excursion] = {
            id_excursion: row.id_excursion,
            titulo: row.titulo,
            descripcion: row.descripcion,
            precio_base: row.precio_base,
            duracion: row.duracion,
            ubicacion: row.ubicacion,
            estado: row.estado,
            eliminado: row.eliminado,
            id_guia: row.id_guia,
            nombre_guia: row.nombre_guia,
            apellido_guia: row.apellido_guia,
            imagen_url: row.imagen_url, // <--- ¡Asegúrate de agregar esto aquí!
            categorias: [],
          };
        }
        if (row.id_categoria_excursion && row.nombre_categoria) {
          agrupadas[row.id_excursion].categorias.push({
            id_categoria_excursion: row.id_categoria_excursion,
            nombre_categoria: row.nombre_categoria,
          });
        }
      });

      res.json({
        data: Object.values(agrupadas),
        total,
        totalPages,
        currentPage: parseInt(page),
      });
    });
  });
};

export const getExcursionById = (req, res) => {
  const { id } = req.params;

  const sqlExcursion = `
    SELECT e.id_excursion, e.titulo, e.descripcion, e.precio_base, e.duracion,
           e.ubicacion, e.incluye, e.politicas, e.estado, e.fecha_creacion,
           e.id_guia, u.nombre AS nombre_guia, u.apellido AS apellido_guia,
           c.id_categoria_excursion, c.nombre_categoria
    FROM Excursiones e
    LEFT JOIN Usuarios u ON e.id_guia = u.id_usuario
    LEFT JOIN ExcursionCategorias ec ON e.id_excursion = ec.id_excursion
    LEFT JOIN CategoriasExcursion c ON ec.id_categoria_excursion = c.id_categoria_excursion
    WHERE e.id_excursion = ? AND e.eliminado = 0
  `;

  pool.query(sqlExcursion, [id], (err, results) => {
    if (err) {
      console.error("Error al obtener excursión:", err);
      return res.status(500).json({ message: "Error al obtener excursión" });
    }

    if (results.length === 0)
      return res.status(404).json({ message: "Excursión no encontrada" });


    const excursion = {
      id_excursion: results[0].id_excursion,
      titulo: results[0].titulo,
      descripcion: results[0].descripcion,
      precio_base: results[0].precio_base,
      duracion: results[0].duracion,
      ubicacion: results[0].ubicacion,
      incluye: results[0].incluye,
      politicas: results[0].politicas,
      estado: results[0].estado,
      fecha_creacion: results[0].fecha_creacion,
      id_guia: results[0].id_guia,
      nombre_guia: results[0].nombre_guia,
      apellido_guia: results[0].apellido_guia,
      categorias: [],
      imagenes: [],
    };


    results.forEach((row) => {
      if (row.id_categoria_excursion && row.nombre_categoria) {
        excursion.categorias.push({
          id_categoria_excursion: row.id_categoria_excursion,
          nombre_categoria: row.nombre_categoria,
        });
      }
    });


    const sqlImgs = `
  SELECT id_multimedia, url, descripcion, tipo
  FROM Multimedia
  WHERE id_excursion = ?
    AND eliminado = 0
    AND tipo = 'foto'
    AND estado_moderacion = 'aprobada'
`;

    pool.query(sqlImgs, [id], (errImgs, imgs) => {
      if (errImgs) {
        console.error("Error al obtener imágenes:", errImgs);
        return res.status(500).json({ message: "Error al obtener imágenes" });
      }


      excursion.imagenes = imgs || [];
      res.json(excursion);
    });
  });
};

export const createExcursion = (req, res) => {
  const {
    titulo,
    descripcion,
    precio_base,
    duracion,
    ubicacion,
    incluye,
    politicas,
    id_categoria_excursion, // puede venir si usás el flujo viejo
    id_guia, // guía opcional
  } = req.body;

  if (!titulo || !precio_base)
    return res.status(400).json({ message: "Faltan datos obligatorios" });

  const sql = `INSERT INTO Excursiones 
              (titulo, descripcion, precio_base, duracion, ubicacion, incluye, politicas, id_guia)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

  const values = [
    titulo,
    descripcion,
    precio_base,
    duracion,
    ubicacion,
    incluye,
    politicas,
    id_guia,
  ];

  pool.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error al crear excursión:", err);
      return res.status(500).json({ message: "Error al crear excursión" });
    }

    const id_excursion = result.insertId;

    if (id_categoria_excursion) {
      const sqlCat = `
        INSERT INTO ExcursionCategorias (id_excursion, id_categoria_excursion)
        VALUES (?, ?)
      `;
      pool.query(sqlCat, [id_excursion, id_categoria_excursion], (err2) => {
        if (err2) {
          console.error("Error al vincular categoría:", err2);
          return res.status(500).json({
            message: "Excursión creada pero no se pudo vincular categoría",
          });
        }
        res.status(201).json({
          message: "Excursión creada correctamente",
          id: id_excursion,
        });
      });
    } else {
      res.status(201).json({
        message: "Excursión creada correctamente",
        id: id_excursion,
      });
    }
  });
};

// Actualizar una excursión existente
export const updateExcursion = (req, res) => {
  const { id } = req.params;
  const {
    titulo,
    descripcion,
    precio_base,
    duracion,
    ubicacion,
    incluye,
    politicas,
    estado,
    id_guia,
  } = req.body;

  const guia = id_guia === "" ? null : id_guia; // ✅ convierte '' a NULL

  const sql = `
    UPDATE Excursiones
    SET titulo=?, descripcion=?, precio_base=?, duracion=?, ubicacion=?, 
        incluye=?, politicas=?, estado=?, id_guia=?
    WHERE id_excursion=? AND eliminado=0
  `;

  const values = [
    titulo,
    descripcion,
    precio_base,
    duracion,
    ubicacion,
    incluye,
    politicas,
    estado,
    guia,
    id,
  ];

  pool.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error al actualizar excursión:", err);
      return res.status(500).json({ message: "Error al actualizar excursión" });
    }
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Excursión no encontrada" });

    res.json({ message: "Excursión actualizada correctamente" });
  });
};

// Eliminar (baja lógica) una excursión
export const deleteExcursion = (req, res) => {
  const { id } = req.params;

  const sql = `UPDATE Excursiones
               SET eliminado=1, fecha_eliminacion=NOW()
               WHERE id_excursion=?`;

  pool.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error al eliminar excursión:", err);
      return res.status(500).json({ message: "Error al eliminar excursión" });
    }
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Excursión no encontrada" });
    res.json({ message: "Excursión eliminada (baja lógica) correctamente" });
  });
};

export const restoreExcursion = (req, res) => {
  const { id } = req.params;
  const sql = "UPDATE Excursiones SET eliminado = 0, fecha_eliminacion = NULL WHERE id_excursion = ?";
  
  pool.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ message: "Error al restaurar excursión" });
    if (result.affectedRows === 0) return res.status(404).json({ message: "Excursión no encontrada" });
    res.json({ message: "Excursión restaurada correctamente" });
  });
};

// =============================
// FECHAS DE EXCURSIÓN
// =============================

// Obtener todas las fechas para una excursión específica
export const getFechasByExcursion = (req, res) => {
  const { id_excursion } = req.params;

  const sql = `
    SELECT id_fecha, fecha, hora_salida, cupo_maximo, cupo_disponible, estado
    FROM FechasExcursion
    WHERE id_excursion = ? 
      AND eliminado = 0
      AND cupo_disponible > 0 
    ORDER BY fecha ASC
  `;

  pool.query(sql, [id_excursion], (err, results) => {
    if (err) {
      console.error("Error al obtener fechas de excursión:", err);
      return res.status(500).json({ message: "Error al obtener fechas" });
    }
    res.json(results);
  });
};

export const getFechaById = (req, res) => {
  const { id } = req.params;
  const sql = "SELECT * FROM FechasExcursion WHERE id_fecha = ?";
  pool.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error al obtener fecha:", err);
      return res.status(500).json({ message: "Error al obtener la fecha" });
    }
    if (result.length === 0) {
      return res.status(404).json({ message: "Fecha no encontrada" });
    }
    res.json(result[0]);
  });
};

export const createFechaExcursion = (req, res) => {
  const { id_excursion, fecha, hora_salida, cupo_maximo } = req.body;

  console.log("Datos recibidos:", req.body); // 👈 Agregá esto

  if (!id_excursion || !fecha || !cupo_maximo)
    return res.status(400).json({ message: "Faltan datos obligatorios" });

  const sql = `INSERT INTO FechasExcursion 
               (id_excursion, fecha, hora_salida, cupo_maximo, cupo_disponible)
               VALUES (?, ?, ?, ?, ?)`;
  const values = [id_excursion, fecha, hora_salida, cupo_maximo, cupo_maximo];

  pool.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error al crear fecha:", err); // 👈 Este log es clave
      return res.status(500).json({ message: "Error al crear fecha" });
    }
    res
      .status(201)
      .json({ message: "Fecha agregada correctamente", id: result.insertId });
  });
};

// Actualizar una fecha de excursión
export const updateFechaExcursion = (req, res) => {
  const { id } = req.params;
  const { fecha, hora_salida, cupo_maximo, cupo_disponible, estado } = req.body;

  if (!fecha && !hora_salida && !cupo_maximo && !cupo_disponible && !estado)
    return res
      .status(400)
      .json({ message: "No se enviaron datos para actualizar" });

  const fields = [];
  const values = [];

  if (fecha) {
    fields.push("fecha = ?");
    values.push(fecha);
  }
  if (hora_salida) {
    fields.push("hora_salida = ?");
    values.push(hora_salida);
  }
  if (cupo_maximo) {
    fields.push("cupo_maximo = ?");
    values.push(cupo_maximo);
  }
  if (cupo_disponible) {
    fields.push("cupo_disponible = ?");
    values.push(cupo_disponible);
  }
  if (estado) {
    fields.push("estado = ?");
    values.push(estado);
  }

  const sql = `UPDATE FechasExcursion SET ${fields.join(
    ", "
  )} WHERE id_fecha = ? AND eliminado = 0`;
  values.push(id);

  pool.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error al actualizar fecha de excursión:", err);
      return res.status(500).json({ message: "Error al actualizar fecha" });
    }
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Fecha no encontrada" });

    res.json({ message: "Fecha de excursión actualizada correctamente" });
  });
};

// Eliminar (baja lógica) una fecha de excursión
export const deleteFechaExcursion = (req, res) => {
  const { id } = req.params;

  const sql = `
    UPDATE FechasExcursion
    SET estado = 'cerrada', eliminado = 1, fecha_eliminacion = NOW()
    WHERE id_fecha = ?
  `;

  pool.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error al cerrar fecha:", err);
      return res.status(500).json({ message: "Error al cerrar la fecha" });
    }

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Fecha no encontrada" });

    res.json({ message: "Fecha cerrada correctamente" });
  });
};

export const getGuias = (req, res) => {
  const sql = `
    SELECT id_usuario, nombre, apellido
    FROM Usuarios
    WHERE id_rol = (
      SELECT id_rol FROM Roles WHERE nombre_rol = 'Guía turístico'
    ) AND estado = 'activo'
  `;

  pool.query(sql, (err, results) => {
    if (err) {
      console.error("Error al obtener guías turísticos:", err);
      return res
        .status(500)
        .json({ message: "Error al obtener guías turísticos" });
    }
    res.json(results);
  });
};

export const getExcursionesConFechas = (req, res) => {
  const sql = `
    SELECT e.id_excursion, e.titulo, e.ubicacion, e.precio_base, e.estado,
           f.id_fecha, f.fecha, f.hora_salida, f.cupo_maximo, f.cupo_disponible, f.estado AS estado_fecha
    FROM Excursiones e
    LEFT JOIN FechasExcursion f ON e.id_excursion = f.id_excursion AND f.eliminado = 0
    WHERE e.eliminado = 0
    ORDER BY e.fecha_creacion DESC, f.fecha ASC
  `;

  pool.query(sql, (err, results) => {
    if (err) {
      console.error("Error al obtener excursiones con fechas:", err);
      return res
        .status(500)
        .json({ message: "Error al obtener excursiones con fechas" });
    }

    const agrupadas = {};
    results.forEach((row) => {
      if (!agrupadas[row.id_excursion]) {
        agrupadas[row.id_excursion] = {
          id_excursion: row.id_excursion,
          titulo: row.titulo,
          ubicacion: row.ubicacion,
          precio_base: row.precio_base,
          estado: row.estado,
          fechas: [],
        };
      }

      if (row.id_fecha) {
        agrupadas[row.id_excursion].fechas.push({
          id_fecha: row.id_fecha,
          fecha: row.fecha,
          hora_salida: row.hora_salida,
          cupo_maximo: row.cupo_maximo,
          cupo_disponible: row.cupo_disponible,
          estado: row.estado_fecha,
        });
      }
    });

    res.json(Object.values(agrupadas));
  });
};
export const getTodasLasFechasPaginadas = (req, res) => {
  const { q, mostrarArchivadas, page = 1, limit = 10 } = req.query;
  const condiciones = [];
  const values = [];


  if (mostrarArchivadas === "true") {

    condiciones.push("(f.eliminado = 1 OR f.estado = 'cerrada')");
  } else {

    condiciones.push("f.eliminado = 0");
    condiciones.push("f.estado = 'abierta'");
    condiciones.push("f.fecha >= CURDATE()"); 
  }


  if (q) {
    condiciones.push("e.titulo LIKE ?");
    values.push(`%${q}%`);
  }

  const whereClause = condiciones.length > 0 ? `WHERE ${condiciones.join(" AND ")}` : "";
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const baseQuery = `
    FROM FechasExcursion f
    JOIN Excursiones e ON f.id_excursion = e.id_excursion
    ${whereClause}
  `;

  const sqlCount = `SELECT COUNT(*) AS total ${baseQuery}`;
  const sqlData = `
    SELECT 
      f.id_fecha, f.fecha, f.hora_salida, f.cupo_maximo, f.cupo_disponible, f.estado, f.eliminado,
      e.id_excursion, e.titulo AS excursion
    ${baseQuery}
    ORDER BY f.fecha ASC
    LIMIT ? OFFSET ?
  `;

  pool.query(sqlCount, values, (err, countResult) => {
    if (err) return res.status(500).json({ message: "Error al contar fechas" });

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / parseInt(limit));

    pool.query(sqlData, [...values, parseInt(limit), offset], (err, dataResult) => {
      if (err) return res.status(500).json({ message: "Error al obtener fechas" });

      res.json({
        data: dataResult,
        total,
        totalPages,
        currentPage: parseInt(page),
      });
    });
  });
};

// 🔹 NUEVO: Restaurar Fecha
export const restoreFechaExcursion = (req, res) => {
  const { id } = req.params;
  const sql = `
    UPDATE FechasExcursion
    SET estado = 'abierta', eliminado = 0, fecha_eliminacion = NULL
    WHERE id_fecha = ?
  `;
  pool.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ message: "Error al restaurar fecha" });
    if (result.affectedRows === 0) return res.status(404).json({ message: "Fecha no encontrada" });
    res.json({ message: "Fecha restaurada correctamente" });
  });
};

// =============================
// MULTIMEDIA (IMÁGENES DE EXCURSIONES)
// =============================

// Obtener todas las imágenes de una excursión
// Obtener imágenes visibles en la excursión (oficiales + turistas aprobadas)
export const getMultimediaByExcursion = (req, res) => {

  const id_excursion = req.params.id_excursion || req.params.id;

  if (!id_excursion) {
    return res.status(400).json({ message: "Falta id_excursion en la ruta" });
  }

  const sql = `
    SELECT 
      id_multimedia, 
      tipo, 
      url, 
      descripcion,
      id_excursion,
      id_resena,
      id_turista,
      estado_moderacion
    FROM Multimedia
    WHERE id_excursion = ?
      AND eliminado = 0
      AND tipo = 'foto'
      AND (
          estado_moderacion = 'aprobada'
          OR estado_moderacion IS NULL   -- imágenes oficiales antiguas
      )
    ORDER BY id_multimedia DESC
  `;

  pool.query(sql, [id_excursion], (err, results) => {
    if (err) {
      console.error("Error al obtener multimedia:", err);
      return res.status(500).json({ message: "Error al obtener imágenes" });
    }
    res.json(results);
  });
};


// Crear una nueva imagen (por URL) asociada a una excursión
// Crear una nueva imagen (por URL) asociada a una excursión (oficial, ya aprobada)
export const createMultimedia = (req, res) => {
  const { id_excursion, url, descripcion, tipo } = req.body;

  if (!id_excursion || !url) {
    return res
      .status(400)
      .json({ message: "Faltan datos obligatorios (id_excursion o url)" });
  }

  const sql = `
    INSERT INTO Multimedia (id_excursion, tipo, url, descripcion, estado_moderacion)
    VALUES (?, ?, ?, ?, 'aprobada')
  `;

  pool.query(
    sql,
    [id_excursion, tipo || "foto", url, descripcion || null],
    (err, result) => {
      if (err) {
        console.error("Error al crear multimedia:", err);
        return res.status(500).json({ message: "Error al crear multimedia" });
      }

      res.status(201).json({
        message: "Imagen agregada correctamente",
        id_multimedia: result.insertId,
      });
    }
  );
};

// Eliminar (baja lógica) una imagen de una excursión

export const deleteMultimedia = (req, res) => {
  const { id } = req.params;
  const sql = `UPDATE Multimedia SET eliminado = 1, fecha_eliminacion = NOW() WHERE id_multimedia = ?`;

  pool.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error al eliminar imagen:", err);
      return res.status(500).json({ message: "Error al eliminar imagen" });
    }
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Imagen no encontrada" });

    res.json({ message: "Imagen eliminada correctamente" });
  });
};

// =============================
// OTROS
// =============================
export const getExcursionesPorGuia = async (req, res) => {
  const { id_guia } = req.params;

  try {
    const [rows] = await pool.promise().query(
      `SELECT 
         e.id_excursion,
         e.titulo,
         e.ubicacion,
         e.estado,
         (
           SELECT MIN(fecha)
           FROM FechasExcursion f
           WHERE f.id_excursion = e.id_excursion AND f.estado = 'abierta'
         ) AS proxima_fecha
       FROM Excursiones e
       WHERE e.id_guia = ? AND e.eliminado = 0`,
      [id_guia]
    );

    res.json(rows);
  } catch (err) {
    console.error("❌ Error al obtener excursiones del guía:", err);
    res.status(500).json({ message: "Error interno al obtener excursiones" });
  }
};

export const getParticipantesByExcursion = (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT 
      t.id_usuario AS id_turista,
      t.nombre,
      t.apellido,
      t.email,
      r.id_reserva,
      r.cantidad_personas,
      r.estado_reserva,
      DATE_FORMAT(f.fecha, '%Y-%m-%d') AS fecha_salida,
      f.hora_salida
    FROM Reservas r
    JOIN Usuarios t ON r.id_turista = t.id_usuario
    JOIN FechasExcursion f ON r.id_fecha = f.id_fecha
    WHERE f.id_excursion = ? AND r.eliminado = 0
    ORDER BY f.fecha ASC
  `;

  pool.query(sql, [id], (err, results) => {
    if (err) {
      console.error("Error al obtener participantes:", err.message);
      return res
        .status(500)
        .json({
          message: "Error al obtener participantes",
          error: err.message,
        });
    }
    res.json(results);
  });
};

export const notificarGuia = async (req, res) => {
  const { id_excursion } = req.params;
  const { fecha, id_fecha } = req.body;

  try {

    const [rows] = await pool.promise().query(
      `SELECT e.titulo, e.ubicacion, u.email, u.nombre
       FROM Excursiones e
       JOIN Usuarios u ON e.id_guia = u.id_usuario
       WHERE e.id_excursion = ?`,
      [id_excursion]
    );

    if (rows.length === 0 || !rows[0].email) {
      return res
        .status(404)
        .json({ message: "No se encontró el email del guía" });
    }

    const { titulo, ubicacion, email, nombre } = rows[0];
    const fechaFormateada = new Date(fecha).toLocaleDateString("es-AR");


    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });


    await transporter.sendMail({
      from: `"MAAVYT Panel" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Nueva excursión asignada",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
          <h2 style="color: #2c3e50;">📌 Nueva excursión asignada</h2>
          <p>Hola <strong>${nombre}</strong>,</p>
          <p>Se te ha asignado una nueva excursión. Aquí están los detalles:</p>
          <table style="border-collapse: collapse; width: 100%; margin-top: 10px;">
            <tr>
              <td style="padding: 8px; border: 1px solid #ccc;"><strong>Título</strong></td>
              <td style="padding: 8px; border: 1px solid #ccc;">${titulo}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ccc;"><strong>Ubicación</strong></td>
              <td style="padding: 8px; border: 1px solid #ccc;">${ubicacion}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ccc;"><strong>Fecha</strong></td>
              <td style="padding: 8px; border: 1px solid #ccc;">${fechaFormateada}</td>
            </tr>
          </table>
          <p style="margin-top: 20px;">Por favor, ingresá al panel para ver más detalles o confirmar tu disponibilidad.</p>
          <a href="https://maavyt.com/panel" style="display: inline-block; margin-top: 10px; padding: 10px 15px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px;">Ir al panel</a>
          <p style="margin-top: 30px; font-size: 12px; color: #888;">Este mensaje fue generado automáticamente por el sistema MAAVYT.</p>
        </div>
      `,
    });

    await pool
      .promise()
      .query(`UPDATE FechasExcursion SET notificado = 1 WHERE id_fecha = ?`, [
        id_fecha,
      ]);

    res.json({ message: "Correo enviado y fecha marcada como notificada" });
  } catch (err) {
    console.error("❌ Error al notificar guía:", err);
    res.status(500).json({ message: "Error al enviar correo" });
  }
};

// =============================
// CATEGORÍAS de una Excursión (múltiples)
// =============================
export const updateCategoriasExcursionMultiple = async (req, res) => {
  const { id } = req.params; // id de la excursión
  let { ids_categorias } = req.body; // array de ids

  if (!Array.isArray(ids_categorias)) {
    ids_categorias = [];
  }


  ids_categorias = ids_categorias.map((c) => Number(c)).filter(Boolean);

  try {

    await pool
      .promise()
      .query("DELETE FROM ExcursionCategorias WHERE id_excursion = ?", [id]);


    if (ids_categorias.length > 0) {
      const values = ids_categorias.map((idCat) => [id, idCat]);

      await pool
        .promise()
        .query(
          "INSERT INTO ExcursionCategorias (id_excursion, id_categoria_excursion) VALUES ?",
          [values]
        );
    }

    return res.json({
      ok: true,
      message: "Categorías actualizadas correctamente",
    });
  } catch (error) {
    console.error("Error actualizando categorías:", error);
    return res
      .status(500)
      .json({ ok: false, message: "Error al actualizar categorías" });
  }
};
