// back/controllers/carrito.controller.js
import { pool } from "../config/DB.js";

// =============================
// CARRITO
// =============================

// Obtener carrito de un turista (solo el abierto)
export const getCarritoByTurista = async (req, res) => {
  const { id_turista } = req.params;

  try {
    const [results] = await pool.promise().query(
      `
      SELECT c.id_carrito, c.estado, c.fecha_creacion
      FROM Carrito c
      WHERE c.id_turista = ? AND c.eliminado = 0
      ORDER BY c.id_carrito DESC
      LIMIT 1
      `,
      [id_turista]
    );

    // si no hay, lo creo
    if (results.length === 0) {
      const [insertResult] = await pool.promise().query(
        `
        INSERT INTO Carrito (id_turista, estado)
        VALUES (?, 'abierto')
        `,
        [id_turista]
      );

      return res.status(201).json({
        id_carrito: insertResult.insertId,
        estado: "abierto",
        fecha_creacion: new Date(),
        autoCreado: true,
      });
    }

    res.json(results[0]);
  } catch (err) {
    console.error("❌ Error al obtener carrito:", err);
    res.status(500).json({ message: "Error al obtener carrito" });
  }
};

// Crear carrito manual (casi no lo usás)
export const createCarrito = (req, res) => {
  const { id_turista } = req.body;
  if (!id_turista)
    return res.status(400).json({ message: "Falta id_turista" });

  const sql = `
    INSERT INTO Carrito (id_turista, estado)
    VALUES (?, 'abierto')
  `;
  pool.query(sql, [id_turista], (err, result) => {
    if (err) {
      console.error("Error al crear carrito:", err);
      return res.status(500).json({ message: "Error al crear carrito" });
    }
    res
      .status(201)
      .json({ message: "Carrito creado correctamente", id: result.insertId });
  });
};

// =============================
// AGREGAR ITEM (con cupos y precio real)
// =============================
export const addItemCarrito = async (req, res) => {
  const { id_turista, id_fecha, cantidad_personas } = req.body;

  try {
    // 1. Traer la fecha + excursión con precio real
    const [fechaRes] = await pool.promise().query(
      `
      SELECT 
        f.id_excursion,
        f.cupo_maximo,
        f.cupo_disponible,
        CASE 
          WHEN f.precio IS NOT NULL AND f.precio > 0 THEN f.precio
          ELSE e.precio_base
        END AS precio,
        e.titulo
      FROM FechasExcursion f
      JOIN Excursiones e ON f.id_excursion = e.id_excursion
      WHERE f.id_fecha = ? AND f.eliminado = 0
      `,
      [id_fecha]
    );

    if (fechaRes.length === 0) {
      return res.status(404).json({ message: "Fecha no encontrada" });
    }

    const fecha = fechaRes[0];

    // Validar que hay cupos disponibles
    if (cantidad_personas > fecha.cupo_disponible) {
      return res
        .status(400)
        .json({
          message: `Solo quedan ${fecha.cupo_disponible} lugares disponibles.`,
        });
    }

    // 2. Buscar o crear carrito abierto
    const [carritoRes] = await pool
      .promise()
      .query(
        "SELECT id_carrito FROM Carrito WHERE id_turista = ? AND estado = 'abierto'",
        [id_turista]
      );

    let id_carrito;
    if (carritoRes.length > 0) {
      id_carrito = carritoRes[0].id_carrito;
    } else {
      const [nuevoCarrito] = await pool
        .promise()
        .query(
          "INSERT INTO Carrito (id_turista, estado) VALUES (?, 'abierto')",
          [id_turista]
        );
      id_carrito = nuevoCarrito.insertId;
    }

    const subtotal = fecha.precio * cantidad_personas;

    // 3. Insertar ítem (sin tocar cupos todavía)
    await pool.promise().query(
      `
      INSERT INTO CarritoItems 
        (id_carrito, id_fecha, cantidad_personas, precio_unitario, subtotal)
      VALUES (?, ?, ?, ?, ?)
      `,
      [id_carrito, id_fecha, cantidad_personas, fecha.precio, subtotal]
    );

    res.json({
      message: "Excursión agregada al carrito (sin afectar cupos)",
      subtotal,
      precio_unitario: fecha.precio,
      titulo: fecha.titulo,
    });
  } catch (err) {
    console.error("❌ Error al agregar item al carrito:", err);
    res.status(500).json({ message: "Error al agregar item al carrito" });
  }
};


