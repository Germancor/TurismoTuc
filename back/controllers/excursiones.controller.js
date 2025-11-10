import { pool } from "../config/DB.js";

// =============================
// EXCURSIONES
// =============================

// Obtener todas las excursiones con sus categorías
export const getExcursiones = (req, res) => {
  const { ubicacion, precio_min, precio_max, duracion, estado, q, categoria } = req.query;

  let sql = `
    SELECT e.id_excursion, e.titulo, e.descripcion, e.precio_base, e.duracion,
           e.ubicacion, e.incluye, e.politicas, e.estado, e.fecha_creacion,
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
    FROM Excursiones e
    LEFT JOIN Usuarios u ON e.id_guia = u.id_usuario
    LEFT JOIN ExcursionCategorias ec ON e.id_excursion = ec.id_excursion
    LEFT JOIN CategoriasExcursion c ON ec.id_categoria_excursion = c.id_categoria_excursion
    WHERE e.eliminado = 0
  `;

  const values = [];

  if (q) {
    sql += " AND (e.titulo LIKE ? OR e.ubicacion LIKE ?)";
    values.push(`%${q}%`, `%${q}%`);
  }

  if (ubicacion) {
    sql += " AND e.ubicacion LIKE ?";
    values.push(`%${ubicacion}%`);
  }

  if (duracion) {
    sql += " AND e.duracion LIKE ?";
    values.push(`%${duracion}%`);
  }

  if (precio_min) {
    sql += " AND e.precio_base >= ?";
    values.push(precio_min);
  }

  if (precio_max) {
    sql += " AND e.precio_base <= ?";
    values.push(precio_max);
  }

  if (estado) {
    sql += " AND e.estado = ?";
    values.push(estado);
  }

  if (categoria) {
    sql += " AND c.nombre_categoria = ?";
    values.push(categoria);
  }

  sql += " ORDER BY e.fecha_creacion DESC";

  pool.query(sql, values, (err, results) => {
    if (err) {
      console.error("Error al obtener excursiones:", err);
      return res.status(500).json({ message: "Error al obtener excursiones" });
    }

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
          incluye: row.incluye,
          politicas: row.politicas,
          estado: row.estado,
          fecha_creacion: row.fecha_creacion,
          id_guia: row.id_guia,
          nombre_guia: row.nombre_guia,
          apellido_guia: row.apellido_guia,
          imagen_url: row.imagen_url,
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

    res.json(Object.values(agrupadas));
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

    // Estructura base
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

    // Agregar categorías
    results.forEach((row) => {
      if (row.id_categoria_excursion && row.nombre_categoria) {
        excursion.categorias.push({
          id_categoria_excursion: row.id_categoria_excursion,
          nombre_categoria: row.nombre_categoria,
        });
      }
    });

    // Traer imágenes relacionadas
    const sqlImgs = `
      SELECT id_multimedia, url, descripcion, tipo
      FROM Multimedia
      WHERE id_excursion = ? AND eliminado = 0
    `;

    pool.query(sqlImgs, [id], (errImgs, imgs) => {
      if (errImgs) {
        console.error("Error al obtener imágenes:", errImgs);
        return res.status(500).json({ message: "Error al obtener imágenes" });
      }

      // Si no hay imágenes, dejamos el array vacío
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
    id_categoria_excursion,
    id_guia, // ✅ nuevo campo
  } = req.body;

  if (!titulo || !precio_base)
    return res.status(400).json({ message: "Faltan datos obligatorios" });

  const sql = `INSERT INTO Excursiones 
              (titulo, descripcion, precio_base, duracion, ubicacion, incluye, politicas, id_guia)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`; // ✅ agregamos id_guia

  const values = [titulo, descripcion, precio_base, duracion, ubicacion, incluye, politicas, id_guia];

  pool.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error al crear excursión:", err);
      return res.status(500).json({ message: "Error al crear excursión" });
    }

    const id_excursion = result.insertId;

    if (id_categoria_excursion) {
      const sqlCat = `INSERT INTO ExcursionCategorias (id_excursion, id_categoria_excursion) VALUES (?, ?)`;
      pool.query(sqlCat, [id_excursion, id_categoria_excursion], (err2) => {
        if (err2) {
          console.error("Error al vincular categoría:", err2);
          return res.status(500).json({ message: "Excursión creada pero no se pudo vincular categoría" });
        }
        res.status(201).json({ message: "Excursión creada correctamente", id: id_excursion });
      });
    } else {
      res.status(201).json({ message: "Excursión creada correctamente", id: id_excursion });
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

// =============================
// FECHAS DE EXCURSIÓN
// =============================

// Obtener todas las fechas para una excursión específica
export const getFechasByExcursion = (req, res) => {
  const { id_excursion } = req.params;

  const sql = `SELECT id_fecha, fecha, hora_salida, cupo_maximo, cupo_disponible, estado
               FROM FechasExcursion
               WHERE id_excursion = ? AND eliminado = 0
               ORDER BY fecha ASC`;

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
    res.status(201).json({ message: "Fecha agregada correctamente", id: result.insertId });
  });
};

// Actualizar una fecha de excursión
export const updateFechaExcursion = (req, res) => {
  const { id } = req.params;
  const { fecha, hora_salida, cupo_maximo, cupo_disponible, estado } = req.body;

  if (!fecha && !hora_salida && !cupo_maximo && !cupo_disponible && !estado)
    return res.status(400).json({ message: "No se enviaron datos para actualizar" });

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

  const sql = `UPDATE FechasExcursion SET ${fields.join(", ")} WHERE id_fecha = ? AND eliminado = 0`;
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
  const sql = "DELETE FROM FechasExcursion WHERE id_fecha = ?";
  pool.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error al eliminar fecha:", err);
      return res.status(500).json({ message: "Error al eliminar la fecha" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Fecha no encontrada" });
    }
    res.json({ message: "Fecha eliminada correctamente" });
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
      return res.status(500).json({ message: "Error al obtener guías turísticos" });
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
      return res.status(500).json({ message: "Error al obtener excursiones con fechas" });
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


// =============================
// MULTIMEDIA (IMÁGENES DE EXCURSIONES)
// =============================

// Obtener todas las imágenes de una excursión
export const getMultimediaByExcursion = (req, res) => {
  const { id_excursion } = req.params;

  const sql = `
    SELECT id_multimedia, tipo, url, descripcion
    FROM Multimedia
    WHERE id_excursion = ? AND eliminado = 0
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
export const createMultimedia = (req, res) => {
  const { id_excursion, url, descripcion, tipo } = req.body;

  if (!id_excursion || !url) {
    return res.status(400).json({ message: "Faltan datos obligatorios (id_excursion o url)" });
  }

  const sql = `
    INSERT INTO Multimedia (id_excursion, tipo, url, descripcion)
    VALUES (?, ?, ?, ?)
  `;

  pool.query(sql, [id_excursion, tipo || "foto", url, descripcion || null], (err, result) => {
    if (err) {
      console.error("Error al crear multimedia:", err);
      return res.status(500).json({ message: "Error al crear multimedia" });
    }

    res.status(201).json({
      message: "Imagen agregada correctamente",
      id_multimedia: result.insertId,
    });
  });
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


export const getExcursionesPorGuia = (req, res) => {
  const { id_guia } = req.params;

  const sql = `
    SELECT e.id_excursion, e.titulo, e.ubicacion, e.precio_base, e.estado, e.fecha_creacion
    FROM Excursiones e
    WHERE e.id_guia = ? AND e.eliminado = 0
    ORDER BY e.fecha_creacion DESC
  `;

  pool.query(sql, [id_guia], (err, results) => {
    if (err) {
      console.error("Error al obtener excursiones del guía:", err);
      return res.status(500).json({ message: "Error al obtener excursiones del guía" });
    }
    res.json(results);
  });
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
      return res.status(500).json({ message: "Error al obtener participantes", error: err.message });
    }
    res.json(results);
  });
};
