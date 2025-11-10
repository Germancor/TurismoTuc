import { Container, Row, Col, Card } from "react-bootstrap";
import "../../../styles/publicComponents/detalleex.css";

export default function ExcursionHero({ excursion, imagenes = [] }) {
  // Si hay imágenes cargadas, usa la primera
  const imagenPrincipal =
    imagenes.length > 0
      ? imagenes[0].url
      : excursion.imagen_url || "/placeholder.jpg";

  return (
    <section className="excursion-hero mb-4 position-relative">
      <Container fluid className="p-0">
        <Card className="border-0 rounded-0 overflow-hidden">
          {/* Imagen principal */}
          <div className="hero-image-container position-relative">
            <img
              src={imagenPrincipal}
              alt={excursion.titulo}
              className="hero-image w-100"
            />

            {/* Overlay con gradiente oscuro y texto */}
            <div className="hero-overlay position-absolute top-0 start-0 w-100 h-100 d-flex align-items-end">
              <Container className="pb-4">
                <Row>
                  <Col md={8} className="text-white">
                    <h1 className="fw-bold hero-title mb-2">
                      {excursion.titulo}
                    </h1>
                    <p className="mb-2 small text-light">
                      <i className="bi bi-geo-alt-fill me-1"></i>
                      {excursion.ubicacion}
                    </p>
                    <p className="hero-description mb-0">
                      {excursion.descripcion?.slice(0, 150)}...
                    </p>
                  </Col>
                </Row>
              </Container>
            </div>
          </div>
        </Card>
      </Container>
    </section>
  );
}
