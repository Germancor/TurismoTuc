import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { Container, Row, Col } from "react-bootstrap";
import { useTranslation } from "react-i18next";

import CatalogGrid from "../../Components/publicComponents/Catalogo/CatalogGrid";
import FilterSidebar from "../../Components/publicComponents/Catalogo/FilterSidebar";
import SortBar from "../../Components/publicComponents/Catalogo/SortBar";
import Paginacion from "../../Components/Filtros/Paginacion";

import "../../styles/publicComponents/catalogo.css";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function Catalogo() {
  const { t } = useTranslation();

  const [excursiones, setExcursiones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // PAGINACIÓN
  const PAGE_SIZE = 8;

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // FILTROS
  const [filtros, setFiltros] = useState({});

  // ORDEN
  const [orden, setOrden] = useState("");

  const query = useQuery();
  const categoriaSeleccionada = query.get("categoria");

  /**
   * Obtener excursiones desde el backend
   */
  const fetchExcursiones = async (
    page = 1,
    filtrosActuales = filtros,
    ordenActual = orden
  ) => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page,
        limit: PAGE_SIZE,
        ...filtrosActuales,
      };

      // Categoría proveniente de la URL
      if (categoriaSeleccionada) {
        params.categoria = categoriaSeleccionada;
      }

      // Ordenamiento
      if (ordenActual) {
        params.orden = ordenActual;
      }

      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/excursiones`,
        {
          params,
        }
      );

      setExcursiones(res.data.data || []);

      setTotalPages(
        res.data.totalPages || 1
      );

      setCurrentPage(page);

    } catch (err) {
      console.error(
        "Error al obtener excursiones:",
        err
      );

      setError(
        "No se pudieron cargar las excursiones."
      );

    } finally {
      setLoading(false);
    }
  };

  /**
   * Primera carga
   * y cambio de categoría desde la URL
   */
  useEffect(() => {
    setFiltros({});
    setOrden("");
    fetchExcursiones(1, {}, "");
  }, [categoriaSeleccionada]);

  /**
   * Aplicar filtros
   */
  const handleFilterChange = (nuevosFiltros) => {
    setFiltros(nuevosFiltros);

    // Cuando cambia el filtro volvemos a página 1
    fetchExcursiones(
      1,
      nuevosFiltros,
      orden
    );
  };

  /**
   * Cambiar ordenamiento
   */
  const handleSortChange = (nuevoOrden) => {
    setOrden(nuevoOrden);

    // Cuando cambia el orden volvemos a página 1
    fetchExcursiones(
      1,
      filtros,
      nuevoOrden
    );
  };

  /**
   * Cambiar página
   */
  const handlePageChange = (page) => {
    fetchExcursiones(
      page,
      filtros,
      orden
    );
  };

  return (
    <Container
      fluid
      className="catalogo-page py-4"
    >
      <Row>

        {/* SIDEBAR */}
        <Col md={3} lg={2}>

          <div className="sidebar-container">

            <h5 className="fw-bold mb-2 text-secondary">
              {t("filterSidebar.filter")}
            </h5>

            <SortBar
              onSortChange={handleSortChange}
            />

            <FilterSidebar
              onFilterChange={handleFilterChange}
            />

          </div>

        </Col>

        {/* CATÁLOGO */}
        <Col
          xs={12}
          md={9}
          lg={10}
        >

          {loading ? (

            <p>
              {t("catalogo.loading")}
            </p>

          ) : error ? (

            <p className="text-danger">
              {error}
            </p>

          ) : excursiones.length === 0 ? (

            <p className="text-muted">
              {t("catalogo.empty")}
            </p>

          ) : (

            <>

              <CatalogGrid
                excursiones={excursiones}
              />

              <Paginacion
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                maxVisible={5}
              />

            </>

          )}

        </Col>

      </Row>
    </Container>
  );
}
