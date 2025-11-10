import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Card, Table, Button, Spinner } from "react-bootstrap";
import "../../styles/components/guia.css";

export default function ParticipantesExcursion() {
  const { id } = useParams();
  const [participantes, setParticipantes] = useState([]);
  const [excursion, setExcursion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resPart, resExc] = await Promise.all([
          axios.get(`http://localhost:8000/api/excursiones/${id}/participantes`),
          axios.get(`http://localhost:8000/api/excursiones/${id}`)
        ]);
        setParticipantes(resPart.data);
        setExcursion(resExc.data);
      } catch (err) {
        console.error("Error al obtener datos:", err);
        setError("No se pudo cargar la lista de participantes.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
        <p className="text-muted mt-2">Cargando participantes...</p>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-danger text-center mt-4">{error}</div>;
  }

  return (
    <Card className="shadow-sm participantes-card">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-3 print-header">
          <div>
            <h5 className="fw-bold text-primary mb-0">Participantes de la excursión</h5>
            {excursion && (
              <p className="text-muted mb-0">Excursión: <strong>{excursion.titulo}</strong></p>
            )}
          </div>
          <Button variant="outline-secondary" onClick={handlePrint} className="no-print">
            🖨️ Imprimir lista
          </Button>
        </div>

        <Table hover responsive className="align-middle">
          <thead className="table-light">
            <tr>
              <th>#</th>
              <th>Nombre</th>
              <th>Apellido</th>
              <th>DNI</th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>
            {participantes.length > 0 ? (
              participantes.map((p, i) => (
                <tr key={p.id_usuario}>
                  <td>{i + 1}</td>
                  <td>{p.nombre}</td>
                  <td>{p.apellido}</td>
                  <td>{p.dni}</td>
                  <td>{p.email}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center text-muted py-3">
                  No hay participantes registrados para esta excursión.
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
}