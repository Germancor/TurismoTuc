import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, Table, Button, Alert, Badge } from "react-bootstrap";


export default function MainResenias() {
  const [reseñas, setReseñas] = useState([]);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const navigate = useNavigate();

  // =============================
  // CARGAR RESEÑAS
  // =============================
  const fetchReseñas = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/resenias");
      setReseñas(res.data);
    } catch (err) {
      console.error("Error al obtener reseñas:", err);
      setError("No se pudieron cargar las reseñas.");
    }
  };

  useEffect(() => {
    fetchReseñas();
  }, []);

  // =============================
  // PUBLICAR RESEÑA
  // =============================
  const handlePublicar = async (id) => {
    try {
      const confirmacion = window.confirm("¿Deseas publicar esta reseña?");
      if (!confirmacion) return;

      await axios.put(`http://localhost:8000/api/resenias/${id}`, {
        estado: "publicada",
      });

      setMensaje("✅ Reseña publicada correctamente.");
      fetchReseñas();
      setTimeout(() => setMensaje(""), 2500);
    } catch (err) {
      console.error("Error al publicar reseña:", err);
      setError("No se pudo publicar la reseña.");
    }
  };

  // =============================
  // ELIMINAR RESEÑA
  // =============================
  const handleEliminar = async (id) => {
    try {
      const confirmar = window.confirm("¿Seguro que deseas eliminar esta reseña?");
      if (!confirmar) return;

      await axios.delete(`http://localhost:8000/api/resenias/${id}`);
      setMensaje("🗑️ Reseña eliminada correctamente.");
      fetchReseñas();
      setTimeout(() => setMensaje(""), 2500);
    } catch (err) {
      console.error("Error al eliminar reseña:", err);
      setError("No se pudo eliminar la reseña.");
    }
  };

  // =============================
  // RENDER
  // =============================
  return (
    <Card className="shadow-sm">
      <Card.Body className="p-3">
        <h5 className="fw-bold text-success mb-3">Gestión de Reseñas</h5>

        {error && <Alert variant="danger" className="py-2">{error}</Alert>}
        {mensaje && <Alert variant="success" className="py-2">{mensaje}</Alert>}

        <Table hover responsive className="align-middle">
          <thead className="table-light">
            <tr>
              <th>ID</th>
              <th>Excursión</th>
              <th>Turista</th>
              <th>Calificación</th>
              <th>Comentario</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {reseñas.length > 0 ? (
              reseñas.map((r) => (
                <tr key={r.id_resena}>
                  <td>{r.id_resena}</td>
                  <td>{r.excursion}</td>
                  <td>{r.turista || "Sin asignar"}</td>
                  <td>
                    <Badge bg="warning" text="dark">
                      ⭐ {r.calificacion}
                    </Badge>
                  </td>
                  <td>{r.comentario || "—"}</td>
                  <td>{new Date(r.fecha_resena).toLocaleDateString()}</td>
                  <td>
                    <Badge bg={r.estado === "publicada" ? "success" : "secondary"}>
                      {r.estado}
                    </Badge>
                  </td>
                  <td>
                    <div className="btn-group" role="group">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => navigate(`/dashboard-admin/reseñas/edit/${r.id_resena}`)}
                      >
                        <i className="bi bi-pencil"></i>
                      </Button>

                      {r.estado === "pendiente" && (
                        <Button
                          variant="outline-success"
                          size="sm"
                          onClick={() => handlePublicar(r.id_resena)}
                        >
                          <i className="bi bi-check-circle"></i>
                        </Button>
                      )}

                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleEliminar(r.id_resena)}
                      >
                        <i className="bi bi-trash"></i>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="text-center text-muted py-3">
                  No hay reseñas disponibles.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
}