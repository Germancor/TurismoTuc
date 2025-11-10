import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

export default function ViewUsuario() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsuario = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/api/usuarios/${id}`);
        setUsuario(res.data);
      } catch (err) {
        console.error("Error al obtener usuario:", err);
        setError("No se pudo cargar la información del usuario.");
      } finally {
        setLoading(false);
      }
    };
    fetchUsuario();
  }, [id]);

  if (loading) {
    return <div className="text-center mt-5">Cargando datos del usuario...</div>;
  }

  if (error) {
    return (
      <div className="alert alert-danger text-center mt-4">{error}</div>
    );
  }

  if (!usuario) {
    return (
      <div className="alert alert-warning text-center mt-4">
        Usuario no encontrado.
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="card shadow-sm p-4">
        <h5 className="fw-bold text-success mb-3">Información del Usuario</h5>

        <div className="row mb-2">
          <div className="col-md-6">
            <strong>Nombre:</strong> {usuario.nombre} {usuario.apellido}
          </div>
          <div className="col-md-6">
            <strong>Email:</strong> {usuario.email}
          </div>
        </div>

        <div className="row mb-2">
          <div className="col-md-6">
            <strong>Teléfono:</strong> {usuario.telefono || "—"}
          </div>
          <div className="col-md-6">
            <strong>Rol:</strong> {usuario.nombre_rol}
          </div>
        </div>

        <div className="row mb-3">
          <div className="col-md-6">
            <strong>Estado:</strong>{" "}
            <span
              className={`badge ${
                usuario.estado === "activo" ? "bg-success" : "bg-secondary"
              }`}
            >
              {usuario.estado}
            </span>
          </div>
        </div>

        <hr />

        <div className="mt-3">
          <button
            className="btn btn-outline-success"
            onClick={() => navigate("/dashboard-admin/usuarios")}
          >
            ← Volver al listado
          </button>
        </div>
      </div>
    </div>
  );
}
