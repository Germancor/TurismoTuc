import { Card, Button } from "react-bootstrap";

export default function ExperienceCard({ excursion }) {
  const {
    titulo,
    descripcion,
    precio_base,
    duracion,
    ubicacion,
    estado,
  } = excursion;

  return (
    <Card className="experience-card h-100 shadow-sm border-0">
      <Card.Img
        variant="top"
        src="/assets/default-excursion.jpg"
        alt={titulo}
        className="card-img-top"
      />
      <Card.Body>
        <Card.Title>{titulo}</Card.Title>
        <Card.Text className="small text-muted mb-2">{ubicacion}</Card.Text>
        <Card.Text className="text-truncate" style={{ height: "3em" }}>
          {descripcion}
        </Card.Text>
        <p className="fw-bold mb-2">${precio_base} ARS</p>
        <p className="small text-muted mb-3">Duración: {duracion}</p>
        <Button
          variant="success"
          className="w-100"
          disabled={estado !== "activo"}
        >
          Ver detalles
        </Button>
      </Card.Body>
    </Card>
  );
}
