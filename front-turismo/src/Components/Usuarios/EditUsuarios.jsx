import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

export default function EditUsuario() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    id_rol: "",
    estado: "activo",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Obtener usuario por ID y roles
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, rolesRes] = await Promise.all([
          axios.get(`http://localhost:8000/api/usuarios/${id}`),
          axios.get("http://localhost:8000/api/usuarios/roles"),
        ]);

        setForm({
          nombre: userRes.data.nombre,
          apellido: userRes.data.apellido,
          email: userRes.data.email,
          telefono: userRes.data.telefono,
          id_rol: rolesRes.data.find((r) => r.nombre_rol === userRes.data.nombre_rol)?.id_rol || "",
          estado: userRes.data.estado || "activo",
        });

        setRoles(rolesRes.data);
      } catch (err) {
        console.error("Error al cargar usuario:", err);
        setError("No se pudo cargar la información del usuario.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Manejar cambios
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Enviar actualización
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      await axios.put(`http://localhost:8000/api/usuarios/${id}`, form);
      setMessage("✅ Usuario actualizado correctamente.");
      setTimeout(() => navigate("/dashboard-admin/usuarios"), 1500);
    } catch (err) {
      console.error("Error al actualizar usuario:", err);
      setError("No se pudo actualizar el usuario.");
    }
  };

  if (loading) {
    return <div className="text-center mt-5">Cargando datos del usuario...</div>;
  }

  return (
    <div className="container mt-4">
      <div className="card shadow-sm p-4">
        <h5 className="fw-bold text-success mb-3">Editar Usuario</h5>

        {message && <div className="alert alert-success py-2">{message}</div>}
        {error && <div className="alert alert-danger py-2">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold">Nombre</label>
              <input
                type="text"
                className="form-control"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold">Apellido</label>
              <input
                type="text"
                className="form-control"
                name="apellido"
                value={form.apellido}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold">Email</label>
              <input
                type="email"
                className="form-control"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold">Teléfono</label>
              <input
                type="text"
                className="form-control"
                name="telefono"
                value={form.telefono || ""}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold">Rol</label>
              <select
                className="form-select"
                name="id_rol"
                value={form.id_rol}
                onChange={handleChange}
                required
              >
                <option value="">Seleccionar rol...</option>
                {roles.map((r) => (
                  <option key={r.id_rol} value={r.id_rol}>
                    {r.nombre_rol}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-6 mb-3">
              <label className="form-label fw-semibold">Estado</label>
              <select
                className="form-select"
                name="estado"
                value={form.estado}
                onChange={handleChange}
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
          </div>

          <div className="d-flex justify-content-between mt-3">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => navigate("/dashboard-admin/usuarios")}
            >
              ← Volver
            </button>
            <button type="submit" className="btn btn-primary">
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
