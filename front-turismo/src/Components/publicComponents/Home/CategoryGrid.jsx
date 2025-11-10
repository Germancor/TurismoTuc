import { useEffect, useState, useRef } from "react";
import axios from "axios";
import "../../../styles/publicComponents/home.css";

export default function CategoryCarousel() {
  const [categorias, setCategorias] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const res = await axios.get("http://localhost:8000/api/categorias");
        setCategorias(res.data);
      } catch (err) {
        console.error("Error al cargar categorías:", err);
      }
    };
    fetchCategorias();
  }, []);

  const scrollToIndex = (index) => {
    const container = containerRef.current;
    const itemWidth = container?.firstChild?.offsetWidth || 0;
    container.scrollTo({
      left: itemWidth * index,
      behavior: "smooth",
    });
    setActiveIndex(index);
  };

  const handlePrev = () => {
    if (activeIndex > 0) scrollToIndex(activeIndex - 1);
  };

  const handleNext = () => {
    if (activeIndex < categorias.length - 1) scrollToIndex(activeIndex + 1);
  };

  return (
    <section className="container py-5">
      <h4 className="text-center fw-bold mb-4">Explorá por categoría</h4>
      <div className="position-relative">
        <button className="carousel-arrow left" onClick={handlePrev}>‹</button>
        <div className="categoria-scroll-container" ref={containerRef}>
          {categorias.map((cat, index) => (
            <div
              key={cat.id_categoria_excursion}
              className={`categoria-card ${index === activeIndex ? "active" : ""}`}
              onClick={() =>
                window.location.href = `/catalogo?categoria=${encodeURIComponent(cat.nombre_categoria)}`
              }
            >
              <i className={`bi ${cat.icono || "bi-tag"} fs-3 d-block mb-2`}></i>
              <span>{cat.nombre_categoria}</span>
            </div>
          ))}
        </div>
        <button className="carousel-arrow right" onClick={handleNext}>›</button>
      </div>
    </section>
  );
}