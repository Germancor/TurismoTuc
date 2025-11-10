import { useState, useEffect } from "react";
import { Form, Button } from "react-bootstrap";
import axios from "axios";

export default function FilterSidebar({ onFilterChange }) {
  const [ubicacion, setUbicacion] = useState("");
  const [precioMin, setPrecioMin] = useState("");
  const [precioMax, setPrecioMax] = useState("");
  const [duracion, setDuracion] = useState("");
  const [categoria, setCategoria] = useState("");
  const [categorias, setCategorias] = useState([]);

  // 🔄 Cargar categorías al montar
  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const res = await axios.get("http://localhost:8000/api/categorias");
        setCategorias(res.data);
      } catch (err) {
        console.error("Error al obtener categorías:", err);
      }
    };
    fetchCategorias();
  }, []);

  const handleApplyFilters = async (e) => {
    e.preventDefault();

    const params = {};
    if (ubicacion) params.ubicacion = ubicacion;
    if (precioMin) params.precio_min = precioMin;
    if (precioMax) params.precio_max = precioMax;
    if (duracion) params.duracion = duracion;
    if (categoria) params.categoria = categoria;

    try {
      const res = await axios.get("http://localhost:8000/api/excursiones", { params });
      onFilterChange(res.data);
    } catch (err) {
      console.error("Error al aplicar filtros:", err);
    }
  };

  const handleClear = async () => {
    setUbicacion("");
    setPrecioMin("");
    setPrecioMax("");
    setDuracion("");
    setCategoria("");
    try {
      const res = await axios.get("http://localhost:8000/api/excursiones");
      onFilterChange(res.data);
    } catch (err) {
      console.error("Error al limpiar filtros:", err);
    }
  };

  return (
    <div className="filter-sidebar bg-white rounded shadow-sm p-3 mb-3">
      <h6 className="fw-bold mb-3">Filtros</h6>
      <Form onSubmit={handleApplyFilters}>
        <Form.Group className="mb-3">
          <Form.Label>Ubicación</Form.Label>
          <Form.Control
            type="text"
            placeholder="Ej: Tafí del Valle"
            value={ubicacion}
            onChange={(e) => setUbicacion(e.target.value)}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Precio mínimo</Form.Label>
          <Form.Control
            type="number"
            placeholder="Desde..."
            value={precioMin}
            onChange={(e) => setPrecioMin(e.target.value)}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Precio máximo</Form.Label>
          <Form.Control
            type="number"
            placeholder="Hasta..."
            value={precioMax}
            onChange={(e) => setPrecioMax(e.target.value)}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Duración</Form.Label>
          <Form.Control
            type="text"
            placeholder="Ej: Día completo"
            value={duracion}
            onChange={(e) => setDuracion(e.target.value)}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Categoría</Form.Label>
          <Form.Select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
          >
            <option value="">Todas</option>
            {categorias.map((cat) => (
              <option key={cat.id_categoria_excursion} value={cat.nombre_categoria}>
                {cat.nombre_categoria}
              </option>
            ))}
          </Form.Select>
        </Form.Group>

        <div className="d-flex gap-2">
          <Button type="submit" variant="teal" className="w-50">
            Aplicar
          </Button>
          <Button variant="outline-secondary" className="w-50" onClick={handleClear}>
            Limpiar
          </Button>
        </div>
      </Form>
    </div>
  );
}