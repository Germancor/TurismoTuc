// src/Components/publicComponents/DetalleExcursion/ExcursionSidebar.jsx
import { Card, Button, Form } from "react-bootstrap";
import { useState } from "react";
import useTuristaStore from "../../../store/useTuristaStore";
import useCarritoStore from "../../../store/useCarritoStore";
import "../../../styles/publicComponents/detalleex.css";

export default function ExcursionSidebar({ excursion, fechas }) {
  const [personas, setPersonas] = useState(1);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    fechas && fechas.length > 0 ? fechas[0].id_fecha : null
  );

  const { turista } = useTuristaStore();
  const { addItem } = useCarritoStore();

  const handleAgregar = async () => {
    if (!turista) {
      alert("Tenés que iniciar sesión para agregar al carrito");
      return;
    }
    if (!fechaSeleccionada) {
      alert("Seleccioná una fecha primero");
      return;
    }

    // 👇 esto ahora va al backend del carrito
    await addItem(
      Number(fechaSeleccionada),
      Number(personas)
    );

    
  };

  return (
    <Card className="excursion-sidebar shadow-sm border-0 sticky-md-top">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold text-teal mb-0">Desde</h5>
          <h4 className="fw-bold text-success mb-0">
            ${excursion.precio_base?.toLocaleString("es-AR")} ARS
          </h4>
        </div>

        {/* Fechas */}
        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold">Fechas disponibles</Form.Label>
          <Form.Select
            value={fechaSeleccionada || ""}
            onChange={(e) => setFechaSeleccionada(e.target.value)}
          >
            {fechas && fechas.length > 0 ? (
              fechas.map((f) => (
                <option key={f.id_fecha} value={f.id_fecha}>
                  {new Date(f.fecha).toLocaleDateString("es-AR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}{" "}
                  — {f.hora_salida?.slice(0, 5)} hs
                </option>
              ))
            ) : (
              <option disabled>No hay fechas disponibles</option>
            )}
          </Form.Select>
        </Form.Group>

        {/* Personas */}
        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold">Personas</Form.Label>
          <Form.Control
            type="number"
            min="1"
            value={personas}
            onChange={(e) => setPersonas(e.target.value)}
          />
        </Form.Group>

        <Button
          variant="warning"
          className="w-100 fw-semibold py-2 mb-2"
          onClick={handleAgregar}
        >
          Agregar al carrito
        </Button>

        <Button variant="outline-secondary" className="w-100 fw-semibold py-2">
          Descargar comprobante
        </Button>
      </Card.Body>
    </Card>
  );
}
