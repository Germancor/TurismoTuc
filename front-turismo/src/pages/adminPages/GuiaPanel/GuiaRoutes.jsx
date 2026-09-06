import { Routes, Route } from "react-router-dom";
import MainExcursionesGuia from "../../../Components/Guia/MainExcursionesGuia.jsx";
import FechasExcursion from "../../../Components/Guia/FechasExcursion.jsx";
import ParticipantesExcursion from "../../../Components/Guia/ParticipantesExcursion.jsx";
import PerfilGuia from "../../../Components/Guia/PerfilGuia.jsx";

export default function GuiaRoutes() {
  return (
    <Routes>
      <Route path="/" element={<MainExcursionesGuia />} />
      <Route path="excursiones" element={<MainExcursionesGuia />} />
      <Route path="excursiones/:id/fechas" element={<FechasExcursion />}/>
      <Route path="excursiones/:id/fechas/:idFecha/participantes" element={<ParticipantesExcursion />}/>
      <Route path="perfil" element={<PerfilGuia />} />
    </Routes>
  );
}