import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Card, Table, Button, Spinner } from "react-bootstrap";

export default function FechasExcursion() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [fechas, setFechas] = useState([]);
  const [excursion, setExcursion] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resFechas, resExcursion] = await Promise.all([
          axios.get(
            `${import.meta.env.VITE_API_URL}/excursiones/${id}/fechas-guia`,
          ),

          axios.get(`${import.meta.env.VITE_API_URL}/excursiones/${id}`),
        ]);

        setFechas(resFechas.data);
        setExcursion(resExcursion.data);
      } catch (err) {
        console.error("Error al obtener fechas:", err);

        setError("No se pudieron cargar las fechas de la excursión.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

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
    if (!hora) return "Sin hora";

    return hora.substring(0, 5);
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="primary" />

        <p className="text-muted mt-2">Cargando fechas...</p>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger text-center mt-4">{error}</div>;
  }

  return (
    <Card className="shadow-sm">
      <Card.Body>
        {/* ENCABEZADO */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h5 className="fw-bold text-primary mb-1">
              Fechas de la excursión
            </h5>

            {excursion && (
              <p className="text-muted mb-0">
                Excursión: <strong>{excursion.titulo}</strong>
              </p>
            )}
          </div>

          <Button variant="outline-secondary" onClick={() => navigate(-1)}>
            ← Volver
          </Button>
        </div>

        {/* TABLA */}
        <Table hover responsive className="align-middle">
          <thead className="table-light">
            <tr>
              <th>#</th>
              <th>Fecha</th>
              <th>Hora de salida</th>
              <th>Cupo máximo</th>
              <th>Disponibles</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {fechas.length > 0 ? (
              fechas.map((f, index) => (
                <tr key={f.id_fecha}>
                  <td>{index + 1}</td>

                  <td>{formatearFecha(f.fecha)}</td>

                  <td>
                    {formatearHora(f.hora_salida)}
                    {f.hora_salida && " hs"}
                  </td>

                  <td>{f.cupo_maximo}</td>

                  <td>{f.cupo_disponible}</td>

                  <td>
                    <span
                      className={`badge text-uppercase ${
                        f.estado === "abierta" ? "bg-success" : "bg-secondary"
                      }`}
                    >
                      {f.estado}
                    </span>
                  </td>

                  <td>
                    <Button
                      variant="outline-success"
                      size="sm"
                      onClick={() =>
                        navigate(
                          `/dashboard-guia/excursiones/${id}/fechas/${f.id_fecha}/participantes`,
                        )
                      }
                    >
                      Ver participantes
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center text-muted py-4">
                  No hay fechas registradas para esta excursión.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
}
