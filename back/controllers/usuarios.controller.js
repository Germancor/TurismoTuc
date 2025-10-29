// controllers/usuariosController.js

import { pool } from "../config/DB.js";
// =========================
// R O L E S
// =========================
export const getRoles = (req, res) => {
  pool.query("SELECT * FROM Roles WHERE eliminado = 0", (err, results) => {
    
    if (err) {
      console.error("Error al obtener roles:", err);
      return res.status(500).json({ message: "Error al obtener roles" });
    }
    res.json(results);
  });
};

// =========================
// U S U A R I O S
// =========================
export const getUsuarios = (req, res) => {
  pool.query(
    `SELECT u.id_usuario, u.nombre, u.apellido, u.email, u.telefono, 
            r.nombre_rol, u.estado
     FROM Usuarios u
     JOIN Roles r ON u.id_rol = r.id_rol
     WHERE u.eliminado = 0`,
    (err, results) => {
      if (err) {
        console.error("Error al obtener usuarios:", err);
        return res.status(500).json({ message: "Error al obtener usuarios" });
      }
      res.json(results);
    }
  );
};
//USUARIOS POR ID
export const getUsuarioById = (req, res) => {
  const { id } = req.params;
  pool.query(
    `SELECT u.id_usuario, u.nombre, u.apellido, u.email, u.telefono, 
            r.nombre_rol, u.estado
     FROM Usuarios u
     JOIN Roles r ON u.id_rol = r.id_rol
     WHERE u.id_usuario = ? AND u.eliminado = 0`,
    [id],
    (err, results) => {
      if (err) {
        console.error("Error al buscar usuario:", err);
        return res.status(500).json({ message: "Error al buscar usuario" });
      }
      if (results.length === 0)
        return res.status(404).json({ message: "Usuario no encontrado" });
      res.json(results[0]);
    }
  );
};
//CREAR USUARIO
export const createUsuario = (req, res) => {
  const { nombre, apellido, email, password, telefono, id_rol } = req.body;

  if (!nombre || !apellido || !email || !password || !id_rol)
    return res.status(400).json({ message: "Faltan datos obligatorios" });

  const sql = `INSERT INTO Usuarios (nombre, apellido, email, password, telefono, id_rol)
               VALUES (?, ?, ?, ?, ?, ?)`;
  const values = [nombre, apellido, email, password, telefono, id_rol];

  pool.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error al crear usuario:", err);
      return res.status(500).json({ message: "Error al crear usuario" });
    }
    res.status(201).json({ message: "Usuario creado exitosamente", id: result.insertId });
  });
};
//ACTUALIZAR USUARIO
export const updateUsuario = (req, res) => {
  const { id } = req.params;
  const { nombre, apellido, email, telefono, id_rol, estado } = req.body;

  const sql = `UPDATE Usuarios
               SET nombre=?, apellido=?, email=?, telefono=?, id_rol=?, estado=?
               WHERE id_usuario=? AND eliminado=0`;
  const values = [nombre, apellido, email, telefono, id_rol, estado, id];

  pool.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error al actualizar usuario:", err);
      return res.status(500).json({ message: "Error al actualizar usuario" });
    }
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Usuario no encontrado" });
    res.json({ message: "Usuario actualizado correctamente" });
  });
};
//  ELIMINAR USUARIO (BAJA LÓGICA)
export const deleteUsuario = (req, res) => {
  const { id } = req.params;

  const sql = `UPDATE Usuarios
               SET eliminado=1, fecha_eliminacion=NOW()
               WHERE id_usuario=?`;
  pool.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error al eliminar usuario:", err);
      return res.status(500).json({ message: "Error al eliminar usuario" });
    }
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Usuario no encontrado" });
    res.json({ message: "Usuario eliminado (baja lógica) correctamente" });
  });
};
// =========================


// =========================
// LOGIN
// =========================
// Login de usuario, verifica email y password, devuelve datos del usuario si es válido
export const loginUsuario = (req, res) => {
  console.log("Datos recibidos en login:", req.body);
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ success: false, message: "Faltan datos obligatorios" });

  const sql = `
    SELECT u.id_usuario, u.nombre, u.apellido, u.email, u.password, r.nombre_rol 
    FROM Usuarios u
    JOIN Roles r ON u.id_rol = r.id_rol
    WHERE u.email = ? AND u.eliminado = 0
  `;
  // Buscar usuario por email
  pool.query(sql, [email], (err, results) => {
    if (err) {
      console.error("Error al intentar iniciar sesión:", err);
      return res.status(500).json({ success: false, message: "Error interno del servidor" });
    }

    if (results.length === 0) {
      return res.status(401).json({ success: false, message: "Usuario no encontrado" });
    }

    const user = results[0];

    // ⚠️ Contraseñas en texto plano (por ahora)
    if (user.password !== password) {
      return res.status(401).json({ success: false, message: "Contraseña incorrecta" });
    }

    // OK → usuario válido
    res.json({
      success: true,
      user: {
        id: user.id_usuario,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        rol: user.nombre_rol,
      },
    });
  });
};
