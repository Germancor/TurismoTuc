import { Routes, Route } from "react-router-dom";
import Sidebar from "./Sidebar";
import TuristasCRUD from "./CRUDS/TuristasCRUD";
import ExcursionesCRUD from "./CRUDS/ExcursionesCRUD";
import ReservasCRUD from "./CRUDS/ReservasCRUD";
import UsuariosCRUD from "./CRUDS/UsuariosCRUD";
import ReseñasCRUD from "./CRUDS/ReseniasCRUD";
import FechasCRUD from "./CRUDS/FechasCRUD";
import DashboardHome from "./DashboardHome";

const Dashboard = () => {
  return (
    <div className="app-wrapper">
      <Sidebar />
      <div className="main-content">
        <div className="content-wrapper">
          <Routes>
            <Route path="/" element={<DashboardHome />} />
            <Route path="excursiones/*" element={<ExcursionesCRUD />} />
            <Route path="fechas/*" element={<FechasCRUD />} />
            <Route path="turistas/*" element={<TuristasCRUD />} />
            <Route path="reservas/*" element={<ReservasCRUD />} />
            <Route path="reseñas/*" element={<ReseñasCRUD />} />
            <Route path="usuarios/*" element={<UsuariosCRUD />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;