import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";

export default function ViewReserva() {
  const { id } = useParams();
  const [reserva, setReserva] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReserva = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/api/reservas/${id}`);
        setReserva(res.data);
      } catch (err) {
        console.error(err);
        setError("No se pudo cargar la reserva");
      } finally {
        setLoading(false);
      }
    };
    fetchReserva();
  }, [id]);

  if (loading) return <div className="text-center mt-4">Cargando reserva...</div>;
  if (error) return <div className="alert alert-danger mt-4">{error}</div>;
  if (!reserva) return <div className="alert alert-warning mt-4">Reserva no encontrada</div>;

  return (
    <div className="card shadow-sm p-3">
      <h5 className="fw-bold text-info mb-3">Detalle de Reserva</h5>
      <ul className="list-group">
        <li className="list-group-item"><strong>ID:</strong> {reserva.id_reserva}</li>
        <li className="list-group-item"><strong>Turista:</strong> {reserva.turista}</li>
        <li className="list-group-item"><strong>Excursión:</strong> {reserva.excursion}</li>
        <li className="list-group-item"><strong>Fecha Excursión:</strong> {new Date(reserva.fecha_excursion).toLocaleDateString()}</li>
        <li className="list-group-item"><strong>Cantidad:</strong> {reserva.cantidad_personas}</li>
        <li className="list-group-item"><strong>Monto Total:</strong> ${parseFloat(reserva.monto_total).toFixed(2)}</li>
        <li className="list-group-item"><strong>Estado:</strong> {reserva.estado_reserva}</li>
        <li className="list-group-item"><strong>Fecha Reserva:</strong> {new Date(reserva.fecha_reserva).toLocaleDateString()}</li>
      </ul>
      <Link to="/dashboard-admin/reservas" className="btn btn-secondary mt-3">Volver</Link>
    </div>
  );
}
