import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";

export default function ViewTurista() {
  const { id } = useParams();
  const [turista, setTurista] = useState(null);
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTuristaYReservas = async () => {
      try {
        const [turistaRes, reservasRes] = await Promise.all([
          axios.get(`http://localhost:8000/api/turistas/${id}`),
          axios.get(`http://localhost:8000/api/turistas/${id}/reservas`),
        ]);
        setTurista(turistaRes.data);
        setReservas(reservasRes.data);
      } catch (err) {
        console.error("Error al obtener datos:", err);
        setError("No se pudo cargar la información del turista.");
      } finally {
        setLoading(false);
      }
    };

    fetchTuristaYReservas();
  }, [id]);

  if (loading) return <div className="text-center mt-5">Cargando información...</div>;
  if (error) return <div className="alert alert-danger text-center mt-4">{error}</div>;
  if (!turista) return <div className="alert alert-warning text-center mt-4">Turista no encontrado</div>;

  return (
    <div className="container mt-4">
      <div className="card shadow-sm p-4">
        <h4 className="text-success fw-bold mb-3">Información del Turista</h4>

        <div className="row mb-2">
          <div className="col-md-6">
            <strong>Nombre:</strong> {turista.nombre} {turista.apellido}
          </div>
          <div className="col-md-6">
            <strong>DNI:</strong> {turista.dni}
          </div>
        </div>
        <div className="row mb-2">
          <div className="col-md-6">
            <strong>Email:</strong> {turista.email}
          </div>
          <div className="col-md-6">
            <strong>Teléfono:</strong> {turista.telefono}
          </div>
        </div>
        <div className="row mb-2">
          <div className="col-md-6">
            <strong>Dirección:</strong> {turista.direccion || "—"}
          </div>
          <div className="col-md-6">
            <strong>Nacionalidad:</strong> {turista.nacionalidad || "—"}
          </div>
        </div>

        <hr />

        <h5 className="fw-bold text-secondary mb-3">Reservas / Viajes realizados</h5>

        {reservas.length > 0 ? (
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Excursión</th>
                <th>Fecha salida</th>
                <th>Personas</th>
                <th>Estado</th>
                <th>Fecha de reserva</th>
              </tr>
            </thead>
            <tbody>
              {reservas.map((r, i) => (
                <tr key={r.id_reserva}>
                  <td>{i + 1}</td>
                  <td>{r.excursion}</td>
                  <td>{new Date(r.fecha_salida).toLocaleDateString()}</td>
                  <td>{r.cantidad_personas}</td>
                  <td>
                    <span
                      className={`badge ${
                        r.estado === "confirmada"
                          ? "bg-success"
                          : r.estado === "pendiente"
                          ? "bg-warning text-dark"
                          : "bg-secondary"
                      }`}
                    >
                      {r.estado}
                    </span>
                  </td>
                  <td>{new Date(r.fecha_reserva).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-muted">No hay reservas registradas para este turista.</p>
        )}

        <div className="mt-4">
          <Link to="/dashboard-admin/turistas" className="btn btn-outline-success">
            ← Volver al listado
          </Link>
        </div>
      </div>
    </div>
  );
}
