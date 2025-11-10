import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, Form, Button, Alert, Spinner } from "react-bootstrap";

export default function FechasCreate() {
  const [excursiones, setExcursiones] = useState([]);
  const [form, setForm] = useState({
    id_excursion: "",
    fecha: "",
    hora_salida: "",
    cupo_maximo: "",
  });
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchExcursiones = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/excursiones");
      setExcursiones(res.data);
    } catch (err) {
      console.error("Error al cargar excursiones:", err);
      setError("No se pudieron cargar las excursiones.");
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
    setMensaje("");
    setError("");
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:8000/api/excursiones/fechas-excursion", form);
      setMensaje(res.data.message);
      setForm({ id_excursion: "", fecha: "", hora_salida: "", cupo_maximo: "" });
      setTimeout(() => navigate("/dashboard-admin/fechas"), 1500);
    } catch (err) {
      console.error("Error al crear fecha:", err);
      console.log("Respuesta del backend:", err.response?.data);
      setError(err.response?.data?.message || "No se pudo crear la fecha.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-sm">
      <Card.Body>
        <h5 className="fw-bold text-primary mb-3">Crear Nueva Fecha de Excursión</h5>

        {mensaje && <Alert variant="success">{mensaje}</Alert>}
        {error && <Alert variant="danger">{error}</Alert>}

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

          <Form.Group className="mb-3">
            <Form.Label>Fecha</Form.Label>
            <Form.Control
              type="date"
              name="fecha"
              value={form.fecha}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Hora de salida</Form.Label>
            <Form.Control
              type="time"
              name="hora_salida"
              value={form.hora_salida}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group className="mb-3">
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
            <Button variant="secondary" className="me-2" onClick={() => navigate(-1)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? <Spinner size="sm" animation="border" /> : "Crear Fecha"}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
}