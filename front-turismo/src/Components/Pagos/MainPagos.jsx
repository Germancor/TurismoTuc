import { useEffect, useState } from "react";
import axios from "axios";
import {
  Card,
  Table,
  Button,
  Badge,
  Spinner,
  Modal,
  Dropdown,
  Form,
  InputGroup,
} from "react-bootstrap";
import Swal from "sweetalert2";
import BuscadorGeneral from "../Filtros/BuscadorGeneral";
import PaginationComponent from "../Filtros/Paginacion";
import * as XLSX from "xlsx";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const MainPagos = () => {
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados de Filtros
  const [filtroEstado, setFiltroEstado] = useState("pendiente");
  const [busqueda, setBusqueda] = useState("");
  const [filtroAnio, setFiltroAnio] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);

  // Reservas asociadas a cada pago
  const [reservasPorPago, setReservasPorPago] = useState({});

  // Modal de reservas
  const [mostrarReservas, setMostrarReservas] = useState(false);
  const [reservasSeleccionadas, setReservasSeleccionadas] = useState([]);
  const [loadingReservas, setLoadingReservas] = useState(false);

  const fetchPagos = async () => {
    setLoading(true);

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

      const params = {
        page: paginaActual,
        limit: 10,
        estado: filtroEstado !== "todos" ? filtroEstado : null,
        q: busqueda,
        fechaDesde: fDesde,
        fechaHasta: fHasta,
      };

      const res = await axios.get(`${import.meta.env.VITE_API_URL}/pagos`, {
        params,
      });

      const pagosData = res.data.data || [];

      setPagos(pagosData);
      setTotalPaginas(res.data.totalPages || 1);

      /*
       * Para saber si un pago tiene una o varias reservas:
       *
       * - Si ya tiene id_reserva, sabemos que tiene una sola.
       * - Si no tiene id_reserva pero tiene id_carrito,
       *   buscamos las reservas de ese carrito.
       */
      const reservasMap = {};

      await Promise.all(
        pagosData.map(async (pago) => {
          if (pago.id_reserva != null) {
            reservasMap[pago.id_pago] = [
              {
                id_reserva: pago.id_reserva,
              },
            ];

            return;
          }

          if (pago.id_carrito != null) {
            try {
              const reservasRes = await axios.get(
                `${import.meta.env.VITE_API_URL}/pagos/carrito/${pago.id_carrito}/reservas`,
              );

              reservasMap[pago.id_pago] = reservasRes.data || [];
            } catch (error) {
              console.error(
                `Error al obtener reservas del carrito ${pago.id_carrito}:`,
                error,
              );

              reservasMap[pago.id_pago] = [];
            }
          }
        }),
      );

      setReservasPorPago(reservasMap);
    } catch (err) {
      console.error("Error al obtener pagos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPaginaActual(1);
  }, [filtroEstado, busqueda, filtroAnio, fechaDesde, fechaHasta]);

  useEffect(() => {
    fetchPagos();
  }, [
    paginaActual,
    filtroEstado,
    busqueda,
    filtroAnio,
    fechaDesde,
    fechaHasta,
  ]);

  const exportToExcel = () => {
    if (pagos.length === 0) {
      return Swal.fire("Sin datos", "No hay datos para exportar", "info");
    }

    const ws = XLSX.utils.json_to_sheet(
      pagos.map((p) => ({
        ID: p.id_pago,
        Turista: `${p.turista_nombre} ${p.turista_apellido}`,
        Metodo: p.metodo,
        Monto: p.monto,
        Estado: p.estado_pago,
        Reserva: p.id_reserva,
        Fecha: p.fecha_pago ? new Date(p.fecha_pago).toLocaleDateString() : "-",
      })),
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pagos");
    XLSX.writeFile(wb, "Pagos_Export.xlsx");
  };

  const actualizarEstado = async (id_pago, nuevo_estado) => {
    const confirm = await Swal.fire({
      title: `¿Confirmar ${nuevo_estado}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí",
    });

    if (!confirm.isConfirmed) return;

    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/pagos/${id_pago}`, {
        nuevo_estado,
      });

      fetchPagos();

      Swal.fire("Éxito", "Estado actualizado", "success");
    } catch (err) {
      Swal.fire("Error", "No se pudo actualizar", "error");
    }
  };

  // Abrir modal con las reservas del pago
  const verReservas = async (pago) => {
    setMostrarReservas(true);

    // Si ya tenemos las reservas cargadas, usamos esas
    if (reservasPorPago[pago.id_pago]?.length > 0) {
      setReservasSeleccionadas(reservasPorPago[pago.id_pago]);
      return;
    }

    // Si tiene carrito, volvemos a consultar por seguridad
    if (pago.id_carrito != null) {
      setLoadingReservas(true);

      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/pagos/carrito/${pago.id_carrito}/reservas`,
        );

        setReservasSeleccionadas(res.data || []);

        setReservasPorPago((prev) => ({
          ...prev,
          [pago.id_pago]: res.data || [],
        }));
      } catch (error) {
        console.error("Error al obtener reservas:", error);

        setReservasSeleccionadas([]);

        Swal.fire("Error", "No se pudieron obtener las reservas", "error");
      } finally {
        setLoadingReservas(false);
      }

      return;
    }

    setReservasSeleccionadas([]);
  };

  const cerrarModalReservas = () => {
    setMostrarReservas(false);
    setReservasSeleccionadas([]);
  };

  return (
    <>
      <div className="container-fluid py-4">
        <Card className="card-premium shadow-sm">
          <Card.Body className="p-3">
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <div>
                <h5 className="fw-bold text-success mb-2">Gestión de Pagos</h5>

                <div style={{ maxWidth: "250px" }}>
                  <BuscadorGeneral
                    placeholder="Turista o método..."
                    onBuscar={(val) => setBusqueda(val)}
                  />
                </div>
              </div>

              <div className="d-flex align-items-center gap-2 flex-wrap">
                <InputGroup size="sm" style={{ width: "auto" }}>
                  <InputGroup.Text>
                    <i className="bi bi-calendar-event me-1"></i> Año
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
                    <option value="">
                      Este Año ({new Date().getFullYear()})
                    </option>

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

                <Dropdown align="end">
                  <Dropdown.Toggle variant="outline-primary" size="sm">
                    <i className="bi bi-funnel"></i> Filtrar estado:{" "}
                    {filtroEstado.toUpperCase()}
                  </Dropdown.Toggle>

                  <Dropdown.Menu>
                    {["pendiente", "aprobado", "rechazado"].map((est) => (
                      <Dropdown.Item
                        key={est}
                        onClick={() => setFiltroEstado(est)}
                      >
                        {est.charAt(0).toUpperCase() + est.slice(1)}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>

                <Button
                  variant="outline-success"
                  size="sm"
                  onClick={exportToExcel}
                  title="Exportar a Excel"
                >
                  <i className="bi bi-file-earmark-excel"></i> Excel
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="py-4">
                <Skeleton count={8} height={45} className="mb-2" />
              </div>
            ) : (
              <Table hover responsive className="align-middle">
                <thead className="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Turista</th>
                    <th>Método</th>
                    <th>Monto</th>
                    <th>Estado</th>
                    <th>Fecha de pago</th>
                    <th>Reserva</th>
                    <th>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {pagos.length > 0 ? (
                    pagos.map((p) => {
                      const reservas = reservasPorPago[p.id_pago] || [];

                      return (
                        <tr key={p.id_pago}>
                          <td>{p.id_pago}</td>

                          <td>
                            {p.turista_nombre} {p.turista_apellido}
                          </td>

                          <td>{p.metodo}</td>

                          <td>${Number(p.monto).toLocaleString("es-AR")}</td>

                          <td>
                            <span
                              className={`badge text-uppercase ${
                                p.estado_pago === "aprobado"
                                  ? "badge-soft-success"
                                  : p.estado_pago === "pendiente"
                                    ? "badge-soft-warning"
                                    : "badge-soft-danger"
                              }`}
                            >
                              {p.estado_pago}
                            </span>
                          </td>

                          <td>
                            {p.fecha_pago
                              ? new Date(p.fecha_pago).toLocaleDateString()
                              : "-"}
                          </td>

                          {/* RESERVA */}
                          <td>
                            {reservas.length === 1 ? (
                              reservas[0].id_reserva
                            ) : reservas.length > 1 ? (
                              <Button
                                size="sm"
                                variant="outline-primary"
                                className="btn-action"
                                title="Ver reservas"
                                onClick={() => verReservas(p)}
                              >
                                <i className="bi bi-eye"></i>
                              </Button>
                            ) : p.id_reserva != null ? (
                              p.id_reserva
                            ) : (
                              "-"
                            )}
                          </td>

                          {/* ACCIONES */}
                          <td>
                            {p.estado_pago === "pendiente" && (
                              <div className="btn-group">
                                <Button
                                  size="sm"
                                  variant="outline-success"
                                  className="btn-action"
                                  onClick={() =>
                                    actualizarEstado(p.id_pago, "aprobado")
                                  }
                                >
                                  <i className="bi bi-check2"></i>
                                </Button>

                                <Button
                                  size="sm"
                                  variant="outline-danger"
                                  className="btn-action"
                                  onClick={() =>
                                    actualizarEstado(p.id_pago, "rechazado")
                                  }
                                >
                                  <i className="bi bi-x"></i>
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center py-5">
                        <div className="d-flex flex-column align-items-center justify-content-center text-muted">
                          <i
                            className="bi bi-inbox mb-2"
                            style={{
                              fontSize: "3rem",
                              opacity: 0.5,
                            }}
                          ></i>

                          <h5>No hay pagos registrados</h5>

                          <p className="mb-0 small">
                            Intenta buscar con otros filtros o cambia de año.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            )}

            <PaginationComponent
              currentPage={paginaActual}
              totalPages={totalPaginas}
              onPageChange={setPaginaActual}
            />
          </Card.Body>
        </Card>
      </div>

      {/* MODAL DE RESERVAS */}
      <Modal
        show={mostrarReservas}
        onHide={cerrarModalReservas}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Reservas asociadas al pago</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {loadingReservas ? (
            <div className="text-center py-4">
              <Spinner animation="border" />
            </div>
          ) : reservasSeleccionadas.length > 0 ? (
            <Table hover responsive className="align-middle">
              <thead className="table-light">
                <tr>
                  <th>Reserva</th>
                  <th>Excursión</th>
                  <th>Fecha</th>
                  <th>Personas</th>
                  <th>Monto</th>
                  <th>Estado</th>
                </tr>
              </thead>

              <tbody>
                {reservasSeleccionadas.map((reserva) => (
                  <tr key={reserva.id_reserva}>
                    <td>{reserva.id_reserva}</td>

                    <td>{reserva.nombre_excursion || "-"}</td>

                    <td>
                      {reserva.fecha
                        ? new Date(reserva.fecha).toLocaleDateString()
                        : "-"}
                    </td>

                    <td>{reserva.cantidad_personas}</td>

                    <td>
                      ${Number(reserva.monto_total).toLocaleString("es-AR")}
                    </td>

                    <td>
                      <span
                        className={`badge text-uppercase ${
                          reserva.estado_reserva === "confirmada"
                            ? "badge-soft-success"
                            : reserva.estado_reserva === "pendiente"
                              ? "badge-soft-warning"
                              : "badge-soft-danger"
                        }`}
                      >
                        {reserva.estado_reserva}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <div className="text-center text-muted py-4">
              No se encontraron reservas asociadas.
            </div>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={cerrarModalReservas}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default MainPagos;
