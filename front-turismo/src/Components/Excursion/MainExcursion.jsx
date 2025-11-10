import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, Button, Table, Alert } from "react-bootstrap";

export default function MainExcursiones() {
  const [excursiones, setExcursiones] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const fetchExcursiones = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/excursiones");
      setExcursiones(res.data);
    } catch (err) {
      console.error("Error al obtener excursiones:", err);
      setError("No se pudieron cargar las excursiones.");
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Estás seguro de que querés eliminar esta excursión?")) return;

    try {
      const res = await axios.delete(`http://localhost:8000/api/excursiones/${id}`);
      setMensaje(res.data.message);
      setError("");
      fetchExcursiones();
    } catch (err) {
      console.error("Error al eliminar excursión:", err);
      setError("No se pudo eliminar la excursión.");
      setMensaje("");
    }
  };

  useEffect(() => {
    fetchExcursiones();
  }, []);

  return (
    <Card className="shadow-sm">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold text-success mb-0">Gestión de Excursiones</h5>
          <Button
            variant="success"
            size="sm"
            onClick={() => navigate("/dashboard-admin/excursiones/create")}
          >
            <i className="bi bi-plus-circle me-1"></i> Nueva Excursión
          </Button>
        </div>

        {mensaje && <Alert variant="success" className="py-2">{mensaje}</Alert>}
        {error && <Alert variant="danger" className="py-2">{error}</Alert>}

        <Table hover responsive className="align-middle">
          <thead className="table-light">
            <tr>
              <th>ID</th>
              <th>Título</th>
              <th>Ubicación</th>
              <th>Precio</th>
              <th>Estado</th>
              <th>Categorías</th>
              <th>Guía</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {excursiones.length > 0 ? (
              excursiones.map((e) => (
                <tr key={e.id_excursion}>
                  <td>{e.id_excursion}</td>
                  <td>{e.titulo}</td>
                  <td>{e.ubicacion}</td>
                  <td>${e.precio_base}</td>
                  <td>
                    <span className={`badge ${e.estado === 'activa' ? 'bg-success' : 'bg-warning'}`}>
                      {e.estado}
                    </span>
                  </td>
                  <td>
                    {e.categorias?.length > 0 ? (
                      e.categorias.map((cat) => (
                        <span key={cat.id_categoria_excursion} className="badge bg-info me-1">
                          {cat.nombre_categoria}
                        </span>
                      ))
                    ) : (
                      <span className="text-muted">Sin categoría</span>
                    )}
                  </td>
                  <td>
                    {e.nombre_guia ? (
                      <span
                        className="text-primary text-decoration-underline"
                        role="button"
                        onClick={() => navigate(`/dashboard-admin/usuarios/view/${e.id_guia}`)}
                      >
                        {e.nombre_guia} {e.apellido_guia}
                      </span>
                    ) : (
                      <span className="text-muted">Sin guía</span>
                    )}
                  </td>
                  <td>
                    <div className="btn-group" role="group">
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => navigate(`/dashboard-admin/excursiones/view/${e.id_excursion}`)}
                      >
                        <i className="bi bi-eye"></i>
                      </Button>

                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => navigate(`/dashboard-admin/excursiones/edit/${e.id_excursion}`)}
                      >
                        <i className="bi bi-pencil"></i>
                      </Button>

                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleEliminar(e.id_excursion)}
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
                  No hay excursiones registradas
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
}