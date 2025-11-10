import { NavLink, useNavigate } from "react-router-dom";
import { Button } from "react-bootstrap";
import {
  FaUsers,
  FaMapMarkedAlt,
  FaClipboardList,
  FaComments,
  FaUserTie,
  FaHome,
  FaSignOutAlt,
  FaGlobeAmericas,
} from "react-icons/fa";
import useUserStore from "../../store/useUserStore";
import "../../styles/components/sidebar.css";

export default function Sidebar() {
  const navigate = useNavigate();
  const { clearUser } = useUserStore();

  const links = [
    { to: "/dashboard-admin/excursiones", label: "Excursiones", icon: <FaMapMarkedAlt /> },
    { to: "/dashboard-admin/turistas", label: "Turistas", icon: <FaUsers /> },
    { to: "/dashboard-admin/fechas", label: "Fechas", icon: <FaUsers /> },
    { to: "/dashboard-admin/reservas", label: "Reservas", icon: <FaClipboardList /> },
    { to: "/dashboard-admin/reseñas", label: "Reseñas", icon: <FaComments /> },
    { to: "/dashboard-admin/usuarios", label: "Usuarios", icon: <FaUserTie /> },
  ];

  const handleLogout = () => {
    clearUser();
    localStorage.removeItem("token");
    navigate("/"); // Redirige al inicio
  };

  const handleGoToMain = () => {
    navigate("/"); // ✅ navegación interna, sin recargar la SPA
  };

  return (
    <div className="sidebar bg-white shadow-sm d-flex flex-column">
      <hr />
      <br />
      <div
        onClick={() => navigate("/dashboard-admin")}
        className="sidebar-header fw-bold text-success mb-3 d-block text-decoration-none text-center"
        style={{ cursor: "pointer" }}
      >
        <FaHome size={32} className="d-block mx-auto mb-2" />
        INICIO PANEL ADMIN
      </div>

      <nav>
        <ul className="nav flex-column">
          {links.map((link) => (
            <li key={link.to} className="nav-item">
              <NavLink
                to={link.to}
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                {link.icon}
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* 🔹 Botón para volver al sitio principal */}
      <Button
        variant="outline-success"
        className="w-100 d-flex align-items-center justify-content-center gap-2 mt-auto mb-2"
        onClick={handleGoToMain}
      >
        <FaGlobeAmericas />
        Ir al sitio principal
      </Button>

      {/* 🔴 Cerrar sesión */}
      <Button
        variant="danger"
        onClick={handleLogout}
        className="logout-button mt-2"
      >
        <FaSignOutAlt className="me-2" />
        Cerrar Sesión
      </Button>
    </div>
  );
}
