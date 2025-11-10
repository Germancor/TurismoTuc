import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function EditReseña() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [reseña, setReseña] = useState({
    id_resena: "",
    excursion: "",
    turista: "",
    calificacion: "",
    comentario: "",
    estado: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  // =============================
  // CARGAR DATOS DE LA RESEÑA
  // =============================
  useEffect(() => {
    const fetchReseña = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/api/resenias/${id}`);
        setReseña(res.data);
      } catch (err) {
        console.error("Error al obtener la reseña:", err);
        setError("No se pudo cargar la información de la reseña.");
      } finally {
        setLoading(false);
      }
    };

    fetchReseña();
  }, [id]);

  // =============================
  // ACTUALIZAR RESEÑA
  // =============================
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:8000/api/resenias/${id}`, {
        comentario: reseña.comentario,
        estado: reseña.estado,
      });

      setMensaje("✅ Reseña actualizada correctamente.");
      setTimeout(() => navigate("/dashboard-admin/reseñas"), 1500);
    } catch (err) {
      console.error("Error al actualizar reseña:", err);
      setError("No se pudo actualizar la reseña.");
    }
  };

  if (loading)
    return <div className="text-center mt-5">Cargando reseña...</div>;

  if (error)
    return (
      <div className="alert alert-danger text-center mt-4">{error}</div>
    );

  return (
    <div className="container mt-4">
      <div className="card shadow-sm p-4">
        <h4 className="fw-bold text-success mb-3">Editar Reseña</h4>

        {mensaje && <div className="alert alert-success">{mensaje}</div>}

        <form onSubmit={handleSubmit}>
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label fw-semibold">Excursión</label>
              <input
                type="text"
                className="form-control"
                value={reseña.excursion}
                disabled
              />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold">Turista</label>
              <input
                type="text"
                className="form-control"
                value={reseña.turista}
                disabled
              />
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label fw-semibold">Calificación</label>
              <input
                type="text"
                className="form-control"
                value={`⭐ ${reseña.calificacion}`}
                disabled
              />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold">Estado</label>
              <select
                className="form-select"
                value={reseña.estado}
                onChange={(e) =>
                  setReseña({ ...reseña, estado: e.target.value })
                }
              >
                <option value="pendiente">Pendiente</option>
                <option value="publicada">Publicada</option>
              </select>
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Comentario</label>
            <textarea
              className="form-control"
              rows="4"
              value={reseña.comentario}
              onChange={(e) =>
                setReseña({ ...reseña, comentario: e.target.value })
              }
            ></textarea>
          </div>

          <div className="d-flex justify-content-between">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => navigate("/dashboard-admin/reseñas")}
            >
              ← Volver
            </button>
            <button type="submit" className="btn btn-success">
              Guardar cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
