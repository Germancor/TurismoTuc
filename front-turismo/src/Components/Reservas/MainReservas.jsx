import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { Card, Button, Table, Dropdown, InputGroup, Form } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useDebounce } from "../../hooks/useDeBounce";
import PaginationComponent from "../Filtros/Paginacion.jsx";
import * as XLSX from "xlsx";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function ReservasMain() {
  const [reservas, setReservas] = useState([]);
  const [mostrarArchivadas, setMostrarArchivadas] = useState(false); // 👈 NUEVO: Estado booleano para el botón toggle
  const [estadoreserva, setEstadoreserva] = useState("relevantes");
  const [filtroAnio, setFiltroAnio] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  const [dniBuscar, setDniBuscar] = useState("");
  const debouncedDni = useDebounce(dniBuscar, 500);

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const porPagina = 10;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getReservas = async () => {
    setLoading(true);
    setError(null);
    const params = {
      mostrarArchivadas: mostrarArchivadas ? "true" : "false", // Mandamos el string esperado por el back
      estadoreserva,
      page: paginaActual,
      limit: porPagina,
    };

    if (filtroAnio === "personalizado") {
      params.fechaDesde = fechaDesde;
      params.fechaHasta = fechaHasta;
    } else if (filtroAnio !== "") {
      params.fechaDesde = `${filtroAnio}-01-01`;
      params.fechaHasta = `${filtroAnio}-12-31`;
    }

    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/reservas`, {
        params,
      });
      setReservas(res.data.data);
      setTotalPaginas(res.data.totalPages);
    } catch (err) {
      console.error("Error al obtener reservas:", err);
      setError("No se pudieron cargar las reservas.");
    } finally {
      setLoading(false);
    }
  };

  const getReservasConFechas = async (desde, hasta) => {
    setLoading(true);
    setError(null);
    const params = {
      mostrarArchivadas: mostrarArchivadas ? "true" : "false",
      estadoreserva,
    };

    if (filtroAnio === "personalizado") {
      params.fechaDesde = fechaDesde;
      params.fechaHasta = fechaHasta;
    } else if (filtroAnio !== "") {
      params.fechaDesde = `${filtroAnio}-01-01`;
      params.fechaHasta = `${filtroAnio}-12-31`;
    }


    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/reservas`, {
        params,
      });
      setReservas(res.data);
    } catch (err) {
      console.error("Error al obtener reservas:", err);
      setError("No se pudieron cargar las reservas.");
    } finally {
      setLoading(false);
    }
  };

  // Reinicia la paginación cuando cambian los filtros, el toggle o fechas
  useEffect(() => {
    setPaginaActual(1);
  }, [estadoreserva, filtroAnio, fechaDesde, fechaHasta, mostrarArchivadas]);

  // Cada vez que cambia un estado importante, fetch (con o sin archivadas)
  useEffect(() => {
    getReservas();
  }, [estadoreserva, filtroAnio, fechaDesde, fechaHasta, paginaActual, mostrarArchivadas]);

  const handleRestore = async (id) => {
    const confirm = await Swal.fire({
      title: "¿Restaurar reserva?",
      text: "La reserva volverá a estar activa y visible en el listado principal.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, restaurar",
      cancelButtonText: "Cancelar",
    });

    if (!confirm.isConfirmed) return;

    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/reservas/restore/${id}`);
      Swal.fire("Restaurada", "La reserva ha sido restaurada con éxito", "success");
      getReservas();
    } catch (err) {
      console.error("Error al restaurar reserva:", err);
      Swal.fire("Error", "No se pudo restaurar la reserva", "error");
    }
  };

  const exportToExcel = () => {
    if (reservas.length === 0) {
      return Swal.fire("Sin datos", "No hay reservas para exportar", "info");
    }
    const ws = XLSX.utils.json_to_sheet(reservas.map(r => ({
      DNI: r.dni_turista,
      Turista: r.turista,
      Excursion: r.excursion,
      Fecha_Excursion: r.fecha_excursion ? new Date(r.fecha_excursion).toLocaleDateString() : "-",
      Cantidad_Personas: r.cantidad_personas,
      Monto_Total: r.monto_total,
      Estado: r.estado_reserva,
      Fecha_Reserva: r.fecha_reserva ? new Date(r.fecha_reserva).toLocaleDateString() : "-"
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reservas");
    XLSX.writeFile(wb, "Reservas_Export.xlsx");
  };

  const buscarPorDNI = async (dni) => {
    if (!dni) {
      setPaginaActual(1);
      getReservas();
      return;
    }

    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/reservas/buscar?dni=${dni}`
      );
      setReservas(res.data);
      setTotalPaginas(1);
      setPaginaActual(1);
    } catch (err) {
      console.error("Error al buscar por DNI:", err);
      setReservas([]);
      setTotalPaginas(1);
      setPaginaActual(1);
    }
  };

  useEffect(() => {
    if (debouncedDni.trim() === "") {
      getReservas();
    } else {
      buscarPorDNI(debouncedDni);
    }
  }, [debouncedDni]);

  if (error) return <div className="alert alert-danger mt-3">{error}</div>;

  return (
    <div className="container-fluid py-4">
      <Card className="card-premium shadow-sm">
        <Card.Body className="p-3">
          {/* Encabezado */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 className="fw-bold text-success mb-2">
              Gestión de Reservas{" "}
              <small className="text-muted" style={{ textTransform: "lowercase" }}>
                {/* ({mostrarArchivadas ? "archivadas" : "activas"}) */}
              </small>
            </h5>

            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Buscar por DNI..."
              value={dniBuscar}
              onChange={(e) => setDniBuscar(e.target.value)}
              style={{ maxWidth: "200px" }}
            />
          </div>

          <div className="d-flex align-items-center gap-2">
            <Button
              as={Link}
              to="/dashboard-admin/reservas/create"
              variant="success"
              size="sm"
            >
              <i className="bi bi-plus-circle me-1"></i> Crear Reserva
            </Button>

            {/* Dropdown: Filtro por estado_reserva (Limpio de finalizadas/canceladas) */}
            <Dropdown align="end">
              <Dropdown.Toggle variant="outline-primary" size="sm">
                <i className="bi bi-funnel"></i> Filtrar estado
              </Dropdown.Toggle>

              <Dropdown.Menu>
                <Dropdown.Item onClick={() => setEstadoreserva("relevantes")}>
                  <i className="bi bi-star-fill text-primary me-2"></i>
                  Solo Relevantes
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={() => setEstadoreserva("pendiente")}>
                  <i className="bi bi-hourglass-split text-warning me-2"></i>
                  Pendientes
                </Dropdown.Item>
                <Dropdown.Item onClick={() => setEstadoreserva("confirmada")}>
                  <i className="bi bi-check-circle text-success me-2"></i>
                  Confirmadas
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>

            {/* Dropdown: Filtro de fechas */}
            <InputGroup size="sm" style={{ width: "auto" }}>
              <InputGroup.Text><i className="bi bi-calendar-event me-1"></i> Año</InputGroup.Text>
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
                <option value={new Date().getFullYear() - 1}>{new Date().getFullYear() - 1}</option>
                <option value={new Date().getFullYear() - 2}>{new Date().getFullYear() - 2}</option>
                <option value={new Date().getFullYear() - 3}>{new Date().getFullYear() - 3}</option>
                <option value="personalizado">Personalizado</option>
              </Form.Select>
            </InputGroup>

            {filtroAnio === "personalizado" && (
              <>
                <InputGroup size="sm" style={{ width: "auto" }}>
                  <InputGroup.Text>Desde</InputGroup.Text>
                  <Form.Control type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} />
                </InputGroup>
                <InputGroup size="sm" style={{ width: "auto" }}>
                  <InputGroup.Text>Hasta</InputGroup.Text>
                  <Form.Control type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} />
                </InputGroup>
              </>
            )}

            <Button
              variant={mostrarArchivadas ? "success" : "outline-danger"}
              size="sm"
              onClick={() => setMostrarArchivadas(!mostrarArchivadas)}
              title="Mostrar u ocultar reservas archivadas"
            >
              {mostrarArchivadas ? (
                <>
                  <i className="bi bi-arrow-left-circle me-1"></i> Volver a Activas
                </>
              ) : (
                <>
                  <i className="bi bi-archive-fill me-1"></i> Mostrar Archivadas
                </>
              )}
            </Button>
            
            <Button variant="outline-success" size="sm" onClick={exportToExcel} title="Exportar a Excel">
              <i className="bi bi-file-earmark-excel"></i> Excel
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="p-4">
            {[...Array(5)].map((_, i) => (
              <p key={i} className="placeholder-glow mb-3">
                <span className="placeholder col-12 placeholder-lg bg-secondary opacity-25 rounded" style={{ height: "40px" }}></span>
              </p>
            ))}
          </div>
        ) : loading ? (
          <div className="py-4">
            <Skeleton count={8} height={45} className="mb-2" />
          </div>
        ) : (
          <>
            {/* Tabla de reservas */}
        <Table hover responsive className="align-middle">
          <thead className="table-light">
            <tr>
              <th className="d-none d-md-table-cell">DNI</th>
              <th>Turista</th>
              <th>Excursión</th>
              <th>Fecha Excursión</th>
              <th>Cantidad</th>
              <th>Monto Total</th>
              <th>Estado</th>
              <th className="d-none d-md-table-cell">Fecha Reserva</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {reservas.length > 0 ? (
              reservas.map((r) => (
                <tr key={r.id_reserva}>
                  <td className="d-none d-md-table-cell">{r.dni_turista}</td>
                  <td>{r.turista}</td>
                  <td>{r.excursion}</td>
                  <td>{new Date(r.fecha_excursion).toLocaleDateString()}</td>
                  <td>{r.cantidad_personas}</td>
                  <td>${parseFloat(r.monto_total).toFixed(2)}</td>
                  <td>
                    <span
                      className={`badge text-uppercase ${
                        r.estado_reserva === "confirmada"
                          ? "badge-soft-success"
                          : r.estado_reserva === "pendiente"
                          ? "badge-soft-warning"
                          : r.estado_reserva === "finalizada"
                          ? "badge-soft-info"
                          : "badge-soft-danger"
                      }`}
                    >
                      {r.estado_reserva}
                    </span>
                  </td>
                  <td className="d-none d-md-table-cell">{new Date(r.fecha_reserva).toLocaleDateString()}</td>
                  <td>
                    <div className="btn-group" role="group">
                      <Button
                        as={Link}
                        to={`/dashboard-admin/reservas/view/${r.id_reserva}`}
                        variant="outline-secondary"
                        size="sm"
                        className="btn-action"
                        title="Ver Voucher"
                      >
                        <i className="bi bi-eye"></i>
                      </Button>

                      <Button
                        as={Link}
                        to={`/dashboard-admin/reservas/edit/${r.id_reserva}`}
                        variant="outline-primary"
                        size="sm"
                        className="btn-action"
                        title="Editar Reserva"
                      >
                        <i className="bi bi-pencil"></i>
                      </Button>

                      {/* 👈 BOTÓN DE RESTAURAR: Solo si la reserva está efectivamente archivada */}
                      {Number(r.eliminado) === 1 && (
                        <Button
                          variant="outline-success"
                          size="sm"
                          className="btn-action"
                          onClick={() => handleRestore(r.id_reserva)}
                          title="Restaurar Reserva"
                        >
                          <i className="bi bi-arrow-counterclockwise"></i>
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="text-center py-5">
                  <div className="d-flex flex-column align-items-center justify-content-center text-muted">
                    <i className="bi bi-inbox mb-2" style={{ fontSize: "3rem", opacity: 0.5 }}></i>
                    <h5>No hay reservas registradas</h5>
                    <p className="mb-0 small">Intenta buscar con otros filtros o cambia de año.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </Table>
        </>
        )}
        {/* Paginación */}
        {!debouncedDni && (
          <PaginationComponent
            currentPage={paginaActual}
            totalPages={totalPaginas}
            onPageChange={(page) => setPaginaActual(page)}
          />
        )}
        </Card.Body>
      </Card>
    </div>
  );
}