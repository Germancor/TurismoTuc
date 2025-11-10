import { useEffect, useState } from "react";
import { Card, Button, Form, Alert, Spinner } from "react-bootstrap";
import axios from "axios";
import useCarritoStore from "../../../store/useCarritoStore"; // ✅ default import

export default function CheckoutPago({ turista, onNext }) {
  const [metodo, setMetodo] = useState("");
  const [referencia, setReferencia] = useState("");
  const [procesandoPago, setProcesandoPago] = useState(false);
  const [msgError, setMsgError] = useState("");
  const [msgInfo, setMsgInfo] = useState("");

  const [idCarrito, setIdCarrito] = useState(null);
  const [item, setItem] = useState(null);

  // 1) Traer carrito abierto del turista y sus ítems
  useEffect(() => {
    const cargarCarrito = async () => {
      try {
        setMsgError("");
        const id_turista = turista.id_turista || turista.id;

        // carrito del turista
        const carRes = await axios.get(
          `http://localhost:8000/api/carrito/${id_turista}`
        );
        const id_carrito = carRes.data?.id_carrito ?? carRes.data?.id;
        setIdCarrito(id_carrito);

        // ítems del carrito
        const itemsRes = await axios.get(
          `http://localhost:8000/api/carrito/${id_carrito}/items`
        );

        if (!itemsRes.data || itemsRes.data.length === 0) {
          setMsgInfo("Tu carrito está vacío. Volvé al catálogo y agregá una excursión.");
          return;
        }

        setItem(itemsRes.data[0]);
      } catch (e) {
        console.error(e);
        setMsgError("No se pudo obtener el carrito. Probá recargar la página.");
      }
    };

    cargarCarrito();
  }, [turista]);

  const crearReserva = async () => {
    if (!item) {
      setMsgError("No hay ítems en el carrito.");
      return null;
    }

    const payload = {
      id_turista: turista.id_turista || turista.id,
      id_fecha: item.id_fecha,
      cantidad_personas: item.cantidad_personas,
    };

    const res = await axios.post("http://localhost:8000/api/reservas", payload);
    return res.data;
  };

  const pagarPayway = async (id_reserva) => {
    const res = await axios.post(
      "http://localhost:8000/api/pagos/payway/iniciar",
      { id_reserva }
    );
    return res.data;
  };

  const pagarTransferencia = async (id_reserva) => {
    const res = await axios.post(
      "http://localhost:8000/api/pagos/transferencia",
      {
        id_reserva,
        referencia: referencia || null,
      }
    );
    return res.data;
  };

  const handleConfirmar = async () => {
    try {
      if (!metodo) {
        setMsgError("Seleccioná un método de pago.");
        return;
      }
      if (!item) {
        setMsgError("No hay ítems en el carrito.");
        return;
      }

      setProcesandoPago(true);
      setMsgError("");
      setMsgInfo("Procesando tu pago...");

      // simulamos demora de pasarela
      await new Promise((r) => setTimeout(r, 2000));

      // 1) crear reserva
      const reserva = await crearReserva();
      const id_reserva = reserva.id_reserva;

      // 2) pagar
      let pago;
      if (metodo === "Payway") {
        pago = await pagarPayway(id_reserva);
      } else {
        pago = await pagarTransferencia(id_reserva);
      }

      // 3) vaciar carrito en el store ✅
      useCarritoStore.getState().clearCarrito();

      // 4) mini delay para que se vea más real
      await new Promise((r) => setTimeout(r, 800));

      // 5) pasar al paso de confirmación
      onNext({
      id_reserva: reserva.id_reserva,
      monto_total: reserva.monto_total ?? pago.data?.amount ?? 0,
      metodo,
      estado_reserva: reserva.estado_reserva ?? "confirmada",
      });
    } catch (err) {
      console.error("Error en el proceso de pago:", err);
      const apiMsg = err?.response?.data?.message;
      setMsgError(apiMsg || "Error al crear la reserva/pago.");
    } finally {
      setProcesandoPago(false);
      setMsgInfo("");
    }
  };

  return (
    <Card className="p-4 shadow-sm">
      <h4 className="mb-3">Elegí cómo pagar</h4>

      {msgError && <Alert variant="danger">{msgError}</Alert>}
      {msgInfo && procesandoPago && <Alert variant="info">{msgInfo}</Alert>}

      {item && (
        <Alert variant="light" className="mb-3">
          <div>
            <h5 className="mb-1 text-success">
              {item.excursion || "Excursión"}
            </h5>
            <p className="mb-1">
              <strong>Fecha:</strong>{" "}
              {item.fecha
                ? new Date(item.fecha).toLocaleDateString("es-AR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })
                : "No disponible"}
            </p>
            <p className="mb-1">
              <strong>Personas:</strong> {item.cantidad_personas}
            </p>
            <p className="mb-1">
              <strong>Precio por persona:</strong>{" "}
              ${item.precio_unitario?.toLocaleString("es-AR") ?? "—"}
            </p>
            <p className="mb-0">
              <strong>Total:</strong>{" "}
              ${item.subtotal?.toLocaleString("es-AR") ?? "—"}
            </p>
          </div>
        </Alert>
      )}

      <div className="d-flex gap-3 mb-4">
        <Button
          variant={metodo === "Payway" ? "success" : "outline-success"}
          className="flex-fill"
          onClick={() => setMetodo("Payway")}
          disabled={procesandoPago}
        >
          Payway (tarjetas)
        </Button>
        <Button
          variant={metodo === "Transferencia" ? "success" : "outline-success"}
          className="flex-fill"
          onClick={() => setMetodo("Transferencia")}
          disabled={procesandoPago}
        >
          Transferencia / Depósito
        </Button>
      </div>

      {metodo === "Transferencia" && (
        <div className="border rounded p-3 mb-3">
          <p className="mb-2">
            Transferí el total al <strong>alias</strong>{" "}
            <code>AGENCIATUCUMAN.mp</code> o al <strong>CBU</strong> 000...000
          </p>
          <Form.Control
            placeholder="Nro. de operación / referencia (opcional)"
            value={referencia}
            onChange={(e) => setReferencia(e.target.value)}
            disabled={procesandoPago}
          />
        </div>
      )}

      <Button
        variant="success"
        className="w-100"
        onClick={handleConfirmar}
        disabled={procesandoPago || !item}
      >
        {procesandoPago ? (
          <>
            <Spinner as="span" animation="border" size="sm" /> Procesando pago...
          </>
        ) : (
          "Confirmar y pagar"
        )}
      </Button>
    </Card>
  );
}
