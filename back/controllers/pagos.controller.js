import { pool } from "../config/DB.js";
import "dotenv/config.js";
import { preferenceClient , paymentClient} from "../config/mercadopago.js";



/* ============================================================
   💳 SIMULACIÓN LOCAL DE PAYWAY
   ============================================================ */
export const iniciarPagoPayway = async (req, res) => {
  const { id_reserva } = req.body;

  try {

    const [rows] = await pool.promise().query(
      `
      SELECT 
        r.id_reserva, r.monto_total, r.id_turista, r.cantidad_personas, r.id_fecha,
        t.email, t.nombre, t.apellido
      FROM Reservas r
      JOIN Turistas t ON r.id_turista = t.id_turista
      WHERE r.id_reserva = ?
      `,
      [id_reserva],
    );

    if (rows.length === 0)
      return res.status(404).json({ message: "Reserva no encontrada" });

    const reserva = rows[0];


    const fakePayment = {
      id: `sim-${Date.now()}`,
      status: "approved",
      amount: reserva.monto_total,
      currency: "ARS",
      site_transaction_id: `RES-${reserva.id_reserva}`,
      message: "Pago simulado localmente (sin conexión a Payway)",
    };


    await pool.promise().query(
      `
      INSERT INTO Pagos (id_reserva, id_medio_pago, monto, estado_pago, moneda)
      VALUES (
        ?, 
        (SELECT id_medio_pago FROM MediosPago WHERE nombre_medio='Payway' LIMIT 1), 
        ?, 
        'aprobado', 
        'ARS'
      )
      `,
      [id_reserva, reserva.monto_total],
    );


    await pool.promise().query(
      `
      UPDATE Reservas
      SET estado_reserva = 'confirmada'
      WHERE id_reserva = ?
      `,
      [id_reserva],
    );


    await pool.promise().query(
      `
      UPDATE FechasExcursion f
      JOIN Reservas r ON f.id_fecha = r.id_fecha
      SET f.cupo_disponible = GREATEST(f.cupo_disponible - r.cantidad_personas, 0)
      WHERE r.id_reserva = ? AND r.estado_reserva = 'confirmada'
      `,
      [id_reserva],
    );

    console.log(`✅ Pago simulado con éxito para la reserva ${id_reserva}`);


    const [carritos] = await pool.promise().query(
      `
      SELECT id_carrito
      FROM Carrito
      WHERE id_turista = ?
        AND estado = 'abierto'
        AND eliminado = 0
      `,
      [reserva.id_turista],
    );

    if (carritos.length > 0) {
      const idsCarritos = carritos.map((c) => c.id_carrito);


      await pool.promise().query(
        `
    UPDATE CarritoItems
    SET eliminado = 1,
        fecha_eliminacion = NOW()
    WHERE id_carrito IN (?)
      AND eliminado = 0
    `,
        [idsCarritos],
      );


      await pool.promise().query(
        `
    UPDATE Carrito
    SET estado = 'cerrado'
    WHERE id_carrito IN (?)
    `,
        [idsCarritos],
      );

      console.log("🧹 Carritos cerrados por Payway:", idsCarritos);
    }


    res.status(200).json({
      message: "Pago simulado correctamente (modo local)",
      data: {
        id_reserva: reserva.id_reserva,
        monto_total: reserva.monto_total,
        metodo: "Payway",
      },
    });
  } catch (error) {
    console.error("❌ Error al simular pago:", error);
    res.status(500).json({ message: "Error al simular pago" });
  }
};

/* ============================================================
   📦 CALLBACK SIMULADO PAYWAY
   ============================================================ */
