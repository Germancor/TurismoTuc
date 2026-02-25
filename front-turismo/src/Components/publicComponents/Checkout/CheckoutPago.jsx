import { useEffect, useState } from "react";
import { Card, Button, Form, Alert, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import axios from "axios";
import useCarritoStore from "../../../store/useCarritoStore";

export default function CheckoutPago({ turista }) {
  const [idCarrito, setIdCarrito] = useState(null);
  const [referencia, setReferencia] = useState("");
  const [procesandoPago, setProcesandoPago] = useState(false);
  const [reservasPendientes, setReservasPendientes] = useState([]);
  const [msgError, setMsgError] = useState("");
  const [msgInfo, setMsgInfo] = useState("");

  const [comprobanteFile, setComprobanteFile] = useState(null);
  const [comprobantePreview, setComprobantePreview] = useState(null);

  const navigate = useNavigate();
  const [items, setItems] = useState([]);

  useEffect(() => {
    const cargarCarrito = async () => {
      try {
        setMsgError("");
        const id_turista = turista.id_turista || turista.id;

        const carRes = await axios.get(
          `http://localhost:8000/api/carrito/${id_turista}`,
        );

        if (!carRes.data) {
          setMsgInfo("Tu carrito está vacío.");
          useCarritoStore.getState().clearCarrito();
          return;
        }

        const itemsRes = await axios.get(
          `http://localhost:8000/api/carrito/${carRes.data.id_carrito}/items`,
        );

        if (!itemsRes.data || itemsRes.data.length === 0) {
          setMsgInfo("Tu carrito está vacío. Volvé al catálogo.");
          return;
        }

        setItems(itemsRes.data);
        setIdCarrito(carRes.data.id_carrito);
      } catch (e) {
        console.error(e);
        setMsgError("No se pudo obtener el carrito.");
      }
    };

    cargarCarrito();
  }, [turista]);

  // ✅ Evitar memory leak del preview
  useEffect(() => {
    return () => {
      if (comprobantePreview) URL.revokeObjectURL(comprobantePreview);
    };
  }, [comprobantePreview]);

  const handleComprobanteChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowed.includes(file.type)) {
      Swal.fire({
        icon: "error",
        title: "Formato no permitido",
        text: "Subí un PDF o una imagen (JPG/PNG/WEBP).",
        confirmButtonColor: "#0e7667",
      });
      e.target.value = "";
      return;
    }

    const maxMB = 8;
    if (file.size > maxMB * 1024 * 1024) {
      Swal.fire({
        icon: "warning",
        title: "Archivo muy grande",
        text: `El comprobante no puede superar ${maxMB}MB.`,
        confirmButtonColor: "#0e7667",
      });
      e.target.value = "";
      return;
    }

    if (comprobantePreview) URL.revokeObjectURL(comprobantePreview);

    setComprobanteFile(file);

    if (file.type.startsWith("image/")) {
      setComprobantePreview(URL.createObjectURL(file));
    } else {
      setComprobantePreview(null);
    }
  };

  const subirComprobante = async ({
    id_reserva,
    id_turista,
    referenciaFinal,
  }) => {
    if (!comprobanteFile) return;

    const fd = new FormData();
    fd.append("archivo", comprobanteFile);
    fd.append("id_reserva", id_reserva);
    fd.append("id_turista", id_turista);
    fd.append("descripcion", referenciaFinal ? `Ref: ${referenciaFinal}` : "");

    await axios.post("http://localhost:8000/api/comprobantes", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  };

  const handleConfirmar = async () => {
    const tieneReferencia = !!referencia.trim();
    const tieneArchivo = !!comprobanteFile;

    // ✅ Debe tener al menos uno (archivo o número)
    if (!tieneReferencia && !tieneArchivo) {
      await Swal.fire({
        icon: "warning",
        title: "Falta comprobante",
        text: "Para continuar, subí el comprobante (PDF/imagen) o ingresá el número de comprobante.",
        confirmButtonColor: "#0e7667",
      });
      return;
    }

    const referenciaFinal = tieneReferencia ? referencia.trim() : null;

    setProcesandoPago(true);
    setMsgError("");
    setMsgInfo("Procesando tus reservas...");

    const id_turista = turista.id_turista || turista.id;
    const reservasConfirmadas = [];

    try {
      for (const item of items) {
        // A) Crear Reserva
        const payloadReserva = {
          id_turista,
          id_fecha: item.id_fecha,
          cantidad_personas: item.cantidad_personas,
        };

        const resReserva = await axios.post(
          "http://localhost:8000/api/reservas",
          payloadReserva,
        );

        const nuevoIdReserva = resReserva.data?.id_reserva;
        if (!nuevoIdReserva) {
          throw new Error("No se recibió id_reserva al crear la reserva.");
        }

        // B) Registrar Pago (referencia opcional)
        await axios.post("http://localhost:8000/api/pagos/transferencia", {
          id_reserva: nuevoIdReserva,
          referencia: referenciaFinal,
        });

        // C) Subir comprobante si el usuario adjuntó archivo
        if (comprobanteFile) {
          await subirComprobante({
            id_reserva: nuevoIdReserva,
            id_turista,
            referenciaFinal,
          });
        }

        // D) Guardar datos para la siguiente pantalla
        reservasConfirmadas.push({
          id_reserva: nuevoIdReserva,
          id_excursion: item.id_excursion,
          nombre_excursion: item.excursion,
        });
      }

      // Vaciar carrito
      try {
        await axios.delete(`http://localhost:8000/api/carrito/vaciar/${id_turista}`);
        useCarritoStore.getState().clearCarrito();
        
      } catch (error) {
        console.warn("No se pudo limpiar carrito en backend", error);
      }
      useCarritoStore.getState().clearCarrito();

      await Swal.fire({
        title: "¡Pago enviado!",
        text: "Tus reservas fueron confirmadas. Ahora personalicemos tu experiencia.",
        icon: "success",
        confirmButtonColor: "#0e7667",
      });

      navigate("/preguntas-personalizadas", {
        state: { reservasRealizadas: reservasConfirmadas },
      });
    } catch (err) {
      console.error("Error en pago:", err);
      setMsgError(
        "Hubo un error al procesar las reservas. Verificá tu conexión.",
      );
    } finally {
      setProcesandoPago(false);
      setMsgInfo("");
    }
  };

  const crearReservasPendientes = async () => {
    const id_turista = turista.id_turista || turista.id;
    const ids = [];

    for (const item of items) {
      const res = await axios.post("http://localhost:8000/api/reservas", {
        id_turista,
        id_fecha: item.id_fecha,
        cantidad_personas: item.cantidad_personas,
        monto_total: item.subtotal,
      });

      ids.push(res.data.id_reserva);
    }

    setReservasPendientes(ids);
    return ids;
  };

  const handlePagarMercadoPago = async () => {
    try {
      setProcesandoPago(true);
      setMsgError("");
      setMsgInfo("Preparando reservas...");

      // 1️⃣ Crear reservas
      const reservasIds = await crearReservasPendientes();

      setMsgInfo("Redirigiendo a Mercado Pago...");

      const mpItems = items.map((it) => {
        const cantidad = Number(it.cantidad_personas);
        const subtotal = Number(it.subtotal);

        return {
          nombre: it.excursion,
          cantidad: cantidad,
          precio: Number((subtotal / cantidad).toFixed(2)),
        };
      });

      const response = await axios.post(
        "http://localhost:8000/api/pagos/crear-pago",
        {
          items: mpItems,
          id_turista: turista.id_turista || turista.id,
          reservas: reservasIds,
        },
      );

      window.location.href = response.data.init_point;
    } catch (error) {
      console.error("Error Mercado Pago:", error);
      setMsgError("No se pudo iniciar el pago con Mercado Pago.");
    } finally {
      setProcesandoPago(false);
      setMsgInfo("");
    }
  };

  const totalGeneral = items.reduce(
    (acc, it) => acc + Number(it.subtotal || 0),
    0,
  );

  return (
    <Card className="p-4 shadow-sm">
      <h4 className="mb-3 text-success">PAGO POR TRANSFERENCIA / MERCADO PAGO</h4>

      {msgError && <Alert variant="danger">{msgError}</Alert>}
      {msgInfo && <Alert variant="info">{msgInfo}</Alert>}

      {items.length > 0 ? (
        items.map((it, idx) => (
          <Alert key={idx} variant="light" className="mb-2 border p-2">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <strong className="text-success">{it.excursion}</strong>
                <div className="small text-muted">
                  {it.fecha
                    ? new Date(it.fecha).toLocaleDateString("es-AR")
                    : ""}{" "}
                  - {it.cantidad_personas} pers.
                </div>
              </div>
              <span className="fw-bold">
                ${it.subtotal?.toLocaleString("es-AR")}
              </span>
            </div>
          </Alert>
        ))
      ) : (
        <p>Cargando detalles...</p>
      )}

      <div className="text-end mb-3">
        <h5>
          Total a transferir:{" "}
          <span className="text-success">
            ${totalGeneral.toLocaleString("es-AR")}
          </span>
        </h5>
      </div>

      {/* === TRANSFERENCIA === */}
      <div className="border rounded p-3 mb-3 bg-light">
        <p className="mb-2">
          Transferí al Alias: <strong>AGENCIATUCUMAN.mp</strong>
        </p>

        <div className="small text-muted mb-2">
          Con subir el comprobante <strong>o</strong> ingresar el número
          alcanza.
        </div>

        <Form.Group className="mt-2">
          <Form.Label className="fw-bold small">
            Comprobante (PDF o imagen) (opcional)
          </Form.Label>

          <Form.Control
            type="file"
            accept=".pdf,image/*"
            onChange={handleComprobanteChange}
            disabled={procesandoPago}
          />

          <div className="mt-2 small text-muted">
            Podés subir PDF/JPG/PNG/WEBP. Máx 8MB.
          </div>

          {comprobanteFile && (
            <Alert variant="light" className="mt-2 mb-0 border">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="fw-bold">{comprobanteFile.name}</div>
                  <div className="small text-muted">
                    {(comprobanteFile.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>

                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => {
                    if (comprobantePreview)
                      URL.revokeObjectURL(comprobantePreview);
                    setComprobanteFile(null);
                    setComprobantePreview(null);
                  }}
                  disabled={procesandoPago}
                >
                  Quitar
                </Button>
              </div>

              {comprobantePreview && (
                <div className="mt-2">
                  <img
                    src={comprobantePreview}
                    alt="Vista previa comprobante"
                    style={{ maxWidth: "100%", borderRadius: 8 }}
                  />
                </div>
              )}
            </Alert>
          )}
        </Form.Group>

        <Form.Group className="mt-3">
          <Form.Label className="fw-bold small">
            Nro. de comprobante (opcional)
          </Form.Label>
          <Form.Control
            placeholder="Ingresá el número de comprobante"
            value={referencia}
            onChange={(e) => setReferencia(e.target.value)}
            disabled={procesandoPago}
          />
        </Form.Group>
      </div>

      <Button
        variant="success"
        className="w-100 mb-2"
        onClick={handleConfirmar}
        disabled={procesandoPago || items.length === 0}
      >
        {procesandoPago ? (
          <Spinner as="span" animation="border" size="sm" />
        ) : (
          "Confirmar por transferencia"
        )}
      </Button>

      <hr />

      {/* === MERCADO PAGO === */}
      <Button
        variant="primary"
        className="w-100"
        onClick={handlePagarMercadoPago}
        disabled={procesandoPago || items.length === 0}
      >
        {procesandoPago ? (
          <Spinner as="span" animation="border" size="sm" />
        ) : (
          "Pagar con Mercado Pago"
        )}
      </Button>
    </Card>
  );
}
