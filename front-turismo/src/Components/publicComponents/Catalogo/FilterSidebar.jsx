import { useState, useEffect } from "react";
import { Form, Button } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import axios from "axios";

export default function FilterSidebar({ onFilterChange }) {
  const { t } = useTranslation();

  const [ubicacion, setUbicacion] = useState("");
  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");
  const [duracion, setDuracion] = useState("");
  const [categoria, setCategoria] = useState("");
  const [categorias, setCategorias] = useState([]);

  // Cargar categorías
  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/categorias`
        );

        setCategorias(res.data);
      } catch (err) {
        console.error("Error al obtener categorías:", err);
      }
    };

    fetchCategorias();
  }, []);

  const handleApplyFilters = (e) => {
    e.preventDefault();

    const filtros = {};

    if (ubicacion) filtros.ubicacion = ubicacion;
    if (precioMin) filtros.precio_min = precioMin;
    if (precioMax) filtros.precio_max = precioMax;
    if (duracion) filtros.duracion = duracion;
    if (categoria) filtros.categoria = categoria;

    // Mandamos los filtros al padre
    onFilterChange(filtros);
  };

  const handleClear = () => {
    setUbicacion("");
    setPrecioMin("");
    setPrecioMax("");
    setDuracion("");
    setCategoria("");

    // Avisamos al padre que se limpiaron los filtros
    onFilterChange({});
  };

  return (
    <div className="filter-sidebar bg-white rounded shadow-sm p-3 mb-3">

      <h6 className="fw-bold mb-3">
        {t("filterSidebar.filter")}
      </h6>

      <Form onSubmit={handleApplyFilters}>

        {/* UBICACIÓN */}
        <Form.Group className="mb-3">
          <Form.Label>
            {t("filterSidebar.location")}
          </Form.Label>

          <Form.Control
            type="text"
            placeholder={t("filterSidebar.locationPlaceholder")}
            value={ubicacion}
            onChange={(e) => setUbicacion(e.target.value)}
          />
        </Form.Group>

        {/* PRECIO MÍNIMO */}
        <Form.Group className="mb-3">
          <Form.Label>
            {t("filterSidebar.minPrice")}
          </Form.Label>

          <Form.Control
            type="number"
            placeholder={t("filterSidebar.from")}
            value={precioMin}
            onChange={(e) => setPrecioMin(e.target.value)}
          />
        </Form.Group>

        {/* PRECIO MÁXIMO */}
        <Form.Group className="mb-3">
          <Form.Label>
            {t("filterSidebar.maxPrice")}
          </Form.Label>

          <Form.Control
            type="number"
            placeholder={t("filterSidebar.to")}
            value={precioMax}
            onChange={(e) => setPrecioMax(e.target.value)}
          />
        </Form.Group>

        {/* DURACIÓN */}
        <Form.Group className="mb-3">
          <Form.Label>
            {t("filterSidebar.duration")}
          </Form.Label>

          <Form.Control
            type="text"
            placeholder={t("filterSidebar.durationPlaceholder")}
            value={duracion}
            onChange={(e) => setDuracion(e.target.value)}
          />
        </Form.Group>

        {/* CATEGORÍA */}
        <Form.Group className="mb-3">
          <Form.Label>
            {t("filterSidebar.category")}
          </Form.Label>

          <Form.Select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
          >
            <option value="">
              {t("filterSidebar.all")}
            </option>

            {categorias.map((cat) => (
              <option
                key={cat.id_categoria_excursion}
                value={cat.nombre_categoria}
              >
                {t(`categorias.${cat.nombre_categoria}`)}
              </option>
            ))}
          </Form.Select>
        </Form.Group>

        {/* BOTONES */}
        <div className="d-flex gap-2">

          <Button
            type="submit"
            variant="teal"
            className="w-50"
          >
            {t("filterSidebar.apply")}
          </Button>

          <Button
            type="button"
            variant="outline-secondary"
            className="w-50"
            onClick={handleClear}
          >
            {t("filterSidebar.clear")}
          </Button>

        </div>

      </Form>
    </div>
  );
}
