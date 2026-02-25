// back/controllers/carrito.controller.js
import { pool } from "../config/DB.js";

// =============================
// CARRITO
// =============================

// Obtener carrito de un turista (solo el abierto)
// Obtener carrito de un turista (solo el abierto, NO crea automáticamente)
export const getCarritoByTurista = async (req, res) => {
  const { id_turista } = req.params;

  try {
    const [results] = await pool.promise().query(
      `
      SELECT 
        c.id_carrito,
        c.estado,
        c.fecha_creacion
      FROM Carrito c
      INNER JOIN CarritoItems ci 
        ON ci.id_carrito = c.id_carrito
       AND ci.eliminado = 0
      WHERE c.id_turista = ?
        AND c.eliminado = 0
        AND c.estado = 'abierto'
      GROUP BY c.id_carrito
      ORDER BY c.id_carrito DESC
      LIMIT 1
      `,
      [id_turista],
    );

    // ✅ Si NO hay carrito válido → null
    if (results.length === 0) {
      return res.json(null);
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
  if (!id_turista) return res.status(400).json({ message: "Falta id_turista" });

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
    // 1️⃣ Traer fecha + excursión con precio real
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
      [id_fecha],
    );

    if (fechaRes.length === 0) {
      return res.status(404).json({ message: "Fecha no encontrada" });
    }

    const fecha = fechaRes[0];

    if (cantidad_personas > fecha.cupo_disponible) {
      return res.status(400).json({
        message: `Solo quedan ${fecha.cupo_disponible} lugares disponibles.`,
      });
    }

    // 2️⃣ Buscar carrito abierto VÁLIDO (con items activos)
    const [carritoRes] = await pool.promise().query(
      `
      SELECT c.id_carrito
      FROM Carrito c
      INNER JOIN CarritoItems ci 
        ON ci.id_carrito = c.id_carrito
       AND ci.eliminado = 0
      WHERE c.id_turista = ?
        AND c.estado = 'abierto'
        AND c.eliminado = 0
      GROUP BY c.id_carrito
      ORDER BY c.id_carrito DESC
      LIMIT 1
      `,
      [id_turista],
    );

    let id_carrito;

    // 3️⃣ Si no hay carrito válido → crear uno nuevo
    if (carritoRes.length === 0) {
      const [nuevoCarrito] = await pool.promise().query(
        `
        INSERT INTO Carrito (id_turista, estado)
        VALUES (?, 'abierto')
        `,
        [id_turista],
      );
      id_carrito = nuevoCarrito.insertId;
    } else {
      id_carrito = carritoRes[0].id_carrito;
    }

    const subtotal = fecha.precio * cantidad_personas;

    // 4️⃣ Insertar ítem
    await pool.promise().query(
      `
      INSERT INTO CarritoItems 
        (id_carrito, id_fecha, cantidad_personas, precio_unitario, subtotal)
      VALUES (?, ?, ?, ?, ?)
      `,
      [id_carrito, id_fecha, cantidad_personas, fecha.precio, subtotal],
    );

    res.json({
      message: "Excursión agregada al carrito",
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
      f.id_excursion,
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
export const deleteItemCarrito = async (req, res) => {
  const { id_item } = req.params;

  try {
    // 1 Obtener el id_carrito del item
    const [[item]] = await pool.promise().query(
      `
      SELECT id_carrito
      FROM CarritoItems
      WHERE id_item = ? AND eliminado = 0
      `,
      [id_item],
    );

    if (!item) {
      return res.status(404).json({ message: "Item no encontrado" });
    }

    const { id_carrito } = item;

    // 2 Eliminar el item (baja lógica)
    await pool.promise().query(
      `
      UPDATE CarritoItems
      SET eliminado = 1, fecha_eliminacion = NOW()
      WHERE id_item = ?
      `,
      [id_item],
    );

    // 3 Ver si quedaron items activos en el carrito
    const [[{ total }]] = await pool.promise().query(
      `
      SELECT COUNT(*) AS total
      FROM CarritoItems
      WHERE id_carrito = ? AND eliminado = 0
      `,
      [id_carrito],
    );

    // 4 Si no quedan items → cancelar el carrito
    if (total === 0) {
      await pool.promise().query(
        `
        UPDATE Carrito
        SET estado = 'cancelado'
        WHERE id_carrito = ? AND estado = 'abierto'
        `,
        [id_carrito],
      );
    }

    res.json({
      message:
        total === 0
          ? "Item eliminado y carrito cancelado"
          : "Item eliminado correctamente",
    });
  } catch (err) {
    console.error("❌ Error al eliminar item:", err);
    res.status(500).json({ message: "Error al eliminar item" });
  }
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
      [id_item],
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Ítem no encontrado o eliminado." });
    }

    const { id_fecha, cantidad_actual, cupo_disponible, precio_unitario } =
      rows[0];

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
      [nuevaCantidad, nuevoSubtotal, id_item],
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

//  Vaciar carrito luego de pagar
export const vaciarCarrito = async (req, res) => {
  const { id_turista } = req.params;

  try {
    const [carritoRows] = await pool.promise().query(
      `
      SELECT id_carrito
      FROM Carrito
      WHERE id_turista = ?
        AND estado = 'abierto'
        AND eliminado = 0
      ORDER BY id_carrito DESC
      LIMIT 1
      `,
      [id_turista]
    );

    if (carritoRows.length === 0) {
      return res.status(404).json({ message: "No hay carrito abierto para vaciar." });
    }

    const id_carrito = carritoRows[0].id_carrito;

    // baja lógica items
    await pool.promise().query(
      `
      UPDATE CarritoItems
      SET eliminado = 1, fecha_eliminacion = NOW()
      WHERE id_carrito = ? AND eliminado = 0
      `,
      [id_carrito]
    );

    // cerrar carrito (elegí el estado que uses)
    await pool.promise().query(
      `
      UPDATE Carrito
      SET estado = 'confirmado'
      WHERE id_carrito = ? AND estado = 'abierto' AND eliminado = 0
      `,
      [id_carrito]
    );

    return res.json({ ok: true, message: "Carrito vaciado", id_carrito });
  } catch (err) {
    console.error("❌ Error al vaciar carrito:", err);
    return res.status(500).json({ message: "Error al vaciar carrito." });
  }
};

// =============================
// CERRAR / CONFIRMAR CARRITO (uso interno - webhook)
// =============================

export const confirmarCarrito = async (id_carrito) => {
  if (!id_carrito) return;

  await pool.promise().query(
    `
    UPDATE Carrito
    SET estado = 'confirmado'
    WHERE id_carrito = ?
      AND estado = 'abierto'
      AND eliminado = 0
    `,
    [id_carrito],
  );
};
