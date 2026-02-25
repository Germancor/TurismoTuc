// src/Components/Multimedia/MainMultimedia.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { Card, Table, Button, Spinner, Badge, Tabs, Tab } from "react-bootstrap";
import { FaCheck, FaTimes, FaTrash, FaExternalLinkAlt } from "react-icons/fa";
import Swal from "sweetalert2";

const API = "http://localhost:8000";

const isPdf = (url = "") => url.toLowerCase().endsWith(".pdf");

const MainMultimedia = () => {
  const [activeTab, setActiveTab] = useState("resenas");

  // reseñas (fotos) pendientes
  const [itemsResenas, setItemsResenas] = useState([]);
  const [loadingResenas, setLoadingResenas] = useState(true);
  const [errorResenas, setErrorResenas] = useState("");

  // comprobantes pendientes
  const [itemsComprobantes, setItemsComprobantes] = useState([]);
  const [loadingComprobantes, setLoadingComprobantes] = useState(false);
  const [errorComprobantes, setErrorComprobantes] = useState("");

  const [accionLoadingId, setAccionLoadingId] = useState(null);

  const fetchPendientesResenas = async () => {
    setLoadingResenas(true);
    setErrorResenas("");
    try {
      const res = await axios.get(`${API}/api/multimedia/pendientes`);
      setItemsResenas(res.data || []);
    } catch (err) {
      console.error("Error al cargar multimedia pendiente:", err);
      setErrorResenas("No se pudo cargar la lista de multimedia pendiente.");
    } finally {
      setLoadingResenas(false);
    }
  };

  const fetchPendientesComprobantes = async () => {
    setLoadingComprobantes(true);
    setErrorComprobantes("");
    try {
      // ✅ este endpoint lo creamos en back
      const res = await axios.get(`${API}/api/comprobantes/pendientes`);
      setItemsComprobantes(res.data || []);
    } catch (err) {
      console.error("Error al cargar comprobantes pendientes:", err);
      setErrorComprobantes("No se pudo cargar la lista de comprobantes.");
    } finally {
      setLoadingComprobantes(false);
    }
  };

  useEffect(() => {
    fetchPendientesResenas();
  }, []);

  // Cuando cambia a tab comprobantes, los trae
  useEffect(() => {
    if (activeTab === "comprobantes") {
      fetchPendientesComprobantes();
    }
  }, [activeTab]);

  const ejecutarAccion = async (id, tipo, contexto) => {
    // contexto: "resenas" | "comprobantes"
    const esComprobante = contexto === "comprobantes";

    const tituloBase = esComprobante ? "comprobante" : "foto";

    // Confirmaciones
    if (tipo === "aprobar") {
      const { isConfirmed } = await Swal.fire({
        title: `¿Aprobar ${tituloBase}?`,
        text: esComprobante
          ? "El comprobante quedará marcado como aprobado."
          : "La foto será visible en la galería de la excursión.",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Sí, aprobar",
        cancelButtonText: "Cancelar",
      });
      if (!isConfirmed) return;
    }

    if (tipo === "eliminar") {
      const { isConfirmed } = await Swal.fire({
        title: `¿Eliminar ${tituloBase}?`,
        text: "Esta acción no se puede deshacer.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
      });
      if (!isConfirmed) return;
    }

    setAccionLoadingId(id);

    try {
      let url = "";
      let successMsg = "";

      // ✅ endpoints existentes para reseñas
      if (!esComprobante) {
        if (tipo === "aprobar") {
          url = `${API}/api/multimedia/${id}/aprobar`;
          successMsg = "La foto fue aprobada correctamente.";
        }
        if (tipo === "rechazar") {
          url = `${API}/api/multimedia/${id}/rechazar`;
          successMsg = "La foto fue rechazada.";
        }
        if (tipo === "eliminar") {
          url = `${API}/api/multimedia/${id}/eliminar`;
          successMsg = "La foto fue eliminada.";
        }
      }

      // ✅ endpoints nuevos para comprobantes
      if (esComprobante) {
        if (tipo === "aprobar") {
          url = `${API}/api/comprobantes/${id}/aprobar`;
          successMsg = "El comprobante fue aprobado.";
        }
        if (tipo === "rechazar") {
          url = `${API}/api/comprobantes/${id}/rechazar`;
          successMsg = "El comprobante fue rechazado.";
        }
        if (tipo === "eliminar") {
          url = `${API}/api/comprobantes/${id}/eliminar`;
          successMsg = "El comprobante fue eliminado.";
        }
      }

      await axios.put(url);

      if (esComprobante) await fetchPendientesComprobantes();
      else await fetchPendientesResenas();

      Swal.fire({
        icon: "success",
        title: "Operación exitosa",
        text: successMsg,
        showConfirmButton: false,
        timer: 1600,
      });
    } catch (err) {
      console.error(`Error al ${tipo}:`, err);
      const msg = err?.response?.data?.message || `No se pudo ${tipo}.`;

      if (esComprobante) setErrorComprobantes(msg);
      else setErrorResenas(msg);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: msg,
      });
    } finally {
      setAccionLoadingId(null);
    }
  };

  return (
    <div className="container-fluid mt-3">
      <Card className="shadow-sm">
        <Card.Header className="bg-white border-0 d-flex justify-content-between align-items-center">
          <h5 className="mb-0 text-success fw-bold">Gestión de Multimedia</h5>
          <span className="text-muted small">
            Moderación de fotos y comprobantes
          </span>
        </Card.Header>

        <Card.Body className="p-0">
          <div className="p-3 pb-0">
            <Tabs
              activeKey={activeTab}
              onSelect={(k) => setActiveTab(k)}
              className="mb-3"
            >
              <Tab eventKey="resenas" title="Reseñas (Fotos pendientes)" />
              <Tab eventKey="comprobantes" title="Comprobantes (Transferencias)" />
            </Tabs>
          </div>

          {/* ===== TAB RESEÑAS ===== */}
          {activeTab === "resenas" && (
            <>
              {loadingResenas ? (
                <div className="text-center my-4">
                  <Spinner animation="border" />
                  <p className="text-muted mt-2">Cargando multimedia...</p>
                </div>
              ) : errorResenas ? (
                <div className="alert alert-danger m-3">{errorResenas}</div>
              ) : itemsResenas.length === 0 ? (
                <p className="text-muted text-center m-3">
                  No hay fotos pendientes de moderación.
                </p>
              ) : (
                <Table responsive hover className="mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>ID</th>
                      <th>Excursión</th>
                      <th>Turista</th>
                      <th>Vista previa</th>
                      <th>Descripción</th>
                      <th>Estado</th>
                      <th style={{ width: "240px" }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemsResenas.map((item) => (
                      <tr key={item.id_multimedia}>
                        <td>{item.id_multimedia}</td>
                        <td>{item.excursion_titulo || "-"}</td>
                        <td>
                          {item.turista_nombre
                            ? `${item.turista_nombre} ${item.turista_apellido || ""}`
                            : "-"}
                        </td>
                        <td>
                          {item.url && (
                            <img
                              src={item.url}
                              alt="Foto reseña"
                              style={{
                                width: "90px",
                                height: "60px",
                                objectFit: "cover",
                                borderRadius: "6px",
                              }}
                            />
                          )}
                        </td>
                        <td className="text-truncate" style={{ maxWidth: 220 }}>
                          {item.descripcion || "—"}
                        </td>
                        <td>
                          <Badge bg="warning" text="dark">
                            {item.estado_moderacion}
                          </Badge>
                        </td>
                        <td>
                          <div className="d-flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="success"
                              disabled={accionLoadingId === item.id_multimedia}
                              onClick={() =>
                                ejecutarAccion(item.id_multimedia, "aprobar", "resenas")
                              }
                            >
                              <FaCheck className="me-1" />
                              Aprobar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-secondary"
                              disabled={accionLoadingId === item.id_multimedia}
                              onClick={() =>
                                ejecutarAccion(item.id_multimedia, "rechazar", "resenas")
                              }
                            >
                              <FaTimes className="me-1" />
                              Rechazar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-danger"
                              disabled={accionLoadingId === item.id_multimedia}
                              onClick={() =>
                                ejecutarAccion(item.id_multimedia, "eliminar", "resenas")
                              }
                            >
                              <FaTrash className="me-1" />
                              Eliminar
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </>
          )}

          {/* ===== TAB COMPROBANTES ===== */}
          {activeTab === "comprobantes" && (
            <>
              {loadingComprobantes ? (
                <div className="text-center my-4">
                  <Spinner animation="border" />
                  <p className="text-muted mt-2">Cargando comprobantes...</p>
                </div>
              ) : errorComprobantes ? (
                <div className="alert alert-danger m-3">{errorComprobantes}</div>
              ) : itemsComprobantes.length === 0 ? (
                <p className="text-muted text-center m-3">
                  No hay comprobantes pendientes.
                </p>
              ) : (
                <Table responsive hover className="mb-0 align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>ID</th>
                      <th>Reserva</th>
                      <th>Turista</th>
                      <th>Excursión</th>
                      <th>Fecha</th>
                      <th>Archivo</th>
                      <th>Descripción</th>
                      <th>Estado</th>
                      <th style={{ width: "240px" }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemsComprobantes.map((c) => (
                      <tr key={c.id_multimedia}>
                        <td>{c.id_multimedia}</td>
                        <td>{c.id_reserva || "-"}</td>
                        <td>
                          {c.turista_nombre
                            ? `${c.turista_nombre} ${c.turista_apellido || ""}`
                            : "-"}
                          {c.email ? (
                            <div className="small text-muted">{c.email}</div>
                          ) : null}
                        </td>
                        <td>{c.excursion_titulo || "-"}</td>
                        <td>{c.fecha ? new Date(c.fecha).toLocaleDateString("es-AR") : "-"}</td>
                        <td>
                          {c.url ? (
                            isPdf(c.url) ? (
                              <a
                                href={c.url.startsWith("http") ? c.url : `${API}${c.url}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-decoration-none"
                              >
                                <FaExternalLinkAlt className="me-1" />
                                Abrir PDF
                              </a>
                            ) : (
                              <a
                                href={c.url.startsWith("http") ? c.url : `${API}${c.url}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <img
                                  src={c.url.startsWith("http") ? c.url : `${API}${c.url}`}
                                  alt="Comprobante"
                                  style={{
                                    width: "90px",
                                    height: "60px",
                                    objectFit: "cover",
                                    borderRadius: "6px",
                                  }}
                                />
                              </a>
                            )
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="text-truncate" style={{ maxWidth: 220 }}>
                          {c.descripcion || "—"}
                        </td>
                        <td>
                          <Badge bg="warning" text="dark">
                            {c.estado_moderacion}
                          </Badge>
                        </td>
                        <td>
                          <div className="d-flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="success"
                              disabled={accionLoadingId === c.id_multimedia}
                              onClick={() =>
                                ejecutarAccion(c.id_multimedia, "aprobar", "comprobantes")
                              }
                            >
                              <FaCheck className="me-1" />
                              Aprobar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-secondary"
                              disabled={accionLoadingId === c.id_multimedia}
                              onClick={() =>
                                ejecutarAccion(c.id_multimedia, "rechazar", "comprobantes")
                              }
                            >
                              <FaTimes className="me-1" />
                              Rechazar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-danger"
                              disabled={accionLoadingId === c.id_multimedia}
                              onClick={() =>
                                ejecutarAccion(c.id_multimedia, "eliminar", "comprobantes")
                              }
                            >
                              <FaTrash className="me-1" />
                              Eliminar
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default MainMultimedia;
