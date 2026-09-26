import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, Button, Table, Spinner } from "react-bootstrap";
import Swal from "sweetalert2";
import PaginationComponent from "../Filtros/Paginacion.jsx";
import BuscadorGeneral from "../Filtros/BuscadorGeneral.jsx"; 
import * as XLSX from "xlsx";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function MainTuristas() {
  const [turistas, setTuristas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [mostrarArchivadas, setMostrarArchivadas] = useState(false);
  const [dniBuscar, setDniBuscar] = useState("");

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const porPagina = 10;

  const navigate = useNavigate();

  // 🔹 Función unificada para obtener datos (con o sin búsqueda)
  const fetchTuristas = async () => {
    setLoading(true);
    try {
      const isArchivadaParams = mostrarArchivadas ? "true" : "false";
      
      let res;
      if (dniBuscar) {
        res = await axios.get(`${import.meta.env.VITE_API_URL}/turistas/buscar`, {
          params: { dni: dniBuscar, page: paginaActual, limit: porPagina, mostrarArchivadas: isArchivadaParams }
        });
      } else {
        res = await axios.get(`${import.meta.env.VITE_API_URL}/turistas`, {
          params: { page: paginaActual, limit: porPagina, mostrarArchivadas: isArchivadaParams }
        });
      }
      
      setTuristas(res.data.data || []);
      setTotalPaginas(res.data.totalPages || 1);
    } catch (err) {
      console.error("Error al obtener turistas:", err);
      Swal.fire("Error", "No se pudieron cargar los turistas.", "error");
      setTuristas([]);
    } finally {
      setLoading(false);
    }
  };

  // Resetea a la página 1 si cambias el estado del botón o buscas algo nuevo
  useEffect(() => {
    setPaginaActual(1);
  }, [mostrarArchivadas, dniBuscar]);

  // Se ejecuta cada vez que cambia la página, la búsqueda o el botón de archivo
  useEffect(() => {
    fetchTuristas();
  }, [paginaActual, mostrarArchivadas, dniBuscar]);

  const handleDelete = async (id) => {
    const confirmDelete = await Swal.fire({
      title: "¿Archivar turista?",
      text: "El perfil pasará a la lista de archivados.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, archivar",
      cancelButtonText: "Cancelar",
    });

    if (!confirmDelete.isConfirmed) return;

    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/turistas/${id}`);
      Swal.fire({
        icon: "success",
        title: "Archivado",
        text: "El turista fue archivado correctamente.",
        timer: 2000,
        showConfirmButton: false,
      });
      fetchTuristas();
    } catch (err) {
      console.error("Error al archivar turista:", err);
      Swal.fire("Error", "No se pudo archivar el turista.", "error");
    }
  };

  const handleRestore = async (id) => {
    const confirmRestore = await Swal.fire({
      title: "¿Restaurar turista?",
      text: "El perfil volverá a estar activo en la tabla principal.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, restaurar",
      cancelButtonText: "Cancelar",
    });

    if (!confirmRestore.isConfirmed) return;

    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/turistas/restore/${id}`);
      Swal.fire({
        icon: "success",
        title: "Restaurado",
        text: "El turista fue restaurado correctamente.",
        timer: 2000,
        showConfirmButton: false,
      });
      fetchTuristas();
    } catch (err) {
      console.error("Error al restaurar turista:", err);
      Swal.fire("Error", "No se pudo restaurar el turista.", "error");
    }
  };

  const exportToExcel = () => {
    if (turistas.length === 0) {
      return Swal.fire("Sin datos", "No hay turistas para exportar", "info");
    }
    const ws = XLSX.utils.json_to_sheet(turistas.map(t => ({
      ID: t.id_turista,
      Nombre_Completo: `${t.nombre} ${t.apellido}`,
      DNI: t.dni,
      Email: t.email,
      Telefono: t.telefono || "-",
      Estado: t.eliminado ? "Archivado" : "Activo"
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Turistas");
    XLSX.writeFile(wb, "Turistas_Export.xlsx");
  };

  return (
    <div className="container-fluid py-4">
      <Card className="card-premium shadow-sm">
        <Card.Body>
          {/* Encabezado y Filtros */}
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <div>
              <h5 className="fw-bold text-success mb-2">
                Gestión de Turistas{" "}
                <small className="text-muted" style={{ textTransform: "lowercase" }}>
                  {/* ({mostrarArchivadas ? "archivados" : "activos"}) */}
                </small>
              </h5>

              <div style={{ maxWidth: "250px" }}>
                <BuscadorGeneral 
                  placeholder="Buscar por DNI..." 
                  onBuscar={(valor) => setDniBuscar(valor)} 
                />
              </div>
            </div>

            <div className="d-flex align-items-center gap-2">
              <Button
                variant="success"
                size="sm"
                onClick={() => navigate("/dashboard-admin/turistas/create")}
              >
                <i className="bi bi-plus-circle me-1"></i> Agregar Turista
              </Button>

              {/* Botón Toggle para Mostrar Archivados */}
              <Button
                variant={mostrarArchivadas ? "success" : "outline-danger"}
                size="sm"
                onClick={() => setMostrarArchivadas(!mostrarArchivadas)}
              >
                {mostrarArchivadas ? (
                  <><i className="bi bi-arrow-left-circle me-1"></i> Volver a Activos</>
                ) : (
                  <><i className="bi bi-archive-fill me-1"></i> Mostrar Archivados</>
                )}
              </Button>
              <Button variant="outline-success" size="sm" onClick={exportToExcel} title="Exportar a Excel">
                <i className="bi bi-file-earmark-excel"></i> Excel
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="py-4">
              <Skeleton count={8} height={45} className="mb-2" />
            </div>
          ) : (
            <>
              <Table hover responsive className="align-middle">
                <thead className="table-light">
                  <tr>
                    <th className="d-none d-md-table-cell">ID</th>
                    <th>Nombre Completo</th>
                    <th className="d-none d-md-table-cell">DNI</th>
                    <th>Email</th>
                    <th>Teléfono</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {turistas.length > 0 ? (
                    turistas.map((t) => (
                      <tr key={t.id_turista}>
                        <td className="d-none d-md-table-cell">{t.id_turista}</td>
                        <td>
                          {t.nombre} {t.apellido}
                        </td>
                        <td className="d-none d-md-table-cell">{t.dni}</td>
                        <td>{t.email}</td>
                        <td>{t.telefono}</td>
                        <td>
                          <div className="btn-group" role="group">
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              className="btn-action"
                              title="Ver detalles"
                              onClick={() => navigate(`/dashboard-admin/turistas/view/${t.id_turista}`)}
                            >
                              <i className="bi bi-eye"></i>
                            </Button>
                            
                            {!t.eliminado && (
                              <Button
                                variant="outline-primary"
                                size="sm"
                                className="btn-action"
                                title="Editar"
                                onClick={() => navigate(`/dashboard-admin/turistas/edit/${t.id_turista}`)}
                              >
                                <i className="bi bi-pencil"></i>
                              </Button>
                            )}

                            {t.eliminado ? (
                              <Button
                                variant="outline-success"
                                size="sm"
                                className="btn-action"
                                title="Restaurar"
                                onClick={() => handleRestore(t.id_turista)}
                              >
                                <i className="bi bi-arrow-counterclockwise"></i>
                              </Button>
                            ) : (
                              <Button
                                variant="outline-danger"
                                size="sm"
                                className="btn-action"
                                title="Archivar"
                                onClick={() => handleDelete(t.id_turista)}
                              >
                                <i className="bi bi-archive"></i>
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-5">
                        <div className="d-flex flex-column align-items-center justify-content-center text-muted">
                          <i className="bi bi-inbox mb-2" style={{ fontSize: "3rem", opacity: 0.5 }}></i>
                          <h5>No hay turistas registrados</h5>
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