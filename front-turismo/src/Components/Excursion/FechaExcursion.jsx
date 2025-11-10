import { useEffect, useState } from "react";
import axios from "axios";

export default function FechasExcursion({ id_excursion }) {
  const [fechas, setFechas] = useState([]);
  const [nueva, setNueva] = useState({ fecha: "", hora_salida: "", cupo_maximo: "" });

  useEffect(() => {
    const fetchFechas = async () => {
      try {
        const res = await axios.get(`http://localhost:8000/api/excursiones/${id_excursion}/fechas`);
        setFechas(res.data);
      } catch (err) {
        console.error("Error al obtener fechas:", err);
      }
    };
    fetchFechas();
  }, [id_excursion]);

  const handleAddFecha = async () => {
    try {
      await axios.post("http://localhost:8000/api/excursiones/fechas-excursion", {
        id_excursion,
        ...nueva,
      });
      setNueva({ fecha: "", hora_salida: "", cupo_maximo: "" });
      const res = await axios.get(`http://localhost:8000/api/excursiones/${id_excursion}/fechas`);
      setFechas(res.data);
    } catch (err) {
      console.error("Error al agregar fecha:", err);
    }
  };

  return (
    <>
      <h5 className="fw-bold">Fechas de la excursión</h5>
      <table className="table table-sm table-bordered">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Hora</th>
            <th>Cupo</th>
            <th>Disponible</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {fechas.map((f) => (
            <tr key={f.id_fecha}>
              <td>{new Date(f.fecha).toLocaleDateString()}</td>
              <td>{f.hora_salida?.slice(0, 5)}</td>
              <td>{f.cupo_maximo}</td>
              <td>{f.cupo_disponible}</td>
              <td>{f.estado}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="row g-2 mt-3">
        <div className="col-md-4">
          <input type="date" className="form-control" value={nueva.fecha} onChange={(e) => setNueva({ ...nueva, fecha: e.target.value })} />
        </div>
        <div className="col-md-3">
          <input type="time" className="form-control" value={nueva.hora_salida} onChange={(e) => setNueva({ ...nueva, hora_salida: e.target.value })} />
        </div>
        <div className="col-md-3">
          <input type="number" className="form-control" placeholder="Cupo" value={nueva.cupo_maximo} onChange={(e) => setNueva({ ...nueva, cupo_maximo: e.target.value })} />
        </div>
        <div className="col-md-2">
          <button className="btn btn-outline-success w-100" onClick={handleAddFecha}>Agregar</button>
        </div>
      </div>
    </>
  );
}