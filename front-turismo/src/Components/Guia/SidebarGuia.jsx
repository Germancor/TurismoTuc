import { NavLink, Link, useNavigate } from "react-router-dom";
import { Button } from "react-bootstrap";
import { FaMapMarkedAlt, FaUserTie, FaHome, FaSignOutAlt } from "react-icons/fa";
import useUserStore from "../../store/useUserStore";
import "../../styles/components/sidebar.css"; // Asegurate de tener estilos si querés

export default function SidebarGuia() {
  const navigate = useNavigate();
  const { user, clearUser } = useUserStore();

  const links = [
    { to: "/dashboard-guia/excursiones", label: "Mis Excursiones", icon: <FaMapMarkedAlt /> },
    { to: "/dashboard-guia/perfil", label: "Mi Perfil", icon: <FaUserTie /> },
  ];

  const handleLogout = () => {
    clearUser();
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="sidebar bg-white shadow-sm d-flex flex-column p-3" style={{ minHeight: "100vh", width: "250px" }}>
      <Link to="/dashboard-guia" className="sidebar-header fw-bold text-primary mb-4 text-decoration-none text-center">
        <FaHome size={32} className="mb-2" />
        PANEL GUÍA
      </Link>

      {user && (
        <div className="text-center mb-4">
          <p className="fw-semibold mb-0">👋 Hola, {user.nombre}</p>
          <small className="text-muted">{user.email}</small>
        </div>
      )}

      <nav>
        <ul className="nav flex-column">
          {links.map((link) => (
            <li key={link.to} className="nav-item mb-2">
              <NavLink
                to={link.to}
                className={({ isActive }) => `nav-link d-flex align-items-center ${isActive ? "active fw-bold text-success" : "text-dark"}`}
              >
                {link.icon}
                <span className="ms-2">{link.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <Button variant="outline-danger" onClick={handleLogout} className="mt-auto">
        <FaSignOutAlt className="me-2" />
        Cerrar sesión
      </Button>
    </div>
  );
}