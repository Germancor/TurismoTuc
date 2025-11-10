import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";

export default function EditReserva() {
  const { id } = useParams();
  const [reserva, setReserva] = useState({
    id_reserva: "",
    id_excursion: "",
    id_fecha: "",
    dni: "",
    turista: "",
    excursion: "",
    fecha_excursion: "",
    cantidad_personas: 1,
    monto_total: 0,
    estado_reserva: "pendiente",
  });
  const [excursiones, setExcursiones] = useState([]);
  const [fechasExcursion, setFechasExcursion] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar reserva y excursiones al montar
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reservaRes, excursionesRes] = await Promise.all([
          axios.get(`http://localhost:8000/api/reservas/${id}`),
          axios.get("http://localhost:8000/api/excursiones"),
        ]);

        const reservaData = reservaRes.data;
        setReserva(reservaData);
        setExcursiones(excursionesRes.data);

        // cargar las fechas de la excursión actual
        if (reservaData.id_excursion) {
          const fechasRes = await axios.get(
            `http://localhost:8000/api/excursiones/${reservaData.id_excursion}/fechas`
          );
          setFechasExcursion(fechasRes.data);
        }
      } catch (err) {
        console.error("Error cargando datos:", err);
        setError("No se pudo cargar la reserva o excursiones");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Cambiar excursión y cargar fechas disponibles
  const handleExcursionChange = async (e) => {
    const id_excursion = e.target.value;

    setReserva((prev) => ({
      ...prev,
      id_excursion,
      id_fecha: "",
    }));

    if (id_excursion) {
      try {
        const res = await axios.get(
          `http://localhost:8000/api/excursiones/${id_excursion}/fechas`
        );
        setFechasExcursion(res.data);
      } catch (err) {
        console.error("Error al cargar fechas:", err);
        Swal.fire("Error", "No se pudieron cargar las fechas de la excursión", "error");
      }
    } else {
      setFechasExcursion([]);
    }
  };

  // Manejo genérico de cambios
  const handleChange = (e) => {
    const { name, value } = e.target;
    setReserva((prev) => ({ ...prev, [name]: value }));
  };

  // Guardar cambios
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:8000/api/reservas/${id}`, reserva);
      Swal.fire({
        title: "Guardado",
        text: "La reserva fue actualizada correctamente",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "No se pudo actualizar la reserva", "error");
    }
  };

  if (loading)
    return <div className="text-center mt-4">Cargando reserva...</div>;
  if (error) return <div className="alert alert-danger mt-4">{error}</div>;

  return (
    <div className="card shadow-sm p-3">
      <h5 className="fw-bold text-warning mb-3">Editar Reserva</h5>
      <form onSubmit={handleSubmit}>
        {/* Turista */}
        <div className="mb-3">
          <label className="form-label">DNI del Turista</label>
          <input
            type="text"
            className="form-control"
            value={reserva.dni || ""}
            readOnly
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Nombre y Apellido</label>
          <input
            type="text"
            className="form-control"
            value={reserva.turista || ""}
            readOnly
          />
        </div>

        {/* Excursión */}
        <div className="mb-3">
          <label className="form-label">Excursión</label>
          <select
            name="id_excursion"
            value={reserva.id_excursion || ""}
            onChange={handleExcursionChange}
            className="form-select"
            required
          >
            <option value="">Seleccionar excursión</option>
            {excursiones.map((e) => (
              <option key={e.id_excursion} value={e.id_excursion}>
                {e.titulo}
              </option>
            ))}
          </select>
        </div>

        {/* Fecha Excursión */}
        <div className="mb-3">
          <label className="form-label">Fecha de Excursión</label>
          <select
            name="id_fecha"
            value={reserva.id_fecha || ""}
            onChange={handleChange}
            className="form-select"
            required
            disabled={!fechasExcursion.length}
          >
            <option value="">
              {fechasExcursion.length
                ? "Seleccionar fecha disponible"
                : "Seleccione una excursión primero"}
            </option>
            {fechasExcursion.map((f) => (
              <option
                key={f.id_fecha}
                value={f.id_fecha}
                disabled={f.cupo_disponible <= 0}
              >
                {new Date(f.fecha).toLocaleDateString()} —{" "}
                {f.cupo_disponible > 0
                  ? `Cupo: ${f.cupo_disponible}`
                  : "Sin cupo"}
              </option>
            ))}
          </select>
        </div>

        {/* Cantidad */}
        <div className="mb-3">
          <label className="form-label">Cantidad de Personas</label>
          <input
            type="number"
            name="cantidad_personas"
            value={reserva.cantidad_personas}
            onChange={handleChange}
            className="form-control"
            min="1"
            required
          />
        </div>

        {/* Monto */}
        <div className="mb-3">
          <label className="form-label">Monto Total</label>
          <input
            type="number"
            name="monto_total"
            value={reserva.monto_total}
            onChange={handleChange}
            className="form-control"
            step="0.01"
            min="0"
            required
          />
        </div>

        {/* Estado */}
        <div className="mb-3">
          <label className="form-label">Estado</label>
          <select
            name="estado_reserva"
            value={reserva.estado_reserva}
            onChange={handleChange}
            className="form-select"
            required
          >
            <option value="pendiente">Pendiente</option>
            <option value="confirmada">Confirmada</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>

        <button type="submit" className="btn btn-warning">
          Guardar cambios
        </button>
        <Link to="/dashboard-admin/reservas" className="btn btn-secondary ms-2">
          Volver
        </Link>
      </form>
    </div>
  );
}
