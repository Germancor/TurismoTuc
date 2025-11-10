import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import "../../styles/components/reservas/reservas.css";

export default function CreateReserva() {
  const navigate = useNavigate();

  // Listas para selects
  const [turistas, setTuristas] = useState([]);
  const [idTurista, setIdTurista] = useState("");
  const [nombreTurista, setNombreTurista] = useState("");
  const [excursiones, setExcursiones] = useState([]);
  const [fechasExcursion, setFechasExcursion] = useState([]);

  const [reserva, setReserva] = useState({
    id_turista: "",
    id_fecha: "",
    dni: "",
    cantidad_personas: 1,
    estado_reserva: "pendiente",
  });

  const [saving, setSaving] = useState(false);

  // Obtener datos al montar el componente
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [turistasRes, fechasRes] = await Promise.all([
          axios.get("http://localhost:8000/api/turistas"),
          axios.get("http://localhost:8000/api/excursiones"),
        ]);
        setTuristas(turistasRes.data);
        setExcursiones(fechasRes.data);
      } catch (err) {
        console.error("Error cargando listas:", err);
        Swal.fire(
          "Error",
          "No se pudieron cargar turistas o excursiones",
          "error"
        );
      }
    };
    fetchData();
  }, []);

  // ===============================
  // Buscar turista por DNI
  // ===============================
  const buscarTuristaPorDNI = () => {
    const turista = turistas.find((t) => t.dni == reserva.dni);
    if (turista) {
      setNombreTurista(turista.nombre_completo);
      setReserva((prev) => ({ ...prev, id_turista: turista.id_turista }));
    } else {
      setNombreTurista("");
      setReserva((prev) => ({ ...prev, id_turista: "" }));
      Swal.fire("Atención", "No se encontró un turista con ese DNI", "warning");
    }
  };
  // Cuando cambia la excursión seleccionada → cargar sus fechas
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
        Swal.fire(
          "Error",
          "No se pudieron cargar las fechas de esta excursión",
          "error"
        );
      }
    } else {
      setFechasExcursion([]);
    }
  };

  // Manejar cambios de formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setReserva((prev) => ({
      ...prev,
      [name]: name === "cantidad_personas" ? Number(value) : value,
    }));
  };

  // Enviar al backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reserva.id_turista || !reserva.id_fecha) {
      Swal.fire(
        "Atención",
        "Debe seleccionar un turista y una fecha",
        "warning"
      );
      return;
    }
    setSaving(true);
    try {
      await axios.post("http://localhost:8000/api/reservas", reserva);
      Swal.fire({
        title: "Creada",
        text: "La reserva fue registrada correctamente",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });

      // Actualizar cupo en el estado de fechas
      setFechasExcursion((prev) =>
        prev.map((f) =>
          f.id_fecha === reserva.id_fecha
            ? { ...f, cupo_disponible: res.data.nuevoCupo }
            : f
        )
      );

      setReserva({
        id_turista: "",
        id_fecha: "",
        cantidad_personas: 1,
        estado_reserva: "pendiente",
      });
      setIdTurista("");
      setNombreTurista("");
      navigate("/dashboard-admin/reservas");
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "No se pudo crear la reserva", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card shadow-sm p-3">
      <h5 className="fw-bold text-success mb-3">Crear Nueva Reserva</h5>
      <form onSubmit={handleSubmit}>
        {/* Turista */}
        <div className="mb-3">
          <label className="form-label">DNI del Turista</label>
          <input
            type="text"
            name="dni"
            value={reserva.dni}
            onChange={handleChange}
            onBlur={buscarTuristaPorDNI}
            className="form-control"
            placeholder="Ingrese DNI del turista"
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Nombre y Apellido</label>
          <input
            type="text"
            className="form-control"
            value={nombreTurista}
            readOnly
            placeholder="Se completa automáticamente"
          />
        </div>

        {/* Excursión */}
        <div className="mb-3">
          <label className="form-label">Excursión</label>
          <select
            name="id_excursion"
            value={reserva.id_excursion}
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
            value={reserva.id_fecha}
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
                  ? `Cupo disponible: ${f.cupo_disponible}`
                  : "Sin cupo"}
              </option>
            ))}
          </select>
        </div>

        {/* Cantidad de personas */}
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

        <button type="submit" className="btn btn-success" disabled={saving}>
          {saving ? "Guardando..." : "Crear Reserva"}
        </button>
        <Link to="/dashboard-admin/reservas" className="btn btn-secondary ms-2">
          Volver
        </Link>
      </form>
    </div>
  );
}