export const callbackPayway = async (req, res) => {
  const { site_transaction_id, status } = req.body;

  if (!site_transaction_id)
    return res.status(400).json({ message: "Falta site_transaction_id" });

  const id_reserva = parseInt(site_transaction_id.replace("RES-", ""));
  const estadoPago = status === "approved" ? "aprobado" : "rechazado";
  const estadoReserva = status === "approved" ? "confirmada" : "cancelada";

  try {
    await pool.promise().query(
      `
      UPDATE Pagos p
      JOIN Reservas r ON p.id_reserva = r.id_reserva
      SET 
        p.estado_pago = ?, 
        r.estado_reserva = ?
      WHERE p.id_reserva = ?
      `,
      [estadoPago, estadoReserva, id_reserva],
    );


    if (estadoPago === "aprobado") {
      await pool.promise().query(
        `
        UPDATE FechasExcursion f
        JOIN Reservas r ON f.id_fecha = r.id_fecha
        SET f.cupo_disponible = GREATEST(f.cupo_disponible - r.cantidad_personas, 0)
        WHERE r.id_reserva = ?
        `,
        [id_reserva],
      );
    }

    console.log(`✅ Callback Payway: reserva ${id_reserva} → ${estadoPago}`);
    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Error en callback Payway:", error);
    res.sendStatus(500);
  }
};

/* ============================================================
   💰 TRANSFERENCIA / DEPÓSITO
   ============================================================ */
export const registrarTransferencia = async (req, res) => {
  const { id_reserva, referencia } = req.body;

  try {
    const [rows] = await pool.promise().query(
      `
      SELECT id_reserva, monto_total, id_turista
      FROM Reservas
      WHERE id_reserva = ? AND eliminado = 0
      `,
      [id_reserva],
    );

    if (rows.length === 0)
      return res.status(404).json({ message: "Reserva no encontrada" });

    const reserva = rows[0];

    await pool.promise().query(
      `
      INSERT INTO Pagos (id_reserva, id_medio_pago, monto, estado_pago, moneda, referencia)
      VALUES (
        ?,
        (SELECT id_medio_pago FROM MediosPago WHERE nombre_medio = 'Transferencia Bancaria' LIMIT 1),
        ?,
        'pendiente',
        'ARS',
        ?
      )
      `,
      [id_reserva, reserva.monto_total, referencia || null],
    );

    await pool.promise().query(
      `
      UPDATE Reservas
      SET estado_reserva = 'pendiente'
      WHERE id_reserva = ?
      `,
      [id_reserva],
    );

    console.log(`✅ Transferencia registrada para reserva ${id_reserva}`);

    res.status(201).json({
      message:
        "Transferencia registrada correctamente. Pendiente de verificación.",
      data: {
        id_reserva,
        monto_total: reserva.monto_total,
        metodo: "Transferencia/Depósito",
      },
    });
  } catch (error) {
    console.error("❌ Error al registrar transferencia:", error);
    res.status(500).json({ message: "Error al registrar transferencia" });
  }
};

/* ============================================================
   🧾 CRUD ADMIN DE PAGOS
   ============================================================ */

