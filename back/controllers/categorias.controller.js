import { pool } from "../config/DB.js";

// =============================
// CATEGORÍAS DE EXCURSIÓN
// =============================

// 🔹 Obtener todas las categorías activas
export const getCategoriasExcursion = (req, res) => {
    const sql = `
    SELECT id_categoria_excursion, nombre_categoria, icono, descripcion
    FROM CategoriasExcursion
    ORDER BY nombre_categoria ASC
  `;
  pool.query(sql, (err, results) => {
    if (err) {
        console.error("Error al obtener categorías:", err.message);
        return res.status(500).json({ message: "Error al obtener categorías", error: err.message });
    }
    res.json(results);
  });
};

// 🔹 Actualizar la categoría de una excursión
export const updateCategoriaExcursion = (req, res) => {
  const { id_excursion, id_categoria_excursion } = req.body;

  if (!id_excursion || !id_categoria_excursion) {
    return res.status(400).json({ message: "Faltan datos obligatorios" });
  }

  const deleteSql = `DELETE FROM ExcursionCategorias WHERE id_excursion = ?`;

  pool.query(deleteSql, [id_excursion], (err) => {
    if (err) {
      console.error("Error al eliminar categorías anteriores:", err);
      return res.status(500).json({ message: "Error al limpiar categorías anteriores" });
    }

    const insertSql = `
      INSERT INTO ExcursionCategorias (id_excursion, id_categoria_excursion)
      VALUES (?, ?)
    `;
    pool.query(insertSql, [id_excursion, id_categoria_excursion], (err2) => {
      if (err2) {
        console.error("Error al insertar nueva categoría:", err2);
        return res.status(500).json({ message: "Error al actualizar categoría" });
      }

      res.json({ message: "Categoría actualizada correctamente" });
    });
  });
};