import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const RestoreReserva = () => {
  const [reservasEliminadas, setReservasEliminadas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  
  const fetchEliminadas = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/reservas/eliminadas");
      setReservasEliminadas(res.data);
      setError(null);
    } catch (err) {
      console.error("Error al cargar reservas eliminadas:", err);
      setError("No se pudieron cargar las reservas eliminadas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEliminadas();
  }, []);

  const handleRestore = async (id) => {
    const confirm = await Swal.fire({
      title: "¿Restaurar reserva?",
      text: "La reserva volverá a estar activa",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, restaurar",
      cancelButtonText: "Cancelar",
    });

    if (!confirm.isConfirmed) return;

    try {
      await axios.put(`http://localhost:8000/api/reservas/restaurar/${id}`);
      Swal.fire("Restaurada", "La reserva fue restaurada correctamente", "success");
      fetchEliminadas(); // recargar lista
    } catch (err) {
      console.error("Error al restaurar reserva:", err);
      Swal.fire("Error", "No se pudo restaurar la reserva", "error");
    }
  };

  if (loading) return <div className="text-center">Cargando reservas eliminadas...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Reservas Eliminadas</h2>

      {reservasEliminadas.length === 0 ? (
        <p>No hay reservas eliminadas.</p>
      ) : (
        <table className="table table-bordered text-center align-middle">
          <thead className="table-dark">
            <tr>
              <th>ID</th>
              <th>Cliente</th>
              <th>Destino</th>
              <th>Fecha Reserva</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {reservasEliminadas.map((reserva) => (
              <tr key={reserva.id_reserva}>
                <td>{reserva.id_reserva}</td>
                <td>{reserva.nombre_turista}</td>
                <td>{reserva.destino}</td>
                <td>{reserva.fecha_reserva}</td>
                <td>
                  <button
                    onClick={() => handleRestore(reserva.id_reserva)}
                    className="btn btn-success"
                  >
                    Restaurar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default RestoreReserva;
