import { useEffect, useState } from "react";
import useUserStore from "../../store/useUserStore";
import axios from "axios";
import { Card, Spinner, ListGroup } from "react-bootstrap";

export default function PerfilGuia() {
  const { user } = useUserStore();
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPerfil = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/api/usuarios/${user.id}`);
        setPerfil(res.data);
      } catch (err) {
        console.error("Error al obtener perfil del guía:", err);
        setError("No se pudo cargar tu perfil.");
      } finally {
        setLoading(false);
      }
    };

    fetchPerfil();
  }, [user.id]);

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="info" />
        <p className="text-muted mt-2">Cargando perfil...</p>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger text-center mt-4">{error}</div>;
  }

  return (
    <Card className="shadow-sm">
      <Card.Body>
        <h5 className="fw-bold text-info mb-3">Mi Perfil</h5>
        <ListGroup variant="flush">
          <ListGroup.Item><strong>Nombre:</strong> {perfil.nombre}</ListGroup.Item>
          <ListGroup.Item><strong>Apellido:</strong> {perfil.apellido}</ListGroup.Item>
          <ListGroup.Item><strong>Email:</strong> {perfil.email}</ListGroup.Item>
          <ListGroup.Item><strong>Teléfono:</strong> {perfil.telefono}</ListGroup.Item>
          <ListGroup.Item><strong>Estado:</strong> {perfil.estado}</ListGroup.Item>
          <ListGroup.Item><strong>Rol:</strong> {user.rol}</ListGroup.Item>
        </ListGroup>
      </Card.Body>
    </Card>
  );
}