import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import useUserStore from "../store/useUserStore";
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from "react-bootstrap";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const { user, setUser, clearUser } = useUserStore();

  // ✅ Nuevo: si ya hay un usuario guardado, redirigir según su rol
  useEffect(() => {
    if (user) {
      const rol = user.rol?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (rol === "administrador") {
        navigate("/dashboard-admin", { replace: true });
      } else if (rol === "guia turistico" || rol === "guía turístico") {
        navigate("/dashboard-guia", { replace: true });
      } else if (rol === "personal de ventas") {
        navigate("/dashboard-empleados", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
<<<<<<< HEAD
      const response = await axios.post("http://localhost:3000/api/usuarios/login", { email, password });
=======
      const response = await axios.post("http://localhost:8000/api/usuarios/login", {
        email,
        password,
      });
>>>>>>> 11a842a815243a574b791de4b79350240d6415a4

      if (response.data.success) {
        const userData = response.data.user;
        setUser(userData);

        const rol = userData.rol?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        if (rol === "administrador") navigate("/dashboard-admin");
        else if (rol === "guia turistico" || rol === "guía turístico") navigate("/dashboard-guia");
        else if (rol === "personal de ventas") navigate("/dashboard-empleados");
        else {
          clearUser();
          setError("No tiene permisos para acceder al panel.");
        }
      } else {
        setError(response.data.message || "Error al iniciar sesión.");
      }
    } catch (err) {
      console.error("Error en el login:", err);
      setError("Email o contraseña incorrectos.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container fluid className="p-0" style={{ overflow: "hidden" }}>
      <div className="login-page">
        <Row className="justify-content-center w-100">
          <Col xs={12} md={6} lg={4}>
            <br />
            <Card className="shadow">
              <Card.Body className="p-4">
                <h4 className="text-center text-success fw-bold mb-4">Inicio de sesión</h4>

                {error && (
                  <Alert variant="danger" className="py-2">
                    {error}
                    <div className="mt-2 text-center">
                      <Button variant="outline-secondary" size="sm" onClick={() => clearUser()}>
                        Reintentar
                      </Button>
                    </div>
                  </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Email</Form.Label>
                    <Form.Control
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">Contraseña</Form.Label>
                    <Form.Control
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </Form.Group>

                  <Button type="submit" variant="success" className="w-100" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        Ingresando...
                      </>
                    ) : (
                      "Ingresar"
                    )}
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    </Container>
  );
}
