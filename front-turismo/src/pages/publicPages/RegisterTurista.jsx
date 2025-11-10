import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from "react-bootstrap";
import "../../styles/components/login.css";

export default function RegisterTurista() {
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    dni: "",
    email: "",
    password: "",
    telefono: "",
    direccion: "",
    nacionalidad: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const res = await axios.post("http://localhost:8000/api/auth/turistas/register", formData);
        if (res.status === 201) {
            setSuccess("Cuenta creada correctamente. Ya podés iniciar sesión.");
            setTimeout(() => navigate("/login-turista"), 2000);
        }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Error al registrarse.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container fluid className="p-0" style={{ overflow: "hidden" }}>
      <div className="login-page">
        <Row className="justify-content-center w-100">
          <Col xs={12} md={7} lg={5}>
            <Card className="shadow">
              <Card.Body className="p-4">
                <div className="brand mb-3 text-center">
                  <span className="brand-dot"></span>
                  <h1>Turismo Tucumán</h1>
                </div>
                <h4 className="text-center text-success fw-bold mb-4">Crear cuenta</h4>

                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}

                <Form onSubmit={handleSubmit}>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Nombre</Form.Label>
                        <Form.Control name="nombre" value={formData.nombre} onChange={handleChange} required />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Apellido</Form.Label>
                        <Form.Control name="apellido" value={formData.apellido} onChange={handleChange} required />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>DNI</Form.Label>
                        <Form.Control name="dni" value={formData.dni} onChange={handleChange} required />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Nacionalidad</Form.Label>
                        <Form.Control name="nacionalidad" value={formData.nacionalidad} onChange={handleChange} required/>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control type="email" name="email" value={formData.email} onChange={handleChange} required />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Contraseña</Form.Label>
                    <Form.Control
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Teléfono</Form.Label>
                    <Form.Control name="telefono" value={formData.telefono} onChange={handleChange} required/>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label>Dirección</Form.Label>
                    <Form.Control name="direccion" value={formData.direccion} onChange={handleChange} required/>
                  </Form.Group>

                  <Button type="submit" variant="success" className="w-100" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Spinner size="sm" className="me-2" /> Registrando...
                      </>
                    ) : (
                      "Registrarme"
                    )}
                  </Button>

                  <div className="text-center mt-3">
                    <small>¿Ya tenés cuenta?</small>
                    <br />
                    <Button
                      variant="link"
                      className="text-success fw-semibold p-0"
                      onClick={() => navigate("/login-turista")}
                    >
                      Iniciar sesión
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    </Container>
  );
}
