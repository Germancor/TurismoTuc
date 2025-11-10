import { Carousel, Row, Col, Card } from "react-bootstrap";
import "../../../styles/publicComponents/detalleex.css";

export default function ExcursionGallery({ excursion }) {
  // ✅ Validar el array de imágenes reales que viene del backend
  const imagenes = excursion?.imagenes || [];

  return (
    <section className="excursion-gallery mt-5 mb-4">
      <h5 className="fw-bold text-teal mb-3">Galería de imágenes</h5>

      {imagenes.length > 0 ? (
        <Carousel
          variant="dark"
          interval={4000}
          indicators={imagenes.length > 1}
          controls={imagenes.length > 1}
          className="shadow-sm rounded overflow-hidden"
        >
          {imagenes.map((img, index) => (
            <Carousel.Item key={img.id_multimedia || index}>
              <img
                src={img.url}
                alt={img.descripcion || `Imagen ${index + 1}`}
                className="d-block w-100 gallery-image"
              />
            </Carousel.Item>
          ))}
        </Carousel>
      ) : (
        <p className="text-muted">
          No hay imágenes disponibles para esta excursión.
        </p>
      )}
    </section>
  );
}
