import { Tab, Nav } from "react-bootstrap";
import "../../../styles/publicComponents/detalleex.css"

export default function ExcursionTabs({ excursion }) {
  return (
    <section className="excursion-tabs mb-4">
      <Tab.Container defaultActiveKey="itinerario">
        <Nav variant="tabs" className="mb-3 justify-content-start flex-wrap">
          <Nav.Item>
            <Nav.Link eventKey="itinerario" className="fw-semibold">
              Itinerario
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="incluye" className="fw-semibold">
              Qué incluye
            </Nav.Link>
          </Nav.Item>
        </Nav>

        <Tab.Content>
          <Tab.Pane eventKey="itinerario">
            <p className="text-secondary small mb-1">
              📍 <strong>Punto de partida:</strong> {excursion.ubicacion}
            </p>
            <p>{excursion.itinerario || excursion.descripcion}</p>
          </Tab.Pane>

          <Tab.Pane eventKey="incluye">
            {excursion.incluye ? (
              <ul className="list-unstyled">
                {excursion.incluye.split(",").map((item, i) => (
                  <li key={i} className="mb-1">
                    ✅ {item.trim()}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted">Información no disponible.</p>
            )}
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>
    </section>
  );
}
