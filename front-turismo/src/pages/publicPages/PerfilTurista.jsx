import { useEffect, useState } from "react";
import { Container, Row, Col, Card, Spinner, Alert, Button, Form } from "react-bootstrap";
import axios from "axios";
import useTuristaStore from "../../store/useTuristaStore";

export default function PerfilTurista() {
  const { turista, token, setTurista } = useTuristaStore();
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    dni: "",
    email: "",
    telefono: "",
    direccion: "",
    nacionalidad: "",
  });

  // 🔹 Cargar reservas
  useEffect(() => {
    const fetchReservas = async () => {
      if (!turista) return;
      try {
        const res = await axios.get(
          `http://localhost:8000/api/turistas/${turista.id}/reservas`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setReservas(res.data);
      } catch (err) {
        console.error("Error al obtener reservas:", err);
        setError("No se pudieron cargar tus reservas.");
      } finally {
        setLoading(false);
      }
    };

    fetchReservas();
  }, [turista, token]);

  // 🔹 Inicializar datos del formulario
  useEffect(() => {
    if (turista) {
      setFormData({
        nombre: turista.nombre || "",
        apellido: turista.apellido || "",
        dni: turista.dni || "",
        email: turista.email || "",
        telefono: turista.telefono || "",
        direccion: turista.direccion || "",
        nacionalidad: turista.nacionalidad || "",
      });
    }
  }, [turista]);

  // 🔹 Cambiar valores del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 🔹 Guardar cambios
  const handleGuardar = async () => {
    try {
      const res = await axios.put(
        `http://localhost:8000/api/turistas/${turista.id}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setTurista(res.data);
      setEditMode(false);
      alert("✅ Datos actualizados correctamente.");
    } catch (err) {
      console.error("Error al actualizar perfil:", err);
      alert("❌ No se pudo actualizar el perfil.");
    }
  };

  if (!turista) {
    return (
      <Container className="py-5">
        <Alert variant="warning" className="text-center">
          Debés iniciar sesión para acceder a tu perfil.
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={10}>
          <h2 className="fw-bold text-success mb-4 text-center">Mi Perfil</h2>

          {/* DATOS PERSONALES */}
          <Card className="shadow-sm mb-4">
            <Card.Body>
              <h5 className="fw-bold text-success mb-3">Datos personales</h5>

              {editMode ? (
                <>
                  <Form>
                    <Row className="mb-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Nombre</Form.Label>
                          <Form.Control
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleChange}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Apellido</Form.Label>
                          <Form.Control
                            name="apellido"
                            value={formData.apellido}
                            onChange={handleChange}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row className="mb-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>DNI</Form.Label>
                          <Form.Control
                            name="dni"
                            value={formData.dni}
                            onChange={handleChange}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Email</Form.Label>
                          <Form.Control
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row className="mb-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Teléfono</Form.Label>
                          <Form.Control
                            name="telefono"
                            value={formData.telefono}
                            onChange={handleChange}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Dirección</Form.Label>
                          <Form.Control
                            name="direccion"
                            value={formData.direccion}
                            onChange={handleChange}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>Nacionalidad</Form.Label>
                          <Form.Control
                            name="nacionalidad"
                            value={formData.nacionalidad}
                            onChange={handleChange}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Form>

                  <div className="d-flex gap-2 mt-3">
                    <Button variant="success" onClick={handleGuardar}>
                      Guardar cambios
                    </Button>
                    <Button
                      variant="outline-secondary"
                      onClick={() => setEditMode(false)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Row>
                    <Col md={6}>
                      <p><strong>Nombre:</strong> {turista.nombre} {turista.apellido}</p>
                      <p><strong>DNI:</strong> {turista.dni}</p>
                      <p><strong>Email:</strong> {turista.email}</p>
                    </Col>
                    <Col md={6}>
                      <p><strong>Teléfono:</strong> {turista.telefono}</p>
                      <p><strong>Dirección:</strong> {turista.direccion}</p>
                      <p><strong>Nacionalidad:</strong> {turista.nacionalidad}</p>
                    </Col>
                  </Row>
                  <Button
                    variant="outline-success"
                    onClick={() => setEditMode(true)}
                  >
                    Editar datos
                  </Button>
                </>
              )}
            </Card.Body>
          </Card>

          {/* RESERVAS */}
          <Card className="shadow-sm">
            <Card.Body>
              <h5 className="fw-bold text-success mb-3">Mis reservas</h5>
              {loading ? (
                <div className="text-center py-3">
                  <Spinner animation="border" variant="success" />
                </div>
              ) : error ? (
                <Alert variant="danger">{error}</Alert>
              ) : reservas.length === 0 ? (
                <p className="text-muted">No tenés reservas registradas.</p>
              ) : (
                reservas.map((r) => (
                  <div key={r.id_reserva} className="border rounded p-3 mb-3">
                    <h6 className="fw-bold">{r.excursion}</h6>
                    <p className="mb-1"><strong>Ubicación:</strong> {r.ubicacion}</p>
                    <p className="mb-1"><strong>Fecha de salida:</strong> {r.fecha_salida} - {r.hora_salida}</p>
                    <p className="mb-1"><strong>Cantidad de personas:</strong> {r.cantidad_personas}</p>
                    <p className="mb-1"><strong>Monto total:</strong> ${r.monto_total}</p>
                    <p>
                      <strong>Estado:</strong>{" "}
                      <span
                        className={
                          r.estado_reserva === "confirmada"
                            ? "text-success fw-semibold"
                            : r.estado_reserva === "pendiente"
                            ? "text-warning fw-semibold"
                            : "text-danger fw-semibold"
                        }
                      >
                        {r.estado_reserva}
                      </span>
                    </p>
                  </div>
                ))
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
