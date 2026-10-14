import { useEffect, useState } from "react";

import { useParams, useNavigate } from "react-router-dom";

import axios from "axios";

import { Card, Button, Badge, Table, Spinner } from "react-bootstrap";

export default function ViewExcursion() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [excursion, setExcursion] = useState(null);
  const [fechas, setFechas] = useState([]);
  const [imagenes, setImagenes] = useState([]);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const resExc = await axios.get(
          `${import.meta.env.VITE_API_URL}/excursiones/${id}`,
        );

        setExcursion(resExc.data);

        if (Array.isArray(resExc.data.imagenes)) {
          setImagenes(resExc.data.imagenes);
        } else {
          const resImgs = await axios.get(
            `${import.meta.env.VITE_API_URL}/excursiones/${id}/multimedia`,
          );

          setImagenes(resImgs.data);
        }

        const resFechas = await axios.get(
          `${import.meta.env.VITE_API_URL}/excursiones/${id}/fechas`,
        );

        setFechas(resFechas.data);
      } catch (err) {
        console.error("Error al cargar datos de la excursión:", err);

        if (err.response?.status === 404) {
          setExcursion(null);
          setError("");
        } else {
          setError("No se pudo cargar la excursión.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // =============================
  // CARGANDO
  // =============================

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="success" />
        <p className="mt-3">Cargando excursión...</p>
      </div>
    );
  }

  // =============================
  // ERROR
  // =============================

  if (error) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger text-center">{error}</div>
      </div>
    );
  }

  // =============================
  // EXCURSIÓN NO ENCONTRADA
  // =============================

  if (!excursion) {
    return (
      <div className="container mt-4">
        <div className="card shadow-sm p-4 text-center">
          <h5 className="fw-bold text-warning mb-2">Excursión no encontrada</h5>

          <p className="text-muted mb-3">
            Es posible que esta excursión haya sido eliminada.
            <br />
            Si querés volver a visualizarla, podés restaurarla desde el listado
            de excursiones.
          </p>

          <div>
            <Button
              variant="outline-secondary"
              onClick={() => navigate("/dashboard-admin/excursiones")}
            >
              ← Volver al listado
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // =============================
  // VISTA
  // =============================

  return (
    <div className="container py-4">
      <div className="mb-3">
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={() => navigate("/dashboard-admin/excursiones")}
        >
          ← Volver al listado
        </Button>
      </div>

      <Card className="shadow-sm mb-4">
        <Card.Body>
          <div className="row mb-3 align-items-center">
            <div className="col-12 col-md-6">
              <h4 className="fw-bold text-success mb-0">{excursion.titulo}</h4>
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-md-6">
              <strong>Ubicación:</strong> {excursion.ubicacion}
            </div>

            <div className="col-md-6">
              <strong>Precio base:</strong> ${excursion.precio_base}
            </div>
          </div>

          <div className="row mb-3">
            <div className="col-md-6">
              <strong>Estado:</strong>{" "}
              <Badge bg={excursion.estado === "activa" ? "success" : "warning"}>
                {excursion.estado}
              </Badge>
            </div>

            <div className="col-md-6">
              <strong>Guía asignado:</strong>{" "}
              {excursion.nombre_guia ? (
                <span
                  className="text-primary text-decoration-underline"
                  role="button"
                  onClick={() =>
                    navigate(
                      `/dashboard-admin/usuarios/view/${excursion.id_guia}`,
                    )
                  }
                >
                  {excursion.nombre_guia} {excursion.apellido_guia}
                </span>
              ) : (
                <span className="text-muted">Sin guía</span>
              )}
            </div>
          </div>

          <div className="mb-3">
            <strong>Descripción:</strong>

            <p className="mb-0">{excursion.descripcion}</p>
          </div>

          <div className="mb-3">
            <strong>Categorías:</strong>{" "}
            {excursion.categorias?.length > 0 ? (
              excursion.categorias.map((cat) => (
                <Badge
                  key={cat.id_categoria_excursion}
                  bg="info"
                  className="me-1"
                >
                  {cat.nombre_categoria}
                </Badge>
              ))
            ) : (
              <span className="text-muted">Sin categoría</span>
            )}
          </div>
        </Card.Body>
      </Card>

      {/* =============================
          GALERÍA
      ============================= */}

      {imagenes.length > 0 && (
        <div className="mb-4">
          <h5 className="fw-bold">Galería</h5>

          <div className="row g-3">
            {imagenes.map((img) => (
              <div key={img.id_multimedia} className="col-6 col-sm-4 col-md-3">
                <Card className="shadow-sm h-100">
                  <Card.Img
                    variant="top"
                    src={img.url}
                    alt={img.descripcion || "Imagen de excursión"}
                    style={{
                      height: "140px",
                      objectFit: "cover",
                    }}
                  />

                  <Card.Body className="p-2 text-center">
                    <small className="text-muted">Imagen de excursión</small>
                  </Card.Body>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}

      <hr />

      {/* =============================
          FECHAS
      ============================= */}

      <h5 className="fw-bold mb-3">Fechas disponibles</h5>

      {fechas.length === 0 ? (
        <p className="text-muted">No hay fechas registradas.</p>
      ) : (
        <Table responsive bordered size="sm">
          <thead className="table-light">
            <tr>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Cupo</th>
              <th>Disponible</th>
              <th>Estado</th>
            </tr>
          </thead>

          <tbody>
            {fechas.map((f) => (
              <tr key={f.id_fecha}>
                <td>{new Date(f.fecha).toLocaleDateString()}</td>

                <td>{f.hora_salida?.slice(0, 5)}</td>

                <td>{f.cupo_maximo}</td>

                <td>{f.cupo_disponible}</td>

                <td>{f.estado}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}
