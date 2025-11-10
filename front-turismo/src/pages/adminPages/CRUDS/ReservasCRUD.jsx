import { Routes, Route } from "react-router-dom";
import MainReservas from "../../../Components/Reservas/MainReservas";
import CreateReserva from "../../../Components/Reservas/CreateReserva";
import EditReserva from "../../../Components/Reservas/EditReserva";
import ViewReserva from "../../../Components/Reservas/ViewReserva";
import RestoreReservas from "../../../Components/Reservas/RestoreReserva";

const ReservasCRUD = () => {
  return (
    <div className="container py-3">
      <Routes>
        <Route index element={<MainReservas />} />

        <Route path="create" element={<CreateReserva />} />

        <Route path="edit/:id" element={<EditReserva />} />

        <Route path="view/:id" element={<ViewReserva />} />

        <Route path="deletes" element={<RestoreReservas />} />
      </Routes>
    </div>
  );
}

export default ReservasCRUD;