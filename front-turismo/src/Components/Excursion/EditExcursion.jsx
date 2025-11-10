import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Row, Col, Form, Button, Spinner } from "react-bootstrap";
import FechasExcursion from "./FechaExcursion.jsx";

export default function EditExcursion() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [excursion, setExcursion] = useState(null);
  const [imagenes, setImagenes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [guias, setGuias] = useState([]);
  const [nuevaUrl, setNuevaUrl] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resExc = await axios.get(`http://localhost:8000/api/excursiones/${id}`);
        const data = resExc.data;
        const id_categoria_excursion = data.categorias?.[0]?.id_categoria_excursion || "";
        setExcursion({ ...data, id_categoria_excursion, id_guia: data.id_guia || "" });

        const resImgs = await axios.get(`http://localhost:8000/api/excursiones/${id}/multimedia`);
        setImagenes(resImgs.data);

        const resCats = await axios.get("http://localhost:8000/api/categorias");
        setCategorias(resCats.data);

        const resGuias = await axios.get("http://localhost:8000/api/excursiones/guias");
        setGuias(resGuias.data);
      } catch (err) {
        console.error("Error al cargar datos:", err);
      }
    };
    fetchData();
  }, [id]);

  const handleChange = (e) => {
    setExcursion({ ...excursion, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:8000/api/excursiones/${id}`, excursion);

      if (excursion.id_categoria_excursion) {
        await axios.post("http://localhost:8000/api/categorias/actualizar", {
          id_excursion: id,
          id_categoria_excursion: excursion.id_categoria_excursion,
        });
      }

      if (nuevaUrl.trim() !== "") {
        await axios.post("http://localhost:8000/api/excursiones/multimedia", {
          id_excursion: id,
          url: nuevaUrl,
          descripcion: "Imagen agregada desde la edición",
          tipo: "foto",
        });

        const resImgs = await axios.get(`http://localhost:8000/api/excursiones/${id}/multimedia`);
        setImagenes(resImgs.data);
        setNuevaUrl("");
      }

      alert("Excursión actualizada correctamente ✅");
      navigate("/dashboard-admin/excursiones");
    } catch (err) {
      console.error("Error al actualizar excursión:", err);
      alert("Error al actualizar excursión ❌");
    }
  };

  const handleEliminarImagen = async (id_multimedia) => {
    if (!window.confirm("¿Eliminar esta imagen?")) return;
    try {
      await axios.delete(`http://localhost:8000/api/multimedia/${id_multimedia}`);
      setImagenes((prev) => prev.filter((img) => img.id_multimedia !== id_multimedia));
    } catch (err) {
      console.error("Error al eliminar imagen:", err);
    }
  };

  if (!excursion) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
        <p className="text-muted mt-2">Cargando excursión...</p>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h4 className="fw-bold mb-4">Editar Excursión</h4>
      <Form onSubmit={handleSubmit}>
        {/* Sección 1: Información general */}
        <h6 className="fw-semibold mb-3">Información general</h6>
        <Row className="mb-3">
          <Col md={6}>
            <Form.Group>
              <Form.Label>Título</Form.Label>
              <Form.Control name="titulo" value={excursion.titulo} onChange={handleChange} />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label>Ubicación</Form.Label>
              <Form.Control name="ubicacion" value={excursion.ubicacion} onChange={handleChange} />
            </Form.Group>
          </Col>
        </Row>

        {/* Sección 2: Detalles */}
        <h6 className="fw-semibold mb-3">Detalles</h6>
        <Row className="mb-3">
          <Col md={4}>
            <Form.Group>
              <Form.Label>Precio Base</Form.Label>
              <Form.Control type="number" name="precio_base" value={excursion.precio_base} onChange={handleChange} />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label>Estado</Form.Label>
              <Form.Select name="estado" value={excursion.estado} onChange={handleChange}>
                <option value="activa">Activa</option>
                <option value="inactiva">Inactiva</option>
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        <Form.Group className="mb-3">
          <Form.Label>Descripción</Form.Label>
          <Form.Control as="textarea" rows={4} name="descripcion" value={excursion.descripcion || ""} onChange={handleChange} />
        </Form.Group>

        {/* Sección 3: Asignaciones */}
        <h6 className="fw-semibold mb-3">Asignaciones</h6>
        <Row className="mb-3">
          <Col md={6}>
            <Form.Group>
              <Form.Label>Categoría</Form.Label>
              <Form.Select name="id_categoria_excursion" value={excursion.id_categoria_excursion} onChange={handleChange}>
                <option value="">Seleccionar categoría</option>
                {categorias.map((cat) => (
                  <option key={cat.id_categoria_excursion} value={cat.id_categoria_excursion}>
                    {cat.nombre_categoria}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label>Guía asignado</Form.Label>
              <Form.Select name="id_guia" value={excursion.id_guia} onChange={handleChange}>
                <option value="">Seleccionar guía</option>
                {guias.map((g) => (
                  <option key={g.id_usuario} value={g.id_usuario}>
                    {g.nombre} {g.apellido}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        {/* Sección 4: Imagen */}
        <h6 className="fw-semibold mb-3">Agregar imagen</h6>
        <Form.Group className="mb-3">
          <Form.Label>URL de imagen principal</Form.Label>
          <Form.Control
            type="text"
            placeholder="https://tuservidor.com/imagenes/excursion.jpg"
            value={nuevaUrl}
            onChange={(e) => setNuevaUrl(e.target.value)}
          />
          <Form.Text className="text-muted">
            Pegá la URL de una nueva imagen (se agregará al guardar).
          </Form.Text>
        </Form.Group>

        <Button type="submit" variant="success">Guardar cambios</Button>
      </Form>

      {/* Sección 5: Galería */}
      {imagenes.length > 0 && (
        <div className="mt-5">
          <h6 className="fw-bold mb-3">Imágenes actuales</h6>
          <div className="d-flex flex-wrap gap-3">
            {imagenes.map((img) => (
              <div key={img.id_multimedia} className="position-relative">
                <img
                  src={img.url}
                  alt="Imagen"
                  className="img-thumbnail"
                  style={{ maxHeight: "200px" }}
                />
                <Button
                  variant="danger"
                  size="sm"
                  className="position-absolute top-0 end-0"
                  onClick={() => handleEliminarImagen(img.id_multimedia)}
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <hr className="my-4" />
      <FechasExcursion id_excursion={id} />
    </div>
  );
}