import { Card, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import "../../../styles/publicComponents/catalogo.css";

export default function CatalogGrid({ excursiones }) {
  const navigate = useNavigate();


  return (
    <div className="row g-4">
      {excursiones.map((exc) => (
        <div
          key={exc.id_excursion}
          className="col-12 col-sm-6 col-md-4 col-lg-3"
        >
          <Card className="catalog-card shadow-sm h-100">
            <div className="catalog-card__img-wrapper">
              <Card.Img
                variant="top"
                src={
                  exc.imagen_url && exc.imagen_url !== ""
                    ? exc.imagen_url
                    : "/img/placeholder-excursion.jpg"
                }
                alt={exc.titulo}
                className="catalog-card__img"
              />
            </div>

            <Card.Body className="d-flex flex-column">
              <Card.Title className="mb-1 text-dark fw-semibold text-truncate">
                {exc.titulo}
              </Card.Title>

              <Card.Text className="text-muted small mb-2 catalog-card__desc">
                {exc.descripcion ? exc.descripcion.slice(0, 60) + "..." : ""}
              </Card.Text>

              <p className="fw-bold text-success mb-3">
                ${exc.precio_base?.toLocaleString("es-AR")} ARS
              </p>

              {/* Categorías */}
              {exc.categorias && exc.categorias.length > 0 && (
                <div className="mb-2 d-flex flex-wrap gap-1">
                  {exc.categorias.map((cat) => (
                    <span
                      key={cat.id_categoria_excursion}
                      className="badge bg-light text-dark border"
                    >
                      {cat.nombre_categoria}
                    </span>
                  ))}
                </div>
              )}

              {/* Botones */}
              <div className="mt-auto d-flex flex-column gap-2">
                <Button
                  variant="outline-success"
                  className="w-100"
                  onClick={() => navigate(`/excursion/${exc.id_excursion}`)}
                >
                  Ver detalles
                </Button>

                
              </div>
            </Card.Body>
          </Card>
        </div>
      ))}
    </div>
  );
}
