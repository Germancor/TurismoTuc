import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useUserStore from "../../store/useUserStore";
import axios from "axios";
import { Card, Table, Button, Spinner } from "react-bootstrap";

export default function MainExcursionesGuia() {
  const { user } = useUserStore();
  const navigate = useNavigate();
  const [excursiones, setExcursiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchExcursiones = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/api/excursiones/guia/${user.id}`);
        setExcursiones(res.data);
      } catch (err) {
        console.error("Error al obtener excursiones:", err);
        setError("No se pudieron cargar tus excursiones.");
      } finally {
        setLoading(false);
      }
    };

    fetchExcursiones();
  }, [user.id]);

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="success" />
        <p className="text-muted mt-2">Cargando excursiones asignadas...</p>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger text-center mt-4">{error}</div>;
  }

  return (
    <Card className="shadow-sm">
      <Card.Body>
        <h5 className="fw-bold text-success mb-3">Mis Excursiones Asignadas</h5>

        <Table hover responsive className="align-middle">
          <thead className="table-light">
            <tr>
              <th>Título</th>
              <th>Ubicación</th>
              <th>Precio</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {excursiones.length > 0 ? (
              excursiones.map((e) => (
                <tr key={e.id_excursion}>
                  <td>{e.titulo}</td>
                  <td>{e.ubicacion}</td>
                  <td>${e.precio_base}</td>
                  <td>
                    <span className={`badge ${e.estado === "activa" ? "bg-success" : "bg-secondary"}`}>
                      {e.estado}
                    </span>
                  </td>
                  <td>{new Date(e.fecha_creacion).toLocaleDateString()}</td>
                  <td>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => navigate(`/dashboard-guia/excursiones/${e.id_excursion}/participantes`)}
                    >
                      Ver participantes
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center text-muted py-3">
                  No tenés excursiones asignadas.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
}