import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";

export default function EditTurista() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [turista, setTurista] = useState({
    nombre: "",
    apellido: "",
    dni: "",
    email: "",
    telefono: "",
    direccion: "",
    nacionalidad: ""
  });
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    const fetchTurista = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/api/turistas/${id}`);
        setTurista(res.data);
      } catch (err) {
        console.error("Error al cargar turista:", err);
        setError("No se pudo cargar la información del turista.");
      }
    };
    fetchTurista();
  }, [id]);

  const handleChange = (e) => {
    setTurista({ ...turista, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMensaje("");

    try {
      await axios.put(`http://localhost:8000/api/turistas/${id}`, turista);
      setMensaje("Turista actualizado correctamente ✅");
      setTimeout(() => navigate("/dashboard-admin/turistas"), 1500);
    } catch (err) {
      console.error("Error al actualizar:", err);
      setError("Error al actualizar los datos del turista.");
    }
  };

  return (
    <div className="container mt-4">
      <div className="card shadow-sm p-4">
        <h4 className="text-success fw-bold mb-3">Editar Turista</h4>

        {error && <div className="alert alert-danger py-2">{error}</div>}
        {mensaje && <div className="alert alert-success py-2">{mensaje}</div>}

        <form onSubmit={handleSubmit}>
          <div className="row mb-3">
            <div className="col-md-4">
              <label className="form-label">Nombre</label>
              <input
                type="text"
                name="nombre"
                className="form-control"
                value={turista.nombre}
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Apellido</label>
              <input
                type="text"
                name="apellido"
                className="form-control"
                value={turista.apellido}
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">DNI</label>
              <input
                type="text"
                name="dni"
                className="form-control"
                value={turista.dni || ""}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">Email</label>
              <input
                type="email"
                name="email"
                className="form-control"
                value={turista.email || ""}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Teléfono</label>
              <input
                type="text"
                name="telefono"
                className="form-control"
                value={turista.telefono || ""}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Dirección</label>
            <input
              type="text"
              name="direccion"
              className="form-control"
              value={turista.direccion || ""}
              onChange={handleChange}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Nacionalidad</label>
            <input
              type="text"
              name="nacionalidad"
              className="form-control"
              value={turista.nacionalidad || ""}
              onChange={handleChange}
            />
          </div>

          <div className="d-flex justify-content-between">
            <Link to="/dashboard-admin/turistas" className="btn btn-outline-secondary">
              ← Volver
            </Link>
            <button type="submit" className="btn btn-success">
              Guardar cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
