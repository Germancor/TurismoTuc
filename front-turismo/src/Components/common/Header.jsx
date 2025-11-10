import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  FaWhatsapp,
  FaShoppingCart,
} from "react-icons/fa";
import useTuristaStore from "../../store/useTuristaStore";
import useCarritoStore from "../../store/useCarritoStore";
import { useEffect } from "react";
import "../../styles/components/common/header.css";

export default function Header() {
  const navigate = useNavigate();
  const { turista, clearTurista } = useTuristaStore();
  const { items, fetchCarrito } = useCarritoStore();

  useEffect(() => {
    if (turista) fetchCarrito();
  }, [turista]);

  // 🔹 Suma total de personas o ítems del carrito
  const cantidadTotal = items.reduce(
    (acc, i) => acc + Number(i.cantidad_personas || 0),
    0
  );

  return (
    <nav className="navbar navbar-expand-lg bg-white shadow-sm sticky-top">
      <div className="container-fluid px-4">
        {/* Logo + nombre */}
        <Link
          className="navbar-brand fw-bold text-teal d-flex align-items-center gap-2"
          to="/"
        >
          <div className="logo-circle"></div>
          Turismo Tucumán
        </Link>

        {/* Botón hamburguesa móvil */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Menú central */}
        <div
          className="collapse navbar-collapse justify-content-center"
          id="navbarNav"
        >
          <ul className="navbar-nav gap-3">
            <li className="nav-item">
              <NavLink className="nav-link" to="/">
                INICIO
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/catalogo">
                CATÁLOGO
              </NavLink>
            </li>
          </ul>
        </div>

        {/* Zona derecha */}
        <div className="d-flex align-items-center gap-2">
          {/* 🔹 Si NO hay turista */}
          {!turista ? (
            <>
              <button
                className="btn btn-outline-success btn-sm"
                onClick={() => navigate("/login-turista")}
              >
                Iniciar sesión
              </button>
              <button
                className="btn btn-success btn-sm"
                onClick={() => navigate("/register-turista")}
              >
                Registrate
              </button>
            </>
          ) : (
            // 🔹 Si hay turista logueado
            <div className="d-flex align-items-center gap-3">
              {/* WhatsApp primero */}
              <a
                href="https://wa.me/5493810000000"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-success btn-sm d-flex align-items-center justify-content-center"
                style={{ width: "38px", height: "38px", borderRadius: "50%" }}
                title="Contactar por WhatsApp"
              >
                <FaWhatsapp size={18} />
              </a>

              {/* Carrito */}
              <Link
                to="/carrito"
                className="btn btn-outline-dark btn-sm d-flex align-items-center gap-1 position-relative"
                title="Ver carrito"
              >
                <FaShoppingCart /> Carrito
                {cantidadTotal > 0 && (
                  <span
                    className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                    style={{
                      fontSize: "0.65rem",
                      padding: "0.3rem 0.45rem",
                    }}
                  >
                    {cantidadTotal}
                  </span>
                )}
              </Link>

              {/* Saludo */}
              <span className="fw-semibold text-success small mb-0">¡Hola, {turista?.nombre?.split(" ")[0] || "Turista"}!</span>

              {/* Botón Mi perfil */}
              <button
                className="btn btn-outline-primary btn-sm fw-semibold"
                onClick={() => navigate("/perfil-turista")}
              >
                Mi perfil
              </button>

              {/* Cerrar sesión */}
              <button
                className="btn btn-outline-danger btn-sm fw-semibold"
                onClick={() => {
                  clearTurista();
                  navigate("/");
                }}
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
