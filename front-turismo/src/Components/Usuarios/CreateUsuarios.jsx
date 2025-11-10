import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function CreateUsuario() {
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    telefono: "",
    id_rol: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Cargar roles
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await axios.get("http://localhost:8000/api/usuarios/roles");
        setRoles(res.data);
      } catch (err) {
        console.error("Error al cargar roles:", err);
        setError("No se pudieron cargar los roles.");
      }
    };
    fetchRoles();
  }, []);

  // Manejador de inputs
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      await axios.post("http://localhost:8000/api/usuarios", form);
      setMessage("✅ Usuario creado exitosamente.");
      setTimeout(() => navigate("/dashboard-admin/usuarios"), 1500);
    } catch (err) {
      console.error("Error al crear usuario:", err);
      setError("No se pudo crear el usuario. Verifica los datos.");
    }
  };

  return (
    <div className="container mt-4">
      <div className="card shadow-sm p-4">
        <h5 className="fw-bold text-success mb-3">Crear Nuevo Usuario</h5>

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
              <label className="form-label fw-semibold">Contraseña</label>
              <input
                type="password"
                className="form-control"
                name="password"
                value={form.password}
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
                value={form.telefono}
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
                {roles.length > 0 ? (
                  roles.map((r) => (
                    <option key={r.id_rol} value={r.id_rol}>
                      {r.nombre_rol}
                    </option>
                  ))
                ) : (
                  <option disabled>Cargando roles...</option>
                )}
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
            <button type="submit" className="btn btn-success">
              Guardar Usuario
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