// 🟢 Obtener todos los pagos (con info del turista y método)
export const getPagos = async (req, res) => {
  const {
    estado, // opcional: 'todos', 'aprobado', 'pendiente', 'rechazado'
    fechaDesde,
    fechaHasta,
    page = 1,
    limit = 10,
  } = req.query;

  const condiciones = [];
  const params = [];

  if (estado && estado !== "todos") {
    condiciones.push(`p.estado_pago = ?`);
    params.push(estado);
  }

  if (fechaDesde) {
    condiciones.push(`DATE(p.fecha_pago) >= ?`);
    params.push(fechaDesde);
  }

  if (fechaHasta) {
    condiciones.push(`DATE(p.fecha_pago) <= ?`);
    params.push(fechaHasta);
  }

  const whereClause =
    condiciones.length > 0 ? `WHERE ${condiciones.join(" AND ")}` : "";
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const baseQuery = `
    FROM Pagos p
    LEFT JOIN MediosPago mp ON p.id_medio_pago = mp.id_medio_pago
    LEFT JOIN Reservas r ON p.id_reserva = r.id_reserva
    LEFT JOIN Turistas t ON r.id_turista = t.id_turista
    ${whereClause}
  `;
  const sqlCount = `SELECT COUNT(*) AS total ${baseQuery}`;
  const sqlData = `
    SELECT 
      p.id_pago,
      p.id_reserva,
      p.monto,
      p.estado_pago,
      p.moneda,
      p.referencia,
      p.fecha_pago,
      mp.nombre_medio AS metodo,
      t.nombre AS turista_nombre,
      t.apellido AS turista_apellido,
      r.estado_reserva
    ${baseQuery}
    ORDER BY p.fecha_pago DESC
    LIMIT ? OFFSET ?;
  `;

  const dataParams = [...params, parseInt(limit), parseInt(offset)];


  pool.query(sqlCount, params, (err, countResult) => {
    if (err) {
      console.error("Error al contar pagos:", err);
      return res.status(500).json({ message: "Error al contar pagos" });
    }

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / parseInt(limit));

    pool.query(sqlData, dataParams, (err, dataResult) => {
      if (err) {
        console.error("Error al obtener pagos:", err);
        return res.status(500).json({ message: "Error al obtener pagos" });
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

// 🟡 Actualizar estado del pago (confirmar/rechazar)
export const updatePagoEstado = async (req, res) => {
  const { id_pago } = req.params;
  const { nuevo_estado, referencia } = req.body;

  if (!["pendiente", "aprobado", "rechazado"].includes(nuevo_estado)) {
    return res.status(400).json({ message: "Estado inválido." });
  }

  try {
    const [rows] = await pool.promise().query(
      `
      SELECT 
        p.id_pago,
        p.estado_pago AS estado_actual,
        p.id_reserva,
        r.id_fecha,
        r.cantidad_personas
      FROM Pagos p
      INNER JOIN Reservas r ON p.id_reserva = r.id_reserva
      WHERE p.id_pago = ?
      `,
      [id_pago],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Pago no encontrado" });
    }

    const pago = rows[0];


    await pool.promise().query(
      `
      UPDATE Pagos
      SET estado_pago = ?, referencia = COALESCE(?, referencia)
      WHERE id_pago = ?
      `,
      [nuevo_estado, referencia, id_pago],
    );


    if (nuevo_estado === "aprobado" && pago.estado_actual !== "aprobado") {
      await pool.promise().query(
        `
        UPDATE FechasExcursion
        SET cupo_disponible = GREATEST(cupo_disponible - ?, 0)
        WHERE id_fecha = ? AND cupo_disponible >= ?
        `,
        [pago.cantidad_personas, pago.id_fecha, pago.cantidad_personas],
      );

      await pool.promise().query(
        `
        UPDATE Reservas
        SET estado_reserva = 'confirmada'
        WHERE id_reserva = ?
        `,
        [pago.id_reserva],
      );
    }


    if (nuevo_estado === "rechazado") {
      await pool.promise().query(
        `
        UPDATE Reservas
        SET estado_reserva = 'cancelada'
        WHERE id_reserva = ?
        `,
        [pago.id_reserva],
      );
    }

    res.json({ message: "Pago actualizado correctamente." });
  } catch (err) {
    console.error("❌ Error al actualizar pago:", err);
    res.status(500).json({ message: "Error al actualizar el pago" });
  }
};

// 🔴 Eliminar pago
export const deletePago = async (req, res) => {
  const { id_pago } = req.params;
  try {
    await pool
      .promise()
      .query(`DELETE FROM Pagos WHERE id_pago = ?`, [id_pago]);
    res.json({ message: "Pago eliminado correctamente." });
  } catch (err) {
    console.error("❌ Error al eliminar pago:", err);
    res.status(500).json({ message: "Error al eliminar pago" });
  }
};

/* ============================================================
   💳 SIMULACIÓN MERCADOPAGO
   ============================================================ */

export const crearPago = async (req, res) => {
  try {
    const { items, id_turista, reservas } = req.body;


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
      [id_turista],
    );

    if (carritoRows.length === 0) {
      return res.status(400).json({
        message: "No hay carrito abierto para crear el pago",
      });
    }

    const id_carrito = carritoRows[0].id_carrito;


    const preference = {
      items: items.map((item) => ({
        title: item.nombre,
        quantity: Number(item.cantidad),
        unit_price: Number(item.precio),
        currency_id: "ARS",
      })),
      external_reference: String(id_carrito),

      back_urls: {
        success:
          "https://epizootically-semitropical-jannie.ngrok-free.dev/pago-exitoso", // URL de éxito (frontend)
        failure:
          "https://epizootically-semitropical-jannie.ngrok-free.dev/pago-fallido",
        pending:
          "https://epizootically-semitropical-jannie.ngrok-free.dev/pago-pendiente",
      },

      notification_url:
        "https://epizootically-semitropical-jannie.ngrok-free.dev/api/pagos/webhook/mercadopago",


      metadata: {


        id_carrito,
      },
    };

    console.log(
      " Preference enviada a MP:",
      JSON.stringify(preference, null, 2),
    );

    console.log(" ENVIANDO PREFERENCIA A MERCADO PAGO:");
console.log(JSON.stringify(preference, null, 2));

const response = await preferenceClient.create({
  body: preference,
});

console.log(" RESPUESTA DE MERCADO PAGO:");
console.log(JSON.stringify(response, null, 2));
    const initPoint = response.init_point;

    if (!initPoint) {
      console.error(" init_point no encontrado", response);
      return res.status(500).json({
        message: "No se pudo obtener init_point",
      });
    }

    res.json({ init_point: initPoint });
  } catch (error) {
    console.error(" Error creando pago:", error);
    res.status(500).json({ message: error.message });
  }
};

export const webhookMercadoPago = async (req, res) => {
  try {
    console.log("====================================");
    console.log("📩 WEBHOOK MERCADO PAGO");
    console.log("📩 Headers:", req.headers);
    console.log("📩 Body:", req.body);
    console.log("====================================");

    const paymentId = req.body?.data?.id;
    if (!paymentId) {
      console.log("Webhook sin paymentId");
      return res.sendStatus(200);
    }
    const payment = await paymentClient.get({ id: paymentId });
    console.log("💳 Estado del pago:", payment.status);

    if (payment.status !== "approved") {
      return res.sendStatus(200);
    }

    const { id_carrito } = payment.metadata || {};
    if (!id_carrito) {
      console.error(" No llegó id_carrito en metadata");
      return res.sendStatus(200);
    }


    const connection = await pool.promise().getConnection();
    await connection.beginTransaction();

    try {

      const [carritoEstado] = await connection.query(
        `SELECT estado, id_turista FROM Carrito WHERE id_carrito = ? FOR UPDATE`,
        [id_carrito]
      );

      if (carritoEstado.length === 0) {
        console.error("❌ Carrito no encontrado");
        await connection.commit();
        connection.release();
        return res.sendStatus(200);
      }

      if (carritoEstado[0].estado === "cerrado") {
        console.log("⚠️ Carrito ya procesado previamente. Ignorando webhook duplicado.");
        await connection.commit();
        connection.release();
        return res.sendStatus(200);
      }

      const id_turista = carritoEstado[0].id_turista;


      const [items] = await connection.query(
        `SELECT * FROM CarritoItems WHERE id_carrito = ? AND eliminado = 0`,
        [id_carrito]
      );

      if (items.length === 0) {
        await connection.commit();
        connection.release();
        return res.sendStatus(200);
      }


      for (const item of items) {

        await connection.query(
          `INSERT INTO Reservas (id_fecha, id_turista, cantidad_personas, monto_total, estado_reserva)
           VALUES (?, ?, ?, ?, 'confirmada')`,
          [item.id_fecha, id_turista, item.cantidad_personas, item.subtotal]
        );


        await connection.query(
          `UPDATE FechasExcursion 
           SET cupo_disponible = cupo_disponible - ? 
           WHERE id_fecha = ?`,
          [item.cantidad_personas, item.id_fecha]
        );
      }


      await connection.query(
        `UPDATE Carrito SET estado = 'cerrado' WHERE id_carrito = ?`,
        [id_carrito]
      );


      await connection.query(
        `UPDATE CarritoItems SET eliminado = 1, fecha_eliminacion = NOW() WHERE id_carrito = ?`,
        [id_carrito]
      );


      await connection.commit();
      connection.release();
      
      console.log("✅ Reservas creadas y cupos descontados correctamente para carrito:", id_carrito);
      return res.sendStatus(200);

    } catch (dbError) {

      await connection.rollback();
      connection.release();
      console.error("🔥 Error en base de datos durante el webhook, se revirtieron los cambios:", dbError);
      return res.sendStatus(200); 
    }

  } catch (error) {
    console.error("🔥 ERROR REAL webhook MercadoPago:", error);
    return res.sendStatus(200);
  }
};


// export const webhookMercadoPago = async (req, res) => {
//   try {
//     console.log("====================================");
//     console.log(" WEBHOOK MERCADO PAGO");
//     console.log(" Body:", req.body);
//     console.log("====================================");

//     const { type, topic, data, resource } = req.body || {};

//     let paymentId = null;
//     let idCarrito = null;

//     // ============================================================
//     // 1 NOTIFICACIÓN DIRECTA DE PAYMENT
//     // ============================================================
//     if (type === "payment" && data?.id) {
//       paymentId = data.id;

//       console.log(" Notificación payment:", paymentId);
//     }

//     // ============================================================
//     // 2 NOTIFICACIÓN DE MERCHANT ORDER
//     // ============================================================
//     else if (topic === "merchant_order" && resource) {
//       console.log(" Notificación merchant_order");
//       console.log(" Resource:", resource);

//       const merchantOrderId = resource.split("/").pop();

//       console.log(" Merchant Order ID:", merchantOrderId);

//       // Consultar la merchant order
//       const merchantOrderResponse = await fetch(resource, {
//         headers: {
//           Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
//         },
//       });

//       if (!merchantOrderResponse.ok) {
//         console.error(
//           " Error consultando merchant_order:",
//           merchantOrderResponse.status
//         );

//         return res.sendStatus(200);
//       }

//       const merchantOrder = await merchantOrderResponse.json();

//       console.log(
//         "Merchant Order:",
//         JSON.stringify(merchantOrder, null, 2)
//       );

//       // Buscar un pago dentro de la orden
//       if (merchantOrder.payments?.length > 0) {
//         const approvedPayment = merchantOrder.payments.find(
//           (p) => p.status === "approved"
//         );

//         if (approvedPayment) {
//           paymentId = approvedPayment.id;

//           console.log(" Pago aprobado encontrado:", paymentId);
//         } else {
//           console.log(" Todavía no hay pago aprobado");
//           return res.sendStatus(200);
//         }
//       } else {
//         console.log(" La orden todavía no tiene pagos");
//         return res.sendStatus(200);
//       }

//       // external_reference contiene el id_carrito
//       if (merchantOrder.external_reference) {
//         idCarrito = Number(merchantOrder.external_reference);

//         console.log(" id_carrito desde external_reference:", idCarrito);
//       }
//     }

//     // ============================================================
//     // 3 SI NO PUDIMOS OBTENER PAYMENT ID
//     // ============================================================
//     if (!paymentId) {
//       console.log(" Webhook sin paymentId");
//       return res.sendStatus(200);
//     }

//     // ============================================================
//     // 4 CONSULTAR EL PAYMENT
//     // ============================================================
//     const payment = await paymentClient.get({
//       id: paymentId,
//     });

//     console.log(" Información del pago:");
//     console.log(JSON.stringify(payment, null, 2));

//     // ============================================================
//     // 5️ VERIFICAR QUE ESTÉ APROBADO
//     // ============================================================
//     if (payment.status !== "approved") {
//       console.log(
//         " Pago todavía no aprobado:",
//         payment.status
//       );

//       return res.sendStatus(200);
//     }

//     console.log(" PAGO APROBADO");

//     // ============================================================
//     // 6 OBTENER id_carrito
//     // ============================================================

//     if (!idCarrito) {
//       idCarrito =
//         payment.external_reference ||
//         payment.metadata?.id_carrito;
//     }

//     idCarrito = Number(idCarrito);

//     if (!idCarrito) {
//       console.error(" No se pudo obtener id_carrito");
//       return res.sendStatus(200);
//     }

//     console.log(" Procesando carrito:", idCarrito);

//     // ============================================================
//     // 7 TRANSACCIÓN MYSQL
//     // ============================================================

//     const connection = await pool.promise().getConnection();

//     await connection.beginTransaction();

//     try {
//       // ----------------------------------------------------------
//       // Buscar carrito
//       // ----------------------------------------------------------

//       const [carritoEstado] = await connection.query(
//         `
//         SELECT estado, id_turista
//         FROM Carrito
//         WHERE id_carrito = ?
//         FOR UPDATE
//         `,
//         [idCarrito]
//       );

//       if (carritoEstado.length === 0) {
//         console.error(" Carrito no encontrado:", idCarrito);

//         await connection.rollback();
//         connection.release();

//         return res.sendStatus(200);
//       }

//       // ----------------------------------------------------------
//       // Evitar procesar dos veces
//       // ----------------------------------------------------------

//       if (carritoEstado[0].estado === "cerrado") {
//         console.log(
//           " Carrito ya procesado. Ignorando webhook duplicado."
//         );

//         await connection.commit();
//         connection.release();

//         return res.sendStatus(200);
//       }

//       const idTurista = carritoEstado[0].id_turista;

//       // ----------------------------------------------------------
//       // Obtener items
//       // ----------------------------------------------------------

//       const [items] = await connection.query(
//         `
//         SELECT *
//         FROM CarritoItems
//         WHERE id_carrito = ?
//           AND eliminado = 0
//         `,
//         [idCarrito]
//       );

//       if (items.length === 0) {
//         console.log(" Carrito sin items");

//         await connection.commit();
//         connection.release();

//         return res.sendStatus(200);
//       }

//       console.log(
//         ` Items encontrados: ${items.length}`
//       );

//       // ----------------------------------------------------------
//       // Crear reservas
//       // ----------------------------------------------------------

//       for (const item of items) {
//         console.log(
//           " Creando reserva para fecha:",
//           item.id_fecha
//         );

//         await connection.query(
//           `
//           INSERT INTO Reservas
//           (
//             id_fecha,
//             id_turista,
//             cantidad_personas,
//             monto_total,
//             estado_reserva
//           )
//           VALUES (?, ?, ?, ?, 'confirmada')
//           `,
//           [
//             item.id_fecha,
//             idTurista,
//             item.cantidad_personas,
//             item.subtotal,
//           ]
//         );

//         // --------------------------------------------------------
//         // Descontar cupos
//         // --------------------------------------------------------

//         await connection.query(
//           `
//           UPDATE FechasExcursion
//           SET cupo_disponible = cupo_disponible - ?
//           WHERE id_fecha = ?
//           `,
//           [
//             item.cantidad_personas,
//             item.id_fecha,
//           ]
//         );
//       }

//       // ----------------------------------------------------------
//       // Cerrar carrito
//       // ----------------------------------------------------------

//       await connection.query(
//         `
//         UPDATE Carrito
//         SET estado = 'cerrado'
//         WHERE id_carrito = ?
//         `,
//         [idCarrito]
//       );

//       // ----------------------------------------------------------
//       // Eliminar lógicamente items
//       // ----------------------------------------------------------

//       await connection.query(
//         `
//         UPDATE CarritoItems
//         SET
//           eliminado = 1,
//           fecha_eliminacion = NOW()
//         WHERE id_carrito = ?
//         `,
//         [idCarrito]
//       );

//       // ----------------------------------------------------------
//       // Confirmar
//       // ----------------------------------------------------------

//       await connection.commit();

//       connection.release();

//       console.log("====================================");
//       console.log(" PAGO PROCESADO CORRECTAMENTE");
//       console.log(" Carrito:", idCarrito);
//       console.log(" Turista:", idTurista);
//       console.log(" Reservas creadas:", items.length);
//       console.log("====================================");

//       return res.sendStatus(200);

//     } catch (dbError) {
//       await connection.rollback();
//       connection.release();

//       console.error(
//         " Error DB. Se hizo rollback:",
//         dbError
//       );

//       return res.sendStatus(200);
//     }

//   } catch (error) {
//     console.error(
//       " ERROR REAL WEBHOOK MERCADO PAGO:",
//       error
//     );

//     return res.sendStatus(200);
//   }
// };
