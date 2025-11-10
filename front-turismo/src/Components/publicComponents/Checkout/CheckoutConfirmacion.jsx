// src/Components/publicComponents/Checkout/CheckoutConfirmacion.jsx
import { Card, Alert } from "react-bootstrap";

export default function CheckoutConfirmacion({ data }) {
  if (!data) {
    return (
      <Alert variant="warning">
        No hay datos de la reserva. Volvé al inicio del checkout.
      </Alert>
    );
  }

  return (
    <Card className="p-4 shadow-sm">
      <h4>¡Reserva confirmada!</h4>
      <p className="text-muted">
        Te enviamos un email con los detalles de tu tour.
      </p>

      <ul>
        <li>
          <strong>N° de reserva:</strong> {data.id_reserva}
        </li>
        <li>
          <strong>Total pagado:</strong> ${data.monto_total ?? "0.00"}
        </li>
        <li>
          <strong>Método:</strong> {data.metodo ? data.metodo : "Payway"}
        </li>
      </ul>
    </Card>
  );
}
