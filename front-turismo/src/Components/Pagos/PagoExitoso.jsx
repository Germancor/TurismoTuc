// import { useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import useCarritoStore from "../../store/useCarritoStore";

// export default function PagoExitoso() {
//   const clearCarrito = useCarritoStore((state) => state.clearCarrito);
//   const fetchCarrito = useCarritoStore((state) => state.fetchCarrito);
//   const setCarrito = useCarritoStore((state) => state.setCarrito);
//   const navigate = useNavigate();

//   //const id_turista = sessionStorage.getItem("id_turista");

//   // useEffect(() => {
//   //   const validarCarrito = async () => {
//   //     try {
//   //       const res = await axios.get(
//   //         `${import.meta.env.VITE_API_URL}/carrito/${id_turista}`
//   //       );

//   //       // 👉 Backend devuelve null si NO hay carrito abierto
//   //       if (!res.data) {
//   //         clearCarrito();
//   //       } else {
//   //         setCarrito(res.data); // por si webhook todavía no cerró
//   //       }
//   //     } catch (error) {
//   //       console.error("Error validando carrito post-pago", error);
//   //     }
//   //   };

//   //   validarCarrito();
//   //   sessionStorage.setItem("pago_exitoso", "true");
//   // }, [clearCarrito, setCarrito, id_turista]);
//   useEffect(() => {
//     const syncCarrito = async () => {
//       clearCarrito(); // Limpiar estado local primero
//       try {
//         await fetchCarrito(); // Traer estado real desde backend
//       } catch (err) {
//         console.error("Error sincronizando carrito post-pago", err);
//       }
//       sessionStorage.setItem("pago_exitoso", "true");
//     };

//     syncCarrito();
//   }, [clearCarrito, fetchCarrito]);

//   return (
//     <div className="container text-center mt-5">
//       <h2>Pago realizado con éxito</h2>
//       <p>Tu reserva fue registrada correctamente.</p>

//       <button
//         className="btn btn-success mt-3"
//         onClick={() => navigate("/perfil-turista")}
//       >
//         Ir a mi perfil
//       </button>
//     </div>
//   );
// }


import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useCarritoStore from "../../store/useCarritoStore";

export default function PagoExitoso() {
  const clearCarrito = useCarritoStore((state) => state.clearCarrito);
  const fetchCarrito = useCarritoStore((state) => state.fetchCarrito);

  const navigate = useNavigate();

  const [verificando, setVerificando] = useState(true);
  const [mensaje, setMensaje] = useState(
    "Estamos confirmando tu reserva..."
  );

  useEffect(() => {
    let cancelado = false;

    const esperarConfirmacion = async () => {
      clearCarrito();

      // Intentar durante aproximadamente 15 segundos
      for (let intento = 1; intento <= 15; intento++) {
        if (cancelado) return;

        try {
          const resultado = await fetchCarrito();

          console.log(
            `🔄 Verificación post-pago ${intento}/15`,
            resultado
          );

          // Si ya no existe carrito abierto,
          // significa que el webhook probablemente
          // ya lo cerró.
          if (!resultado?.carrito) {
            console.log("✅ Carrito cerrado por el webhook");

            setMensaje("¡Reserva confirmada correctamente!");
            setVerificando(false);

            sessionStorage.setItem("pago_exitoso", "true");

            return;
          }

          setMensaje(
            "Estamos confirmando tu pago y generando la reserva..."
          );
        } catch (error) {
          console.error(
            "Error verificando carrito post-pago:",
            error
          );
        }

        await new Promise((resolve) =>
          setTimeout(resolve, 1000)
        );
      }

      // Si después de 15 segundos todavía existe,
      // no asumimos que el pago falló.
      setMensaje(
        "El pago fue realizado. La reserva puede tardar unos segundos en aparecer."
      );

      setVerificando(false);
      sessionStorage.setItem("pago_exitoso", "true");
    };

    esperarConfirmacion();

    return () => {
      cancelado = true;
    };
  }, [clearCarrito, fetchCarrito]);

  return (
    <div className="container text-center mt-5">
      <h2>Pago realizado con éxito</h2>

      {verificando ? (
        <>
          <div className="spinner-border text-success mt-3" />
          <p className="mt-3">
            {mensaje}
          </p>
        </>
      ) : (
        <>
          <p className="mt-3">
            {mensaje}
          </p>

          <button
            className="btn btn-success mt-3"
            onClick={() => navigate("/perfil-turista")}
          >
            Ir a mi perfil
          </button>
        </>
      )}
    </div>
  );
}
