import { useState } from "react";
import axios from "axios";
import "../../../styles/publicComponents/home.css";

export default function HeroBanner({ setResultados }) {
  const [query, setQuery] = useState("");

  const handleBuscar = async () => {
    if (!query.trim()) return;
    try {
      const res = await axios.get(`http://localhost:8000/api/excursiones?q=${query}`);
      setResultados(res.data);
    } catch (err) {
      console.error("Error al buscar excursiones:", err);
    }
  };

  return (
    <section className="hero-section position-relative">
      {/* 🎥 Video de fondo */}
      <video className="hero-video" autoPlay muted loop playsInline>
        <source src="src/public/banner.mp4" type="video/mp4" />
        Tu navegador no soporta video HTML5.
      </video>

      {/* 🧾 Contenido encima del video */}
      <div className="hero-overlay text-white text-center d-flex flex-column justify-content-center align-items-center px-3">
        <h1 className="display-5 fw-bold">Descubrí Tucumán</h1>
        <p className="lead">Excursiones exclusivas: naturaleza, cultura y sabores. Reservá fácil, sin crear cuenta.</p>
        <div className="input-group mt-4" style={{ maxWidth: "500px" }}>
          <input
            type="text"
            className="form-control"
            placeholder="Buscar destino o excursión"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleBuscar()}
          />
          <button className="btn btn-warning" onClick={handleBuscar}>Buscar</button>
        </div>
      </div>
    </section>
  );
}