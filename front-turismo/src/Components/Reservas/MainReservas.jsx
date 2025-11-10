import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { Card, Button, Table, Dropdown, Spinner, Alert } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useDebounce } from "../../hooks/useDeBounce";

export default function ReservasMain() {
  const [reservas, setReservas] = useState([]);
  const [filtro, setFiltro] = useState("activas"); // 'activas', 'eliminadas' o 'todas' como filtros
  const [estadoreserva, setEstadoreserva] = useState("todas"); // 'pendiente', 'confirmada', 'cancelada' o 'todas'
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [temporalDesde, setTemporalDesde] = useState(
    fechaDesde ? new Date(fechaDesde) : null
  );
  const [temporalHasta, setTemporalHasta] = useState(
    fechaHasta ? new Date(fechaHasta) : null
  );
  const [openCalendar, setOpenCalendar] = useState(false); // para mostrar/ocultar el calendario

  const [dniBuscar, setDniBuscar] = useState("");
  const debouncedDni = useDebounce(dniBuscar, 500);

  //Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const porPagina = 10;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getReservas = async () => {
    setLoading(true);
    setError(null);
    const params = {
      filtro,
      estadoreserva,
      fechaDesde,
      fechaHasta,
      page: paginaActual,
      limit: porPagina,
    };
    try {
      const res = await axios.get("http://localhost:8000/api/reservas", {
        params,
      });

      console.log("Actual filtro:", filtro);
      console.log("Actual estado:", estadoreserva);
      //console.log("reponse:", res.data);
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
      filtro,
      estadoreserva,
      fechaDesde: desde,
      fechaHasta: hasta,
    };

    try {
      const res = await axios.get("http://localhost:8000/api/reservas", {
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

  // Efecto 1: reinicia la paginación cuando cambian los filtros o fechas
  useEffect(() => {
    setPaginaActual(1);
  }, [filtro, estadoreserva, fechaDesde, fechaHasta]);

  // Efecto 2: carga las reservas cuando cambia la página o filtros
  useEffect(() => {
    getReservas();
  }, [filtro, estadoreserva, fechaDesde, fechaHasta, paginaActual]);

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "¿Eliminar reserva?",
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!confirm.isConfirmed) return;

    try {
      await axios.delete(`http://localhost:8000/api/reservas/${id}`);
      Swal.fire("Eliminada", "La reserva ha sido eliminada", "success");
      getReservas();
    } catch (err) {
      console.error("Error al eliminar reserva:", err);
      Swal.fire("Error", "No se pudo eliminar la reserva", "error");
    }
  };

  const handleRestore = async (id) => {
    const confirm = await Swal.fire({
      title: "¿Restaurar reserva?",
      text: "La reserva volverá a estar activa",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, restaurar",
      cancelButtonText: "Cancelar",
    });

    if (!confirm.isConfirmed) return;

    try {
      await axios.put(`http://localhost:8000/api/reservas/restore/${id}`);
      Swal.fire("Restaurada", "La reserva ha sido restaurada", "success");
      getReservas();
    } catch (err) {
      console.error("Error al restaurar reserva:", err);
      Swal.fire("Error", "No se pudo restaurar la reserva", "error");
    }
  };

  // 🔎 Buscar reservas por DNI en el backend
  const buscarPorDNI = async (dni) => {
    if (!dni) {
      // si el input queda vacío, mostrar todas las reservas otra vez
      getReservas();
      return;
    }

    try {
      const res = await axios.get(
        `http://localhost:8000/api/reservas/buscar?dni=${dni}`
      );
      setReservas(res.data);
    } catch (err) {
      console.error("Error al buscar por DNI:", err);
      setReservas([]); // limpiar tabla si no hay resultados o error
    }
  };

  // 🕒 Efecto de búsqueda en tiempo real con debounce
  useEffect(() => {
    if (debouncedDni.trim() === "") {
      getReservas(); // si el campo está vacío → mostrar todas
    } else {
      buscarPorDNI(debouncedDni); // si hay algo → buscar por DNI
    }
  }, [debouncedDni]);

  if (loading)
    return <div className="text-center mt-3">Cargando reservas...</div>;
  if (error) return <div className="alert alert-danger mt-3">{error}</div>;

  return (
    <Card className="shadow-sm mt-5">
      <Card.Body className="p-3">
        {/* Encabezado */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 className="fw-bold text-success mb-2">
              Gestión de Reservas{" "}
              <small className="text-muted">({estadoreserva})</small>
            </h5>

            {/* 🔍 Input de búsqueda en tiempo real */}
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
            {/* Botón Crear Reserva */}
            <Button
              as={Link}
              to="/dashboard-admin/reservas/create"
              variant="success"
              size="sm"
            >
              <i className="bi bi-plus-circle me-1"></i> Crear Reserva
            </Button>

            {/* Dropdown: Filtrar activas / eliminadas / todas */}
            <Dropdown align="end">
              <Dropdown.Toggle variant="outline-primary" size="sm">
                <i className="bi bi-funnel"></i> Filtrar activas
              </Dropdown.Toggle>

              <Dropdown.Menu>
                <Dropdown.Item onClick={() => setFiltro("activas")}>
                  <i className="bi bi-check-circle text-success me-2"></i>
                  Activas
                </Dropdown.Item>
                <Dropdown.Item onClick={() => setFiltro("eliminadas")}>
                  <i className="bi bi-x-circle text-danger me-2"></i>
                  Eliminadas
                </Dropdown.Item>
                <Dropdown.Item onClick={() => setFiltro("todas")}>
                  <i className="bi bi-list-ul text-secondary me-2"></i>
                  Todas
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>

            {/* Dropdown: Filtro por estado_reserva */}
            <Dropdown align="end">
              <Dropdown.Toggle variant="outline-primary" size="sm">
                <i className="bi bi-funnel"></i> Filtrar estado
              </Dropdown.Toggle>

              <Dropdown.Menu>
                <Dropdown.Item onClick={() => setEstadoreserva("pendiente")}>
                  <i className="bi bi-hourglass-split text-warning me-2"></i>
                  Pendientes
                </Dropdown.Item>
                <Dropdown.Item onClick={() => setEstadoreserva("confirmada")}>
                  <i className="bi bi-check-circle text-success me-2"></i>
                  Confirmadas
                </Dropdown.Item>
                <Dropdown.Item onClick={() => setEstadoreserva("cancelada")}>
                  <i className="bi bi-x-circle text-danger me-2"></i>
                  Canceladas
                </Dropdown.Item>
                <Dropdown.Item onClick={() => setEstadoreserva("todas")}>
                  <i className="bi bi-list-ul text-secondary me-2"></i>
                  Todas
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>

            {/* Dropdown: Filtro de fechas */}
            <Dropdown align="end" autoClose="outside">
              <Dropdown.Toggle variant="outline-primary" size="sm">
                <i className="bi bi-calendar-range"></i> Filtrar por fecha
              </Dropdown.Toggle>

              <Dropdown.Menu className="p-3" style={{ minWidth: "280px" }}>
                {/* Este mes */}
                <Dropdown.Item
                  onClick={() => {
                    const hoy = new Date();
                    const primerDia = new Date(
                      hoy.getFullYear(),
                      hoy.getMonth(),
                      1
                    )
                      .toISOString()
                      .split("T")[0];
                    const ultimoDia = new Date(
                      hoy.getFullYear(),
                      hoy.getMonth() + 1,
                      0
                    )
                      .toISOString()
                      .split("T")[0];

                    setFechaDesde(primerDia);
                    setFechaHasta(ultimoDia);
                    getReservasConFechas(primerDia, ultimoDia);
                  }}
                >
                  <i className="bi bi-calendar-month text-primary me-2"></i>{" "}
                  Este mes
                </Dropdown.Item>

                {/* Este año */}
                <Dropdown.Item
                  onClick={() => {
                    const hoy = new Date();
                    const primerDia = new Date(hoy.getFullYear(), 0, 1)
                      .toISOString()
                      .split("T")[0];
                    const ultimoDia = new Date(hoy.getFullYear(), 11, 31)
                      .toISOString()
                      .split("T")[0];

                    setFechaDesde(primerDia);
                    setFechaHasta(ultimoDia);
                    getReservasConFechas(primerDia, ultimoDia);
                  }}
                >
                  <i className="bi bi-calendar3 text-success me-2"></i> Este año
                </Dropdown.Item>

                <Dropdown.Divider />

                <Dropdown.Item
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenCalendar(!openCalendar);
                  }}
                >
                  Personalizado
                </Dropdown.Item>

                {openCalendar && (
                  <div className="p-2">
                    <label>Desde:</label>
                    <DatePicker
                      selected={temporalDesde}
                      onChange={(date) => setTemporalDesde(date)}
                      dateFormat="yyyy-MM-dd"
                      className="form-control mb-2"
                      placeholderText="Fecha inicio"
                    />

                    <label>Hasta:</label>
                    <DatePicker
                      selected={temporalHasta}
                      onChange={(date) => setTemporalHasta(date)}
                      dateFormat="yyyy-MM-dd"
                      className="form-control mb-2"
                      placeholderText="Fecha fin"
                    />

                    <Button
                      variant="primary"
                      className="w-100 mb-2"
                      onClick={() => {
                        if (temporalDesde)
                          setFechaDesde(
                            temporalDesde.toISOString().split("T")[0]
                          );
                        if (temporalHasta)
                          setFechaHasta(
                            temporalHasta.toISOString().split("T")[0]
                          );
                        getReservas();
                        setOpenCalendar(false);
                      }}
                    >
                      Aplicar
                    </Button>

                    <Button
                      variant="outline-secondary"
                      className="w-100"
                      onClick={() => {
                        setFechaDesde("");
                        setFechaHasta("");
                        setTemporalDesde(null);
                        setTemporalHasta(null);
                        getReservas();
                        setOpenCalendar(false);
                      }}
                    >
                      Limpiar
                    </Button>
                  </div>
                )}
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>

        {/* Tabla de reservas */}
        <Table hover responsive className="align-middle">
          <thead className="table-light">
            <tr>
              {/* <th>ID</th> */}
              <th>DNI</th>
              <th>Turista</th>
              <th>Excursión</th>
              <th>Fecha Excursión</th>
              <th>Cantidad</th>
              <th>Monto Total</th>
              <th>Estado</th>
              <th>Fecha Reserva</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {reservas.length > 0 ? (
              reservas.map((r) => (
                <tr key={r.id_reserva}>
                  {/* <td>{r.id_reserva}</td> */}
                  <td>{r.dni_turista}</td>
                  <td>{r.turista}</td>
                  <td>{r.excursion}</td>
                  <td>{new Date(r.fecha_excursion).toLocaleDateString()}</td>
                  <td>{r.cantidad_personas}</td>
                  <td>${parseFloat(r.monto_total).toFixed(2)}</td>
                  <td>
                    <span
                      className={`badge ${
                        r.estado_reserva === "confirmada"
                          ? "bg-success"
                          : r.estado_reserva === "pendiente"
                          ? "bg-warning"
                          : "bg-danger"
                      }`}
                    >
                      {r.estado_reserva}
                    </span>
                  </td>
                  <td>{new Date(r.fecha_reserva).toLocaleDateString()}</td>
                  <td>
                    <div className="btn-group" role="group">
                      {/* Ver */}
                      <Button
                        as={Link}
                        to={`/dashboard-admin/reservas/view/${r.id_reserva}`}
                        variant="outline-secondary"
                        size="sm"
                      >
                        <i className="bi bi-eye"></i>
                      </Button>

                      {/* Editar */}
                      <Button
                        as={Link}
                        to={`/dashboard-admin/reservas/edit/${r.id_reserva}`}
                        variant="outline-primary"
                        size="sm"
                      >
                        <i className="bi bi-pencil"></i>
                      </Button>

                      {/* Eliminar o Restaurar */}
                      {r.eliminado ? (
                        <Button
                          variant="outline-success"
                          size="sm"
                          onClick={() => handleRestore(r.id_reserva)}
                        >
                          <i className="bi bi-arrow-counterclockwise"></i>
                        </Button>
                      ) : (
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(r.id_reserva)}
                        >
                          <i className="bi bi-trash"></i>
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="text-center text-muted py-3">
                  No hay reservas registradas
                </td>
              </tr>
            )}
          </tbody>
        </Table>
        {/* Paginación con Bootstrap */}
        {totalPaginas > 1 && (
          <div className="d-flex justify-content-center mt-3">
            <nav>
              <ul className="pagination pagination-sm mb-0">
                {/* Flecha izquierda */}
                <li
                  className={`page-item ${
                    paginaActual === 1 ? "disabled" : ""
                  }`}
                >
                  <button
                    className="page-link"
                    onClick={() =>
                      setPaginaActual((prev) => Math.max(prev - 1, 1))
                    }
                  >
                    &laquo;
                  </button>
                </li>

                {/* Números de página */}
                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(
                  (num) => (
                    <li
                      key={num}
                      className={`page-item ${
                        paginaActual === num ? "active" : ""
                      }`}
                    >
                      <button
                        className="page-link"
                        onClick={() => setPaginaActual(num)}
                      >
                        {num}
                      </button>
                    </li>
                  )
                )}

                {/* Flecha derecha */}
                <li
                  className={`page-item ${
                    paginaActual === totalPaginas ? "disabled" : ""
                  }`}
                >
                  <button
                    className="page-link"
                    onClick={() =>
                      setPaginaActual((prev) =>
                        Math.min(prev + 1, totalPaginas)
                      )
                    }
                  >
                    &raquo;
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
