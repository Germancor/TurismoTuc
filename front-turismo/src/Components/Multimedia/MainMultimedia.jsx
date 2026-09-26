import { useEffect, useState } from "react";
import axios from "axios";
import {
  Card,
  Table,
  Button,
  Spinner,
  Badge,
  Tabs,
  Tab,
  Form,
  InputGroup,
} from "react-bootstrap";
import {
  FaCheck,
  FaTimes,
  FaArchive,
  FaExternalLinkAlt,
  FaFileExcel,
  FaCalendarAlt,
  FaCalendarCheck,
} from "react-icons/fa";
import Swal from "sweetalert2";
import PaginationComponent from "../Filtros/Paginacion";
import * as XLSX from "xlsx";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const API = "http://localhost:8000";

const isPdf = (url = "") => url.toLowerCase().endsWith(".pdf");

const MainMultimedia = () => {
  const [activeTab, setActiveTab] = useState("resenas");
  const [accionLoadingId, setAccionLoadingId] = useState(null);
  const [estadoFiltro, setEstadoFiltro] = useState("pendiente");
  const [filtroAnio, setFiltroAnio] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  const [dataResenas, setDataResenas] = useState({
    items: [],
    totalPages: 1,
    currentPage: 1,
  });
  const [dataComprobantes, setDataComprobantes] = useState({
    items: [],
    totalPages: 1,
    currentPage: 1,
  });
  const [loading, setLoading] = useState(false);

  const fetchData = async (tab, page = 1) => {
    setLoading(true);
    const endpoint =
      tab === "resenas"
        ? "/api/multimedia/pendientes"
        : "/api/comprobantes/pendientes";
    try {
      let fDesde = "";
      let fHasta = "";

      if (filtroAnio === "personalizado") {
        fDesde = fechaDesde;
        fHasta = fechaHasta;
      } else if (filtroAnio !== "") {
        fDesde = `${filtroAnio}-01-01`;
        fHasta = `${filtroAnio}-12-31`;
      }

      // Pasamos el estado al backend
      const res = await axios.get(`${API}${endpoint}`, {
        params: {
          page,
          limit: 10,
          estado: estadoFiltro,
          fechaDesde: fDesde,
          fechaHasta: fHasta,
        },
      });

      const arrayDatos = Array.isArray(res.data)
        ? res.data
        : res.data.data || [];
      const newState = {
        items: arrayDatos,
        totalPages: res.data.totalPages || 1,
        currentPage: res.data.currentPage || 1,
      };

      tab === "resenas"
        ? setDataResenas(newState)
        : setDataComprobantes(newState);
    } catch (err) {
      console.error("Error cargando datos:", err);
      Swal.fire("Error", "No se pudieron cargar los datos", "error");
    } finally {
      setLoading(false);
    }
  };

  // Recarga los datos cuando cambiás de pestaña o cambiás el filtro
  useEffect(() => {
    fetchData(activeTab, 1);
  }, [activeTab, estadoFiltro, filtroAnio, fechaDesde, fechaHasta]);

  const exportToExcel = () => {
    const dataToExport =
      activeTab === "resenas" ? dataResenas.items : dataComprobantes.items;
    if (dataToExport.length === 0) {
      return Swal.fire("Sin datos", "No hay datos para exportar", "info");
    }
    const ws = XLSX.utils.json_to_sheet(
      dataToExport.map((item) => ({
        ID: item.id_multimedia,
        Excursion_Reserva: item.excursion_titulo || item.id_reserva || "-",
        Turista: `${item.turista_nombre} ${item.turista_apellido}`,
        Estado: item.estado_moderacion,
        Fecha: item.fecha_creacion
          ? new Date(item.fecha_creacion).toLocaleDateString()
          : "-",
      })),
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Multimedia");
    XLSX.writeFile(wb, `Multimedia_${activeTab}.xlsx`);
  };

  const ejecutarAccion = async (id, tipo, contexto) => {
    const esComprobante = contexto === "comprobantes";
    const tituloBase = esComprobante ? "comprobante" : "foto";

    const { isConfirmed } = await Swal.fire({
      title: `¿${tipo.charAt(0).toUpperCase() + tipo.slice(1)} ${tituloBase}?`,
      icon: tipo === "eliminar" ? "warning" : "question",
      showCancelButton: true,
      confirmButtonText: "Confirmar",
      cancelButtonText: "Cancelar",
    });

    if (!isConfirmed) return;

    setAccionLoadingId(id);
    try {
      const url = esComprobante
        ? `${API}/api/comprobantes/${id}/${tipo}`
        : `${API}/api/multimedia/${id}/${tipo}`;

      await axios.put(url);
      Swal.fire("Éxito", "Operación realizada correctamente", "success");
      // Recargamos en la misma página que estábamos
      fetchData(
        activeTab,
        activeTab === "resenas"
          ? dataResenas.currentPage
          : dataComprobantes.currentPage,
      );
    } catch (err) {
      Swal.fire("Error", "No se pudo completar la acción", "error");
    } finally {
      setAccionLoadingId(null);
    }
  };

  return (
    <div className="container-fluid py-4">
      <Card className="card-premium shadow-sm">
        <Card.Header className="bg-white border-0 py-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h5 className="mb-0 text-success fw-bold">Gestión de Multimedia</h5>

          <div className="d-flex align-items-center gap-2 flex-wrap">
            <InputGroup size="sm" style={{ width: "auto" }}>
              <InputGroup.Text>
                <FaCalendarAlt className="me-1" /> Año
              </InputGroup.Text>
              <Form.Select
                value={filtroAnio}
                onChange={(e) => {
                  setFiltroAnio(e.target.value);
                  if (e.target.value !== "personalizado") {
                    setFechaDesde("");
                    setFechaHasta("");
                  }
                }}
              >
                <option value="">Este Año ({new Date().getFullYear()})</option>
                <option value={new Date().getFullYear() - 1}>
                  {new Date().getFullYear() - 1}
                </option>
                <option value={new Date().getFullYear() - 2}>
                  {new Date().getFullYear() - 2}
                </option>
                <option value={new Date().getFullYear() - 3}>
                  {new Date().getFullYear() - 3}
                </option>
                <option value="personalizado">Personalizado</option>
              </Form.Select>
            </InputGroup>

            {filtroAnio === "personalizado" && (
              <>
                <InputGroup size="sm" style={{ width: "auto" }}>
                  <InputGroup.Text>Desde</InputGroup.Text>
                  <Form.Control
                    type="date"
                    value={fechaDesde}
                    onChange={(e) => setFechaDesde(e.target.value)}
                  />
                </InputGroup>
                <InputGroup size="sm" style={{ width: "auto" }}>
                  <InputGroup.Text>Hasta</InputGroup.Text>
                  <Form.Control
                    type="date"
                    value={fechaHasta}
                    onChange={(e) => setFechaHasta(e.target.value)}
                  />
                </InputGroup>
              </>
            )}

            <span className="text-muted small fw-semibold">Mostrar:</span>
            <Form.Select
              size="sm"
              value={estadoFiltro}
              onChange={(e) => setEstadoFiltro(e.target.value)}
              style={{ width: "150px" }}
            >
              <option value="pendiente">Pendientes</option>
              <option value="aprobada">Aprobadas</option>
              <option value="rechazada">Rechazadas</option>
            </Form.Select>
            <Button
              variant="outline-success"
              size="sm"
              onClick={exportToExcel}
              title="Exportar a Excel"
            >
              <FaFileExcel />
            </Button>
          </div>
        </Card.Header>

        <Card.Body className="p-0">
          <Tabs
            activeKey={activeTab}
            onSelect={setActiveTab}
            className="px-3 mb-3"
          >
            <Tab eventKey="resenas" title="Reseñas (Fotos)" />
            <Tab
              eventKey="comprobantes"
              title="Comprobantes (Transferencias)"
            />
          </Tabs>

          {loading ? (
            <div className="py-4">
              <Skeleton count={8} height={45} className="mb-2" />
            </div>
          ) : (
            <div className="px-3">
              <Table responsive hover className="align-middle">
                <thead className="table-light">
                  <tr>
                    <th>ID</th>
                    <th>{activeTab === "resenas" ? "Excursión" : "Reserva"}</th>
                    <th>Turista</th>
                    <th>Archivo</th>
                    <th>Estado</th>
                    <th>Fecha creacion de archivo</th>
                    <th style={{ width: "200px" }} className="text-center">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(activeTab === "resenas"
                    ? dataResenas.items
                    : dataComprobantes.items
                  ).map((item) => {
                    const isPendiente = item.estado_moderacion === "pendiente";

                    return (
                      <tr key={item.id_multimedia}>
                        <td>{item.id_multimedia}</td>
                        <td>
                          {item.excursion_titulo || item.id_reserva || "-"}
                        </td>
                        <td>
                          {item.turista_nombre} {item.turista_apellido}
                        </td>
                        <td>
                          {item.url && (
                            <a
                              href={
                                item.url.startsWith("http")
                                  ? item.url
                                  : `${API}${item.url}`
                              }
                              target="_blank"
                              rel="noreferrer"
                            >
                              {isPdf(item.url) ? (
                                <span className="badge badge-soft-secondary">
                                  <FaExternalLinkAlt className="me-1" /> Ver PDF
                                </span>
                              ) : (
                                <img
                                  src={
                                    item.url.startsWith("http")
                                      ? item.url
                                      : `${API}${item.url}`
                                  }
                                  style={{
                                    width: 50,
                                    height: 50,
                                    objectFit: "cover",
                                    borderRadius: 4,
                                  }}
                                  alt="prev"
                                />
                              )}
                            </a>
                          )}
                        </td>
                        <td>
                          <span
                            className={`badge text-uppercase ${item.estado_moderacion === "aprobada" ? "badge-soft-success" : item.estado_moderacion === "rechazada" ? "badge-soft-danger" : "badge-soft-warning"}`}
                          >
                            {item.estado_moderacion}
                          </span>
                        </td>
                        <td>
                          {item.fecha_creacion
                            ? new Date(item.fecha_creacion).toLocaleString(
                                "es-AR",
                                {
                                  dateStyle: "short",
                                  timeStyle: "short",
                                },
                              )
                            : "-"}
                        </td>
                        <td className="text-center">
                          <div className="btn-group">
                            {/* Si ya está aprobada/rechazada, ocultamos estos botones */}
                            {isPendiente && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline-success"
                                  className="btn-action"
                                  title="Aprobar"
                                  onClick={() =>
                                    ejecutarAccion(
                                      item.id_multimedia,
                                      "aprobar",
                                      activeTab,
                                    )
                                  }
                                  disabled={
                                    accionLoadingId === item.id_multimedia
                                  }
                                >
                                  <FaCheck />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline-secondary"
                                  className="btn-action"
                                  title="Rechazar"
                                  onClick={() =>
                                    ejecutarAccion(
                                      item.id_multimedia,
                                      "rechazar",
                                      activeTab,
                                    )
                                  }
                                  disabled={
                                    accionLoadingId === item.id_multimedia
                                  }
                                >
                                  <FaTimes />
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="outline-danger"
                              className="btn-action"
                              title="Eliminar (Baja lógica)"
                              onClick={() =>
                                ejecutarAccion(
                                  item.id_multimedia,
                                  "eliminar",
                                  activeTab,
                                )
                              }
                              disabled={accionLoadingId === item.id_multimedia}
                            >
                              <FaArchive />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {(activeTab === "resenas"
                    ? dataResenas.items
                    : dataComprobantes.items
                  ).length === 0 && (
                    <tr>
                      <td colSpan="7" className="text-center py-5">
                        <div className="d-flex flex-column align-items-center justify-content-center text-muted">
                          <i
                            className="bi bi-inbox mb-2"
                            style={{ fontSize: "3rem", opacity: 0.5 }}
                          ></i>
                          <h5>No hay archivos multimedia registrados</h5>
                          <p className="mb-0 small">
                            Intenta buscar con otros filtros o cambia de año.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>

              <div className="d-flex justify-content-center mt-3">
                <PaginationComponent
                  currentPage={
                    activeTab === "resenas"
                      ? dataResenas.currentPage
                      : dataComprobantes.currentPage
                  }
                  totalPages={
                    activeTab === "resenas"
                      ? dataResenas.totalPages
                      : dataComprobantes.totalPages
                  }
                  onPageChange={(p) => fetchData(activeTab, p)}
                />
              </div>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default MainMultimedia;
