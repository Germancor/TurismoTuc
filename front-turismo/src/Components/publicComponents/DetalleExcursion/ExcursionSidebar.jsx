import { Card, Button, Form } from "react-bootstrap";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { getLocalizedPrice, i18n } from "../../../Language/index";
import Swal from "sweetalert2";
import useTuristaStore from "../../../store/useTuristaStore";
import useCarritoStore from "../../../store/useCarritoStore";
import "../../../styles/publicComponents/detalleex.css";

export default function ExcursionSidebar({ excursion, fechas }) {
  const { t } = useTranslation();
  const [personas, setPersonas] = useState(1);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    fechas && fechas.length > 0 ? fechas[0].id_fecha : null,
  );

  const { turista } = useTuristaStore();
  const { addItem } = useCarritoStore();

  const handleAgregar = async () => {
    if (!turista) {
      Swal.fire({
        icon: "warning",
        title: "Tenés que iniciar sesión",
        text: "Iniciá sesión para poder agregar al carrito.",
      });
      return;
    }

    if (!fechas || fechas.length === 0) {
      Swal.fire({
        icon: "info",
        title: "Sin fechas disponibles",
        text: "No hay fechas disponibles para esta excursión.",
      });
      return;
    }

    if (!fechaSeleccionada) {
      Swal.fire({
        icon: "warning",
        title: "Seleccioná una fecha",
        text: "Elegí una fecha antes de continuar.",
      });
      return;
    }

    const fechaObj = fechas.find(
      (f) => f.id_fecha === Number(fechaSeleccionada),
    );
    if (fechaObj && Number(personas) > fechaObj.cupo_disponible) {
      Swal.fire({
        icon: "error",
        title: "Cupo insuficiente",
        text: `Solo quedan ${fechaObj.cupo_disponible} lugares disponibles.`,
      });
      return;
    }

    await addItem(Number(fechaSeleccionada), Number(personas));
  };

  return (
    <Card className="excursion-sidebar shadow-sm border-0 sticky-md-top">
      <Card.Body>
        {/* Precio */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold text-teal mb-0">{t("sidebar.from")}</h5>
          <h4 className="fw-bold text-success mb-0">
            {getLocalizedPrice(excursion.precio_base, t)}
          </h4>
        </div>

        {/* Fechas disponibles */}
        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold">
            {t("sidebar.availableDates")}
          </Form.Label>

          {fechas && fechas.length > 0 ? (
            <Form.Select
              value={fechaSeleccionada || ""}
              onChange={(e) => setFechaSeleccionada(e.target.value)}
            >
              {fechas.map((f) => (
                <option key={f.id_fecha} value={f.id_fecha}>
                  {new Date(f.fecha).toLocaleDateString(i18n.language, {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}{" "}
                  — {f.hora_salida?.slice(0, 5)} hs ({f.cupo_disponible}{" "}
                  lugares)
                </option>
              ))}
            </Form.Select>
          ) : (
            <div className="text-muted small fst-italic px-2 py-2 border rounded bg-light">
              Sin fechas disponibles
            </div>
          )}
        </Form.Group>

        {/* Personas */}
        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold">{t("sidebar.people")}</Form.Label>
          <Form.Control
            type="number"
            min="1"
            value={personas}
            onChange={(e) => setPersonas(e.target.value)}
          />
        </Form.Group>

        {/* Botón dinámico */}
        {fechas && fechas.length > 0 ? (
          <Button
            variant="warning"
            className="w-100 fw-semibold py-2 mb-2"
            onClick={handleAgregar}
          >
            {t("sidebar.addToCart")}
          </Button>
        ) : (
          <Button
            variant="secondary"
            className="w-100 fw-semibold py-2 mb-2"
            disabled
          >
            No hay fechas disponibles
          </Button>
        )}
      </Card.Body>
    </Card>
  );
}
