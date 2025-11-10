import SidebarGuia from "../../../Components/Guia/SidebarGuia.jsx";
import GuiaRoutes from "./GuiaRoutes.jsx";

export default function DashboardGuia() {
  return (
    <div className="app-wrapper">
      <SidebarGuia />
      <div className="main-content">
        <div className="content-wrapper">
          <GuiaRoutes />
        </div>
      </div>
    </div>
  );
}