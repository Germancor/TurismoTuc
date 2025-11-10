import { useEffect, useState } from "react";
import { Container, ProgressBar } from "react-bootstrap";

import CheckoutPago from "../../Components/publicComponents/Checkout/CheckoutPago";
import CheckoutConfirmacion from "../../Components/publicComponents/Checkout/CheckoutConfirmacion";

import useTuristaStore from "../../store/useTuristaStore";

export default function Checkout() {
  const { turista, initSession, hydrated } = useTuristaStore();
  const [pasoActual, setPasoActual] = useState(1);
  const [reservaData, setReservaData] = useState(null);

  // 🧠 Cargar sesión al entrar al checkout
  useEffect(() => {
    initSession();
  }, [initSession]);

  // ⏳ Esperar hidratación
  if (!hydrated) {
    return (
      <Container className="my-5 text-center">
        <div className="spinner-border text-success" role="status"></div>
        <p className="mt-3">Verificando sesión...</p>
      </Container>
    );
  }

  // 🚫 Si no hay sesión activa, bloquear
  if (!turista || (!turista.id && !turista.id_turista)) {
    return (
      <Container className="my-5">
        <h3 className="mb-4">Proceso de pago</h3>
        <div className="alert alert-danger">
          Debes iniciar sesión para continuar.
        </div>
      </Container>
    );
  }

  // 🔄 Cambiar paso
  const avanzarPaso = (data) => {
    if (data) setReservaData(data);
    setPasoActual((prev) => prev + 1);
  };

  const retrocederPaso = () => setPasoActual((prev) => prev - 1);

  return (
    <Container className="my-4">
      <h3 className="mb-4 text-center">💳 Pago de reserva</h3>
      <ProgressBar
        now={(pasoActual / 2) * 100}
        label={`Paso ${pasoActual} de 2`}
        className="mb-4"
      />

      {pasoActual === 1 && (
        <CheckoutPago onNext={avanzarPaso} turista={turista} />
      )}

      {pasoActual === 2 && (
        <CheckoutConfirmacion data={reservaData} onBack={retrocederPaso} />
      )}
    </Container>
  );
}
