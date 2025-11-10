import { Navigate } from "react-router-dom";
import useUserStore from "../store/useUserStore";

export default function ProtectedRoute({ allowedRoles, children }) {
  const { user } = useUserStore();

  if (!user) {
    return <Navigate to="/admin" />;
  }

  // ✅ Normaliza el rol del usuario
  const normalizedUserRole = user.rol?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // ✅ Normaliza los roles permitidos
  const normalizedAllowedRoles = allowedRoles.map((role) =>
    role.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  );

  // ✅ Verifica si el rol del usuario está permitido
  if (!normalizedAllowedRoles.includes(normalizedUserRole)) {
    return <Navigate to="/" />;
  }

  return children;
}