import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { Card, Form, Button, Spinner, Row, Col } from "react-bootstrap";

export default function FechasCreate() {
  const [excursiones, setExcursiones] = useState([]);
  const [form, setForm] = useState({
    id_excursion: "",
    fecha: "",
    hora_salida: "",
    cupo_maximo: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchExcursiones = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/excursiones`,
        {
          params: {
            sinPaginacion: true,
          },
        },
      );
      setExcursiones(res.data.data || []);
    } catch (err) {
      console.error("Error al cargar excursiones:", err);
      Swal.fire("Error", "No se pudieron cargar las excursiones.", "error");
    }
  };

  useEffect(() => {
    fetchExcursiones();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/excursiones/fechas-excursion`,
        form,
      );

      await Swal.fire({
        icon: "success",
        title: "Fecha creada",
        text: res.data.message || "La fecha fue registrada correctamente.",
        timer: 2000,
        showConfirmButton: false,
      });

      setForm({
        id_excursion: "",
        fecha: "",
        hora_salida: "",
        cupo_maximo: "",
      });
      navigate("/dashboard-admin/fechas");
    } catch (err) {
      console.error("Error al crear fecha:", err);
      Swal.fire(
        "Error",
        err.response?.data?.message || "No se pudo crear la fecha.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4">
      <div className="col-12 col-md-6 mb-2 mb-md-0">
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={() => navigate(-1)}
        >
          ← Volver
        </Button>
        <br />
      </div>
      <br />

      <Card className="shadow-sm">
        <div className="col-12 col-md-6 text-md-end">
          <h4 className="fw-bold text-success mb-0">
            Crear Nueva Fecha de Excursión
          </h4>
        </div>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Excursión</Form.Label>
              <Form.Select
                name="id_excursion"
                value={form.id_excursion}
                onChange={handleChange}
                required
              >
                <option value="">Seleccionar excursión</option>
                {excursiones.map((e) => (
                  <option key={e.id_excursion} value={e.id_excursion}>
                    {e.titulo}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Fecha</Form.Label>
                  <Form.Control
                    type="date"
                    name="fecha"
                    value={form.fecha}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Hora de salida</Form.Label>
                  <Form.Control
                    type="time"
                    name="hora_salida"
                    value={form.hora_salida}
                    onChange={handleChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-4">
              <Form.Label>Cupo máximo</Form.Label>
              <Form.Control
                type="number"
                name="cupo_maximo"
                value={form.cupo_maximo}
                onChange={handleChange}
                required
                min={1}
              />
            </Form.Group>

            <div className="d-flex justify-content-end">
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? (
                  <Spinner size="sm" animation="border" />
                ) : (
                  "Crear Fecha"
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}
