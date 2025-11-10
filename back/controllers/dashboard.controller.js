// controllers/dashboard.controller.js
import { pool } from "../config/DB.js";

// =============================
// MÉTRICAS GENERALES DEL DASHBOARD
// =============================
export const getMetricas = (req, res) => {
  const sql = `
    SELECT
      /* Reservas de HOY (por fecha_reserva de la reserva) */
      (SELECT COUNT(*)
       FROM Reservas r
       WHERE DATE(r.fecha_reserva) = CURDATE()
         AND r.eliminado = 0) AS reservas_hoy,

      /* Reservas PRÓXIMAS (por fecha del tour en FechasExcursion) */
      (SELECT COUNT(*)
       FROM Reservas r
       JOIN FechasExcursion f ON r.id_fecha = f.id_fecha
       WHERE f.fecha > CURDATE()
         AND r.eliminado = 0) AS reservas_proximas,

      /* Ocupación total = personas reservadas / cupos totales */
      ROUND(
        IFNULL(
          (SELECT SUM(r.cantidad_personas) FROM Reservas r WHERE r.eliminado = 0), 0
        ) / NULLIF(
          (SELECT SUM(f.cupo_maximo) FROM FechasExcursion f WHERE f.eliminado = 0), 0
        ) * 100, 1
      ) AS ocupacion,

      /* Rating promedio solo de reseñas publicadas */
      IFNULL(ROUND((
        SELECT AVG(rz.calificacion)
        FROM \`Reseñas\` rz
        WHERE rz.eliminado = 0
          AND rz.estado = 'publicada'
      ), 1), 0) AS rating_promedio
    FROM DUAL;
  `;

  pool.query(sql, (err, results) => {
    if (err) {
      console.error("Error al obtener métricas:", err);
      return res.status(500).json({ message: "Error al obtener métricas" });
    }
    res.json(results[0]);
  });
};
// =============================
// RESERVAS DE HOY
// =============================
export const getReservasHoy = (req, res) => {
  const sql = `
    SELECT r.id_reserva, t.nombre AS turista, e.titulo AS excursion,
           f.fecha AS fecha_excursion, f.hora_salida, 
           r.cantidad_personas, r.estado_reserva, r.fecha_reserva
    FROM Reservas r
    JOIN Turistas t ON r.id_turista = t.id_turista
    JOIN FechasExcursion f ON r.id_fecha = f.id_fecha
    JOIN Excursiones e ON f.id_excursion = e.id_excursion
    WHERE DATE(r.fecha_reserva) = CURDATE() AND r.eliminado = 0
    ORDER BY r.fecha_reserva DESC;
  `;

  pool.query(sql, (err, results) => {
    if (err) {
      console.error("Error al obtener reservas del día:", err);
      return res.status(500).json({ message: "Error al obtener reservas del día" });
    }
    res.json(results);
  });
};

// =============================
// RESERVAS FUTURAS (PRÓXIMAS)
// =============================
export const getReservasProximas = (req, res) => {
  const sql = `
    SELECT r.id_reserva, t.nombre AS turista, e.titulo AS excursion,
           f.fecha, f.hora_salida, r.cantidad_personas, r.estado_reserva
    FROM Reservas r
    JOIN Turistas t ON r.id_turista = t.id_turista
    JOIN FechasExcursion f ON r.id_fecha = f.id_fecha
    JOIN Excursiones e ON f.id_excursion = e.id_excursion
    WHERE f.fecha > CURDATE() AND r.eliminado = 0
    ORDER BY f.fecha ASC;
  `;

  pool.query(sql, (err, results) => {
    if (err) {
      console.error("Error al obtener reservas futuras:", err);
      return res.status(500).json({ message: "Error al obtener reservas futuras" });
    }
    res.json(results);
  });
};
