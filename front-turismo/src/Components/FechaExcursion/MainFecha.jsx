import { useEffect, useState } from "react";
import axios from "axios";
import { Card, Table, Button, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

export default function MainFechasExcursion() {
  const [excursiones, setExcursiones] = useState([]);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const navigate = useNavigate();

  const fetchFechas = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/excursiones/con-fechas");
      setExcursiones(res.data);
    } catch (err) {
      console.error("Error al obtener excursiones con fechas:", err);
      setError("No se pudieron cargar las fechas.");
    }
  };

  useEffect(() => {
    fetchFechas();
  }, []);

  const handleDelete = async (id_fecha) => {
    const confirmar = window.confirm("¿Estás seguro de que querés eliminar esta fecha?");
    if (!confirmar) return;

    try {
      const res = await axios.delete(`http://localhost:8000/api/excursiones/fechas/${id_fecha}`);
      setMensaje(res.data.message);
      fetchFechas(); // recargar fechas
    } catch (err) {
      console.error("Error al eliminar fecha:", err);
      setError("No se pudo eliminar la fecha.");
    }
  };

  return (
    <Card className="shadow-sm">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold text-primary mb-0">Fechas de Excursiones</h5>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate("/dashboard-admin/fechas/create")}
          >
            <i className="bi bi-calendar-plus me-1"></i> Nueva Fecha
          </Button>
        </div>

        {mensaje && <Alert variant="success">{mensaje}</Alert>}
        {error && <Alert variant="danger">{error}</Alert>}

        {excursiones.length > 0 ? (
          excursiones.map((e) => (
            <div key={e.id_excursion} className="mb-4">
              <h6 className="fw-bold text-success">{e.titulo}</h6>
              <Table bordered size="sm" responsive>
                <thead className="table-light">
                  <tr>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Cupo</th>
                    <th>Disponible</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {e.fechas.length > 0 ? (
                    e.fechas.map((f) => (
                      <tr key={f.id_fecha}>
                        <td>{new Date(f.fecha).toLocaleDateString()}</td>
                        <td>{f.hora_salida || "—"}</td>
                        <td>{f.cupo_maximo}</td>
                        <td>{f.cupo_disponible}</td>
                        <td>
                          <span className={`badge ${f.estado === "abierta" ? "bg-success" : "bg-secondary"}`}>
                            {f.estado}
                          </span>
                        </td>
                        <td>
                          <div className="btn-group" role="group">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => navigate(`/dashboard-admin/fechas/edit/${f.id_fecha}`)}
                            >
                              <i className="bi bi-pencil"></i>
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDelete(f.id_fecha)}
                            >
                              <i className="bi bi-trash"></i>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-muted text-center">
                        Sin fechas registradas
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          ))
        ) : (
          <p className="text-muted">No hay excursiones registradas</p>
        )}
      </Card.Body>
    </Card>
  );
}