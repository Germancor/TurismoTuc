import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Card, Form, Button, Alert, Spinner } from "react-bootstrap";

export default function FechasEdit() {
  const { id } = useParams();
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

  const fetchFecha = async () => {
    try {
      const res = await axios.get(`http://localhost:8000/api/excursiones/fechas/${id}`);
      const { id_excursion, fecha, hora_salida, cupo_maximo } = res.data;
      setForm({
        id_excursion,
        fecha: fecha.slice(0, 10), // solo YYYY-MM-DD
        hora_salida: hora_salida?.slice(0, 5), // solo HH:mm
        cupo_maximo,
      });
    } catch (err) {
      console.error("Error al cargar fecha:", err);
      setError("No se pudo cargar la fecha.");
    }
  };

  useEffect(() => {
    fetchExcursiones();
    fetchFecha();
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
      const res = await axios.put(`http://localhost:8000/api/excursiones/fechas/${id}`, form);
      setMensaje(res.data.message);
      setTimeout(() => navigate("/dashboard-admin/fechas"), 1500);
    } catch (err) {
      console.error("Error al actualizar fecha:", err);
      setError(err.response?.data?.message || "No se pudo actualizar la fecha.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-sm">
      <Card.Body>
        <h5 className="fw-bold text-primary mb-3">Editar Fecha de Excursión</h5>

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
              {loading ? <Spinner size="sm" animation="border" /> : "Actualizar Fecha"}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
}