// =============================
// OBTENER ITEMS DEL CARRITO
// =============================
export const getItemsCarrito = (req, res) => {
  const { id_carrito } = req.params;

  const sql = `
    SELECT 
      ci.id_item,
      ci.id_fecha,
      e.titulo AS excursion,
      f.fecha,
      f.cupo_disponible,
      -- mismo criterio de precio que al insertar
      CASE 
        WHEN ci.precio_unitario IS NOT NULL AND ci.precio_unitario > 0 THEN ci.precio_unitario
        WHEN f.precio IS NOT NULL AND f.precio > 0 THEN f.precio
        ELSE e.precio_base
      END AS precio_unitario,
      ci.cantidad_personas,
      -- si el subtotal quedó en 0 lo recalculo acá
      CASE 
        WHEN ci.subtotal IS NOT NULL AND ci.subtotal > 0 THEN ci.subtotal
        ELSE (ci.cantidad_personas * (
          CASE 
            WHEN ci.precio_unitario IS NOT NULL AND ci.precio_unitario > 0 THEN ci.precio_unitario
            WHEN f.precio IS NOT NULL AND f.precio > 0 THEN f.precio
            ELSE e.precio_base
          END
        ))
      END AS subtotal
    FROM CarritoItems ci
    JOIN FechasExcursion f ON ci.id_fecha = f.id_fecha
    JOIN Excursiones e ON f.id_excursion = e.id_excursion
    WHERE ci.id_carrito = ? AND ci.eliminado = 0
  `;

  pool.query(sql, [id_carrito], (err, results) => {
    if (err) {
      console.error("❌ Error al obtener items del carrito:", err);
      return res.status(500).json({ message: "Error al obtener items" });
    }
    res.json(results);
  });
};

// =============================
// ELIMINAR ITEM
// =============================
export const deleteItemCarrito = (req, res) => {
  const { id_item } = req.params;
  const sql = `
    UPDATE CarritoItems
    SET eliminado = 1, fecha_eliminacion = NOW()
    WHERE id_item = ?
  `;
  pool.query(sql, [id_item], (err, result) => {
    if (err) {
      console.error("Error al eliminar item:", err);
      return res.status(500).json({ message: "Error al eliminar item" });
    }
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Item no encontrado" });
    res.json({ message: "Item eliminado (baja lógica) correctamente" });
  });
};


export const updateCantidadItem = async (req, res) => {
  const { id_item } = req.params;
  const { cantidad_personas } = req.body;

  try {
    // 1️⃣ Validar entrada correctamente
    const nuevaCantidad = Number(cantidad_personas);

    // Si llega NaN o 0 o negativo, no permitimos continuar
    if (!Number.isFinite(nuevaCantidad) || nuevaCantidad <= 0) {
      return res.status(400).json({ message: "Cantidad inválida." });
    }

    // 2️⃣ Traer el item y su info
    const [rows] = await pool.promise().query(
      `
      SELECT 
        ci.id_fecha,
        ci.cantidad_personas AS cantidad_actual,
        f.cupo_disponible,
        CASE 
          WHEN ci.precio_unitario IS NOT NULL AND ci.precio_unitario > 0 THEN ci.precio_unitario
          WHEN f.precio IS NOT NULL AND f.precio > 0 THEN f.precio
          ELSE e.precio_base
        END AS precio_unitario
      FROM CarritoItems ci
      JOIN FechasExcursion f ON ci.id_fecha = f.id_fecha
      JOIN Excursiones e ON f.id_excursion = e.id_excursion
      WHERE ci.id_item = ? AND ci.eliminado = 0
      `,
      [id_item]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Ítem no encontrado o eliminado." });
    }

    const {
      id_fecha,
      cantidad_actual,
      cupo_disponible,
      precio_unitario,
    } = rows[0];

    // 3️⃣ Calcular el cupo real disponible
    const cupoReal = (cupo_disponible ?? 0) + cantidad_actual;

    if (nuevaCantidad > cupoReal) {
      return res.status(400).json({
        message: `Solo quedan ${cupoReal} lugares disponibles.`,
      });
    }

    // 4️⃣ Calcular subtotal
    const nuevoSubtotal = nuevaCantidad * (precio_unitario ?? 0);

    // 5️⃣ Actualizar el item sin tocar los cupos todavía
    await pool.promise().query(
      `
      UPDATE CarritoItems
      SET cantidad_personas = ?, subtotal = ?
      WHERE id_item = ? AND eliminado = 0
      `,
      [nuevaCantidad, nuevoSubtotal, id_item]
    );

    res.json({
      message: "Cantidad actualizada correctamente (sin afectar cupos)",
      id_item,
      nuevaCantidad,
      nuevoSubtotal,
    });
  } catch (error) {
    console.error("❌ Error al actualizar cantidad del item:", error);
    res.status(500).json({ message: "Error al actualizar cantidad del item" });
  }
};
