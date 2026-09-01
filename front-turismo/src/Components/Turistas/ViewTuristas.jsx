import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { Spinner, Table, Card, Button } from "react-bootstrap";

export default function ViewTurista() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [turista, setTurista] = useState(null);
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTuristaYReservas = async () => {
      try {
        const [turistaRes, reservasRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/turistas/${id}`),
          axios.get(`${import.meta.env.VITE_API_URL}/turistas/${id}/reservas?historial=true`),
        ]);
        setTurista(turistaRes.data);
        setReservas(reservasRes.data.reservas);
      } catch (err) {
        console.error("Error al obtener datos:", err);
        Swal.fire("Error", "No se pudo cargar la información del turista.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchTuristaYReservas();
  }, [id]);

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="success" />
        <p className="mt-3 text-muted">Cargando información...</p>
      </div>
    );
  }

  if (!turista) {
    return (
      <div className="container py-4">
        <Card className="shadow-sm p-4 text-center">
          <h5 className="text-warning">Turista no encontrado</h5>
          <Link to="/dashboard-admin/turistas" className="btn btn-outline-secondary mt-3">
            ← Volver al listado
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-4">
              <div className="col-12 col-md-6 mb-2 mb-md-0">
          <Button variant="outline-secondary" size="sm" onClick={() => navigate(-1)}>
            ← Volver
          </Button>
          <br />
        </div>
        <br />

      <Card className="shadow-sm">
      <div className="col-12 col-md-6 text-md-end">
              <h4 className="fw-bold text-success mb-0">Información del Turista</h4>
            </div>

        <Card.Body>
          <div className="row mb-2">
            <div className="col-md-6"><strong>Nombre:</strong> {turista.nombre} {turista.apellido}</div>
            <div className="col-md-6"><strong>DNI:</strong> {turista.dni}</div>
          </div>
          <div className="row mb-2">
            <div className="col-md-6"><strong>Email:</strong> {turista.email}</div>
            <div className="col-md-6"><strong>Teléfono:</strong> {turista.telefono}</div>
          </div>
          <div className="row mb-2">
            <div className="col-md-6"><strong>Dirección:</strong> {turista.direccion || "—"}</div>
            <div className="col-md-6"><strong>Nacionalidad:</strong> {turista.nacionalidad || "—"}</div>
          </div>

          <hr className="my-4" />
          <h5 className="fw-bold text-secondary mb-3">Reservas / Viajes realizados</h5>

          {reservas.length > 0 ? (
            <Table responsive hover className="align-middle">
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
                      <span className={`badge ${
                        r.estado === "confirmada"
                          ? "bg-success"
                          : r.estado === "pendiente"
                          ? "bg-warning text-dark"
                          : "bg-secondary"
                      }`}>
                        {r.estado}
                      </span>
                    </td>
                    <td>{new Date(r.fecha_reserva).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <p className="text-muted">No hay reservas registradas para este turista.</p>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}