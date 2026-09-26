import { useEffect, useState, Fragment } from "react";
import axios from "axios";
import { Card, Table, Button, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import PaginationComponent from "../Filtros/Paginacion.jsx";
import BuscadorGeneral from "../Filtros/BuscadorGeneral.jsx"; 
import * as XLSX from "xlsx";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function MainFechasExcursion() {
  const [fechas, setFechas] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Estados de Filtros y Paginación
  const [mostrarArchivadas, setMostrarArchivadas] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const porPagina = 10;

  const fetchFechas = async () => {
    setLoading(true);
    try {
      const params = {
        page: paginaActual,
        limit: porPagina,
        mostrarArchivadas: mostrarArchivadas ? "true" : "false",
        q: busqueda,
      };

      // 👈 Usamos el nuevo endpoint para tabla plana
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/excursiones/fechas-paginadas`, { params });
      setFechas(res.data.data || []);
      setTotalPaginas(res.data.totalPages || 1);
    } catch (err) {
      console.error("Error al obtener fechas:", err);
      Swal.fire("Error", "No se pudieron cargar las fechas.", "error");
      setFechas([]);
    } finally {
      setLoading(false);
    }
  };

  // Resetear a página 1 cuando cambia un filtro
  useEffect(() => {
    setPaginaActual(1);
  }, [mostrarArchivadas, busqueda]);

  // Cargar datos
  useEffect(() => {
    fetchFechas();
  }, [mostrarArchivadas, busqueda, paginaActual]);

  const handleCerrar = async (id_fecha) => {
    const confirmar = await Swal.fire({
      title: "¿Cerrar y archivar fecha?",
      text: "La fecha pasará al historial y no admitirá nuevas reservas.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, archivar",
      cancelButtonText: "Cancelar",
    });

    if (!confirmar.isConfirmed) return;

    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/excursiones/fechas/${id_fecha}`);
      Swal.fire({
        icon: "success",
        title: "Archivada",
        text: "La fecha ya no estará disponible para reservas.",
        timer: 2000,
        showConfirmButton: false,
      });
      fetchFechas();
    } catch (err) {
      Swal.fire("Error", "No se pudo cerrar la fecha.", "error");
    }
  };

  const handleRestore = async (id_fecha) => {
    const confirmar = await Swal.fire({
      title: "¿Restaurar fecha?",
      text: "Volverá a estar abierta para reservas en el catálogo.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, restaurar",
      cancelButtonText: "Cancelar",
    });

    if (!confirmar.isConfirmed) return;

    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/excursiones/fechas/restore/${id_fecha}`);
      Swal.fire({
        icon: "success",
        title: "Restaurada",
        text: "La fecha fue restaurada correctamente.",
        timer: 2000,
        showConfirmButton: false,
      });
      fetchFechas();
    } catch (err) {
      Swal.fire("Error", "No se pudo restaurar la fecha.", "error");
    }
  };

  const exportToExcel = () => {
    if (fechas.length === 0) {
      return Swal.fire("Sin datos", "No hay fechas para exportar", "info");
    }
    const ws = XLSX.utils.json_to_sheet(fechas.map(f => ({
      Excursion: f.excursion,
      Fecha: new Date(f.fecha).toLocaleDateString(),
      Hora: f.hora_salida || "-",
      Cupo_Maximo: f.cupo_maximo,
      Cupo_Disponible: f.cupo_disponible,
      Estado: f.eliminado ? "Archivada" : f.estado
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Fechas_Excursion");
    XLSX.writeFile(wb, "FechasExcursion_Export.xlsx");
  };

  const fechasAgrupadas = fechas.reduce((acc, f) => {
    if (!acc[f.excursion]) acc[f.excursion] = [];
    acc[f.excursion].push(f);
    return acc;
  }, {});

  return (
    <div className="container-fluid py-4">
      <Card className="card-premium shadow-sm">
        <Card.Body className="p-3">
          
          {/* Encabezado y Filtros */}
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <div>
              <h5 className="fw-bold text-success mb-2">
                Programación de Fechas{" "}
                <small className="text-muted" style={{ textTransform: "lowercase" }}>
                  {/* ({mostrarArchivadas ? "archivadas/pasadas" : "próximas abiertas"}) */}
                </small>
              </h5>

              <div style={{ maxWidth: "250px" }}>
                <BuscadorGeneral 
                  placeholder="Buscar excursión..." 
                  onBuscar={(valor) => setBusqueda(valor)} 
                />
              </div>
            </div>

            <div className="d-flex align-items-center gap-2">
              <Button
                variant="success"
                size="sm"
                onClick={() => navigate("/dashboard-admin/fechas/create")}
              >
                <i className="bi bi-calendar-plus me-1"></i> Nueva Fecha
              </Button>

              {/* Toggle Archivadas */}
              <Button
                variant={mostrarArchivadas ? "success" : "outline-danger"}
                size="sm"
                onClick={() => setMostrarArchivadas(!mostrarArchivadas)}
              >
                {mostrarArchivadas ? (
                  <><i className="bi bi-arrow-left-circle me-1"></i> Volver a Relevantes</>
                ) : (
                  <><i className="bi bi-archive-fill me-1"></i> Mostrar Cerradas</>
                )}
              </Button>
              <Button variant="outline-success" size="sm" onClick={exportToExcel} title="Exportar a Excel">
                <i className="bi bi-file-earmark-excel"></i> Excel
              </Button>
            </div>
          </div>

          {/* Tabla Plana Global */}
          {loading ? (
            <div className="py-4">
              <Skeleton count={8} height={45} className="mb-2" />
            </div>
          ) : (
            <>
              <Table hover responsive className="mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Excursión</th>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Cupo Max.</th>
                    <th>Disponibles</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(fechasAgrupadas).length > 0 ? (
                    Object.entries(fechasAgrupadas).map(([excursion, fechasExc]) => (
                      <Fragment key={excursion}>
                        <tr className="table-secondary">
                          <td colSpan="7" className="fw-bold text-success border-bottom-0">
                            <i className="bi bi-geo-alt-fill me-2"></i>{excursion}
                          </td>
                        </tr>
                        {fechasExc.map((f) => (
                          <tr key={f.id_fecha}>
                            <td></td> {/* Espacio en blanco bajo el título de la excursión */}
                            <td>{new Date(f.fecha).toLocaleDateString()}</td>
                            <td>{f.hora_salida || "—"}</td>
                            <td>{f.cupo_maximo}</td>
                            <td>
                              <span className={f.cupo_disponible <= 3 ? "text-danger fw-bold" : ""}>
                                {f.cupo_disponible}
                              </span>
                            </td>
                            <td>
                              <span
                                className={`badge text-uppercase ${
                                  f.estado === "abierta" && !f.eliminado
                                    ? "badge-soft-success"
                                    : "badge-soft-secondary"
                                }`}
                              >
                                {f.eliminado ? "ARCHIVADA" : f.estado}
                              </span>
                            </td>
                            <td>
                              <div className="btn-group" role="group">
                                {!f.eliminado && (
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    className="btn-action"
                                    onClick={() => navigate(`/dashboard-admin/fechas/edit/${f.id_fecha}`)}
                                    title="Editar"
                                  >
                                    <i className="bi bi-pencil"></i>
                                  </Button>
                                )}

                                {f.eliminado || f.estado === 'cerrada' ? (
                                  <Button
                                    variant="outline-success"
                                    size="sm"
                                    className="btn-action"
                                    onClick={() => handleRestore(f.id_fecha)}
                                    title="Restaurar fecha"
                                  >
                                    <i className="bi bi-arrow-counterclockwise"></i>
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    className="btn-action"
                                    onClick={() => handleCerrar(f.id_fecha)}
                                    title="Cerrar y Archivar"
                                  >
                                    <i className="bi bi-archive"></i>
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </Fragment>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-5">
                        <div className="d-flex flex-column align-items-center justify-content-center text-muted">
                          <i className="bi bi-inbox mb-2" style={{ fontSize: "3rem", opacity: 0.5 }}></i>
                          <h5>No hay fechas registradas</h5>
                          <p className="mb-0 small">No se encontraron resultados para los filtros aplicados.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>

              {/* Paginación */}
              <PaginationComponent
                currentPage={paginaActual}
                totalPages={totalPaginas}
                onPageChange={(page) => setPaginaActual(page)}
              />
            </>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}