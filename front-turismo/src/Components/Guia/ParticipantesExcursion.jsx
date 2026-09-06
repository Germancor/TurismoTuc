import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Card, Table, Button, Spinner } from "react-bootstrap";
import "../../styles/components/guia.css";

export default function ParticipantesExcursion() {
  const { id, idFecha } = useParams();
  const navigate = useNavigate();

  const [participantes, setParticipantes] = useState([]);
  const [excursion, setExcursion] = useState(null);
  const [fecha, setFecha] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resParticipantes, resExcursion, resFecha] = await Promise.all([
          axios.get(
            `${import.meta.env.VITE_API_URL}/excursiones/${id}/fechas/${idFecha}/participantes-guia`,
          ),

          axios.get(`${import.meta.env.VITE_API_URL}/excursiones/${id}`),

          axios.get(
            `${import.meta.env.VITE_API_URL}/excursiones/fechas/${idFecha}`,
          ),
        ]);

        setParticipantes(resParticipantes.data);
        setExcursion(resExcursion.data);
        setFecha(resFecha.data);
      } catch (err) {
        console.error("Error al obtener participantes:", err);

        setError("No se pudo cargar la lista de participantes.");
      } finally {
        setLoading(false);
      }
    };

    if (id && idFecha) {
      fetchData();
    }
  }, [id, idFecha]);

  const handlePrint = () => {
    window.print();
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return "Sin fecha";
    const fechaObj = new Date(fecha);

    if (isNaN(fechaObj.getTime())) {
      return "Fecha inválida";
    }

    return fechaObj.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "America/Argentina/Tucuman",
    });
  };

  const formatearHora = (hora) => {
    if (!hora) return "";

    return hora.substring(0, 5);
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="primary" />

        <p className="text-muted mt-2">Cargando participantes...</p>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger text-center mt-4">{error}</div>;
  }

  return (
    <Card className="shadow-sm participantes-card">
      <Card.Body>
        {/* ENCABEZADO */}
        <div className="d-flex justify-content-between align-items-start mb-4 print-header">
          <div>
            <h5 className="fw-bold text-primary mb-1">
              Participantes de la excursión
            </h5>

            {excursion && (
              <p className="text-muted mb-1">
                Excursión: <strong>{excursion.titulo}</strong>
              </p>
            )}

            {fecha && (
              <>
                <p className="text-muted mb-0">
                  Fecha: <strong>{formatearFecha(fecha.fecha)}</strong>
                </p>

                {fecha.hora_salida && (
                  <p className="text-muted mb-0">
                    Hora de salida:{" "}
                    <strong>{formatearHora(fecha.hora_salida)} hs</strong>
                  </p>
                )}
              </>
            )}
          </div>

          <div className="d-flex gap-2 no-print">
            <Button variant="outline-secondary" onClick={() => navigate(-1)}>
              ← Volver
            </Button>

            <Button variant="outline-primary" onClick={handlePrint}>
              🖨️ Imprimir lista
            </Button>
          </div>
        </div>

        {/* RESUMEN */}
        <div className="alert alert-light border mb-3">
          <strong>Reservas: {participantes.length}</strong>

          {" · "}

          <strong>
            Personas:{" "}
            {participantes.reduce(
              (total, p) => total + Number(p.cantidad_personas || 0),
              0,
            )}
          </strong>
        </div>

        {/* TABLA */}
        <Table hover responsive className="align-middle">
          <thead className="table-light">
            <tr>
              <th>#</th>
              <th>Nombre</th>
              <th>Apellido</th>
              <th>DNI</th>
              <th>Email</th>
              <th>Personas</th>
            </tr>
          </thead>

          <tbody>
            {participantes.length > 0 ? (
              participantes.map((p, i) => (
                <tr key={p.id_reserva}>
                  <td>{i + 1}</td>

                  <td>{p.nombre}</td>

                  <td>{p.apellido}</td>

                  <td>{p.dni || "—"}</td>

                  <td>{p.email}</td>

                  <td>
                    <span className="badge bg-primary">
                      {p.cantidad_personas}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center text-muted py-4">
                  No hay participantes registrados para esta fecha.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
}
