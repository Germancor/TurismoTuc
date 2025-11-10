import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, Button, Table, Alert } from "react-bootstrap";

export default function MainTuristas() {
  const [turistas, setTuristas] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const fetchTuristas = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/turistas");
      setTuristas(res.data);
    } catch (err) {
      console.error("Error al obtener turistas:", err);
      setError("No se pudieron cargar los turistas.");
    }
  };

  useEffect(() => {
    fetchTuristas();
  }, []);

  const handleDelete = async (id) => {
    try {
      const confirmDelete = window.confirm("¿Seguro que querés eliminar este turista?");
      if (!confirmDelete) return;

      setError("");
      setMensaje("");

      await axios.delete(`http://localhost:8000/api/turistas/${id}`);
      setMensaje("✅ Turista eliminado correctamente");
      setTuristas(turistas.filter((t) => t.id_turista !== id));

      // Limpiar mensaje después de 2.5 segundos
      setTimeout(() => setMensaje(""), 2500);
    } catch (err) {
      console.error("Error al eliminar turista:", err);
      setError("No se pudo eliminar el turista.");
    }
  };

  return (
    <Card className="shadow-sm">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold text-success mb-0">Gestión de Turistas</h5>
          <Button
            variant="success"
            size="sm"
            onClick={() => navigate("/dashboard-admin/turistas/create")}
          >
            <i className="bi bi-plus-circle me-1"></i> Agregar Turista
          </Button>
        </div>

        {mensaje && <Alert variant="success" className="py-2">{mensaje}</Alert>}
        {error && <Alert variant="danger" className="py-2">{error}</Alert>}

        <Table hover responsive className="align-middle">
          <thead className="table-light">
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>DNI</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {turistas.length > 0 ? (
              turistas.map((t) => (
                <tr key={t.id_turista}>
                  <td>{t.id_turista}</td>
                  <td>{t.nombre} {t.apellido}</td>
                  <td>{t.dni}</td>
                  <td>{t.email}</td>
                  <td>{t.telefono}</td>
                  <td>
                    <div className="btn-group" role="group">
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => navigate(`/dashboard-admin/turistas/view/${t.id_turista}`)}
                      >
                        <i className="bi bi-eye"></i>
                      </Button>

                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => navigate(`/dashboard-admin/turistas/edit/${t.id_turista}`)}
                      >
                        <i className="bi bi-pencil"></i>
                      </Button>

                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(t.id_turista)}
                      >
                        <i className="bi bi-trash"></i>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center text-muted py-3">
                  No hay turistas registrados
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
}
