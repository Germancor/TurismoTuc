import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function CreateExcursion() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    precio_base: "",
    duracion: "",
    ubicacion: "",
    incluye: "",
    politicas: "",
    estado: "activa",
    id_categoria_excursion: "",
    id_guia: "", // ✅ Guía asignado
  });

  const [urlImagen, setUrlImagen] = useState(""); // 👈 ahora manejamos una URL
  const [categorias, setCategorias] = useState([]);
  const [guias, setGuias] = useState([]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // 1️⃣ Crear excursión
      const res = await axios.post("http://localhost:8000/api/excursiones", form);
      const id_excursion = res.data.id;

      // 2️⃣ Si hay una URL cargada, crear multimedia
      if (urlImagen.trim() !== "") {
        await axios.post("http://localhost:8000/api/excursiones/multimedia", {
          id_excursion,
          url: urlImagen,
          descripcion: "Imagen principal de la excursión",
          tipo: "foto",
        });
      }

      alert("Excursión creada correctamente ✅");
      navigate("/dashboard-admin/excursiones");
    } catch (err) {
      console.error("Error al crear excursión:", err);
      alert("Error al crear excursión ❌");
    }
  };

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const res = await axios.get("http://localhost:8000/api/categorias"); // ✅ nuevo endpoint
        setCategorias(res.data);
      } catch (err) {
        console.error("Error al obtener categorías:", err);
      }
    };
  
    const fetchGuias = async () => {
      try {
        const res = await axios.get("http://localhost:8000/api/excursiones/guias");
        setGuias(res.data);
      } catch (err) {
        console.error("Error al obtener guías:", err);
      }
    };
  
    fetchCategorias();
    fetchGuias();
  }, []);

  return (
    <div className="container py-4">
      <h4 className="fw-bold mb-3">Nueva Excursión</h4>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Título</label>
          <input
            type="text"
            name="titulo"
            className="form-control"
            value={form.titulo}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Ubicación</label>
          <input
            type="text"
            name="ubicacion"
            className="form-control"
            value={form.ubicacion}
            onChange={handleChange}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Precio Base</label>
          <input
            type="number"
            name="precio_base"
            className="form-control"
            value={form.precio_base}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Duración</label>
          <input
            type="text"
            name="duracion"
            className="form-control"
            value={form.duracion}
            onChange={handleChange}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Incluye</label>
          <textarea
            name="incluye"
            className="form-control"
            rows={2}
            value={form.incluye}
            onChange={handleChange}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Políticas</label>
          <textarea
            name="politicas"
            className="form-control"
            rows={2}
            value={form.politicas}
            onChange={handleChange}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Descripción</label>
          <textarea
            name="descripcion"
            className="form-control"
            rows={4}
            value={form.descripcion}
            onChange={handleChange}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Estado</label>
          <select
            name="estado"
            className="form-select"
            value={form.estado}
            onChange={handleChange}
          >
            <option value="activa">Activa</option>
            <option value="inactiva">Inactiva</option>
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label">Categoría</label>
          <select
            name="id_categoria_excursion"
            className="form-select"
            value={form.id_categoria_excursion}
            onChange={handleChange}
          >
            <option value="">Seleccionar categoría</option>
            {categorias.map((cat) => (
              <option key={cat.id_categoria_excursion} value={cat.id_categoria_excursion}>
                {cat.nombre_categoria}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label">Guía asignado</label>
          <select
            name="id_guia"
            className="form-select"
            value={form.id_guia}
            onChange={handleChange}
          >
            <option value="">Seleccionar guía</option>
            {guias.map((g) => (
              <option key={g.id_usuario} value={g.id_usuario}>
                {g.nombre} {g.apellido}
              </option>
            ))}
          </select>
        </div>

        {/* 👇 Campo de URL de imagen (reemplaza el input file) */}
        <div className="mb-3">
          <label className="form-label">URL de imagen principal</label>
          <input
            type="text"
            className="form-control"
            placeholder="https://tuservidor.com/imagenes/excursion.jpg"
            value={urlImagen}
            onChange={(e) => setUrlImagen(e.target.value)}
          />
          <small className="text-muted">
            Pegá la URL de la imagen principal de la excursión (por ahora solo una).
          </small>
        </div>

        <button type="submit" className="btn btn-success">
          Crear excursión
        </button>
      </form>
    </div>
  );
}
