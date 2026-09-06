import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { Card, Form, Button, Spinner, Row, Col } from "react-bootstrap";

export default function FechasEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [excursiones, setExcursiones] = useState([]);

  const [form, setForm] = useState({
    id_excursion: "",
    fecha: "",
    hora_salida: "",
    cupo_maximo: "",
    estado: "abierta",
  });

  const [loading, setLoading] = useState(false);

  // =====================================================
  // CARGAR TODAS LAS EXCURSIONES
  // =====================================================
  const fetchExcursiones = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/excursiones`,
        {
          params: {
            sinPaginacion: "true",
          },
        },
      );

      setExcursiones(res.data.data || []);
    } catch (err) {
      console.error("Error al cargar excursiones:", err);

      Swal.fire("Error", "No se pudieron cargar las excursiones.", "error");
    }
  };

  // =====================================================
  // CARGAR FECHA A EDITAR
  // =====================================================
  const fetchFecha = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/excursiones/fechas/${id}`,
      );

      const { id_excursion, fecha, hora_salida, cupo_maximo, estado } =
        res.data;

      setForm({
        id_excursion: id_excursion || "",
        fecha: fecha ? fecha.slice(0, 10) : "",
        hora_salida: hora_salida ? hora_salida.slice(0, 5) : "",
        cupo_maximo: cupo_maximo || "",
        estado: estado || "abierta",
      });
    } catch (err) {
      console.error("Error al cargar fecha:", err);

      Swal.fire("Error", "No se pudo cargar la fecha.", "error");
    }
  };

  // =====================================================
  // CARGA INICIAL
  // =====================================================
  useEffect(() => {
    fetchExcursiones();
    fetchFecha();
  }, [id]);

  // =====================================================
  // CAMBIOS DEL FORMULARIO
  // =====================================================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================================
  // ACTUALIZAR FECHA
  // =====================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/excursiones/fechas/${id}`,
        form,
      );

      await Swal.fire({
        icon: "success",
        title: "Fecha actualizada",
        text: res.data.message || "Los cambios se guardaron correctamente.",
        timer: 2000,
        showConfirmButton: false,
      });

      navigate("/dashboard-admin/fechas");
    } catch (err) {
      console.error("Error al actualizar fecha:", err);

      Swal.fire(
        "Error",
        err.response?.data?.message || "No se pudo actualizar la fecha.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4">
      {/* VOLVER */}
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
            Editar Fecha de Excursión
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
              <Form.Text className="text-muted">
                Se muestran todas las excursiones disponibles.
              </Form.Text>
            </Form.Group>

            {/* FECHA Y HORA */}
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

            {/* CUPO */}
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

            {/* ESTADO */}
            <Form.Group className="mb-4">
              <Form.Label>Estado</Form.Label>

              <Form.Select
                name="estado"
                value={form.estado}
                onChange={handleChange}
                required
              >
                <option value="abierta">Abierta</option>

                <option value="cerrada">Cerrada</option>
              </Form.Select>

              <Form.Text className="text-muted">
                Las fechas cerradas no estarán disponibles para nuevas reservas.
              </Form.Text>
            </Form.Group>
            <div className="d-flex justify-content-end">
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? (
                  <Spinner size="sm" animation="border" />
                ) : (
                  "Actualizar Fecha"
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}
