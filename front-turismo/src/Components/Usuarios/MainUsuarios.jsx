import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, Button, Table, Alert, Badge } from "react-bootstrap";


export default function MainUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Cargar usuarios al montar
  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const res = await axios.get("http://localhost:8000/api/usuarios");
        setUsuarios(res.data);
      } catch (err) {
        console.error("Error al obtener usuarios:", err);
        setError("No se pudieron cargar los usuarios.");
      }
    };
    fetchUsuarios();
  }, []);

  // Eliminar usuario (baja lógica)
  const handleDelete = async (id) => {
    if (!confirm("¿Seguro que deseas eliminar este usuario?")) return;

    try {
      await axios.delete(`http://localhost:8000/api/usuarios/${id}`);
      setUsuarios(usuarios.filter((u) => u.id_usuario !== id));
    } catch (err) {
      console.error("Error al eliminar usuario:", err);
      setError("No se pudo eliminar el usuario.");
    }
  };

  return (
    <Card className="shadow-sm">
      <Card.Body className="p-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold text-success mb-0">Gestión de Usuarios</h5>
          <Button 
            variant="success" 
            size="sm"
            onClick={() => navigate("create")}
          >
            <i className="bi bi-plus-circle me-1"></i> Agregar Usuario
          </Button>
        </div>

        {error && <Alert variant="danger" className="py-2">{error}</Alert>}

        <Table hover responsive className="align-middle">
          <thead className="table-light">
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.length > 0 ? (
              usuarios.map((u) => (
                <tr key={u.id_usuario}>
                  <td>{u.id_usuario}</td>
                  <td>{u.nombre} {u.apellido}</td>
                  <td>{u.email}</td>
                  <td>{u.telefono || "—"}</td>
                  <td>{u.nombre_rol}</td>
                  <td>
                    <Badge bg={u.estado === "activo" ? "success" : "secondary"}>
                      {u.estado || "pendiente"}
                    </Badge>
                  </td>
                  <td>
                    <div className="btn-group" role="group">
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => navigate(`view/${u.id_usuario}`)}
                      >
                        <i className="bi bi-eye"></i>
                      </Button>

                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => navigate(`edit/${u.id_usuario}`)}
                      >
                        <i className="bi bi-pencil"></i>
                      </Button>

                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(u.id_usuario)}
                      >
                        <i className="bi bi-trash"></i>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center text-muted py-3">
                  No hay usuarios registrados
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
}