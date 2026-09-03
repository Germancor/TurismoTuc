import { create } from "zustand";
import axios from "axios";
import Swal from "sweetalert2";
import useTuristaStore from "./useTuristaStore";

const useCarritoStore = create((set, get) => ({
  carrito: null,
  items: [],

  // =============================
  // Obtener carrito del turista
  // =============================
  fetchCarrito: async () => {
    const { turista, initSession } = useTuristaStore.getState();

    if (!turista) await initSession();

    const turistaActual = useTuristaStore.getState().turista;
    const idTurista =
      turistaActual?.id_turista ||
      turistaActual?.id ||
      turistaActual?.id_usuario;

    if (!idTurista) {
      console.warn(" No hay turista logueado o falta id_turista");
      return;
    }

    try {
      const resCarrito = await axios.get(
        `${import.meta.env.VITE_API_URL}/carrito/${idTurista}`,
      );

      const carrito = resCarrito.data;

      // NUEVO: defender cuando no hay carrito o no tiene id_carrito
      if (!carrito || !carrito.id_carrito) {
        console.warn(
          " No se encontró carrito para este turista. Usando carrito vacío.",
        );
        set({ carrito: null, items: [] });
        localStorage.removeItem("carrito");
        localStorage.removeItem("items_carrito");
        return {
          carrito: null,
          items: [],
        };
      }

      const resItems = await axios.get(
        `${import.meta.env.VITE_API_URL}/carrito/${carrito.id_carrito}/items`,
      );

      const data = resItems.data || [];
      set({ carrito, items: data });

      return {
        carrito,
        items: data,
      };
      // 💾 Guardar en localStorage
      // localStorage.setItem("carrito", JSON.stringify(carrito));
      // localStorage.setItem("items_carrito", JSON.stringify(data));
    } catch (err) {
      console.error("Error al obtener carrito:", err);
    }
  },

  // =============================
  // Agregar item
  // =============================
  addItem: async (id_fecha, cantidad_personas) => {
    sessionStorage.removeItem("pago_exitoso");

    const { turista } = useTuristaStore.getState();
    const { fetchCarrito } = get();

    if (!turista) {
      Swal.fire({
        icon: "warning",
        title: "Debes iniciar sesión para agregar al carrito",
      });
      return;
    }

    const idTurista = turista.id_turista || turista.id || turista.id_usuario;

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/carrito/item`, {
        id_turista: idTurista,
        id_fecha,
        cantidad_personas,
      });

      await fetchCarrito();

      Swal.fire({
        icon: "success",
        title: "Excursión agregada al carrito",
        showConfirmButton: false,
        timer: 2000,
      });
    } catch (err) {
      console.error("Error al agregar item:", err?.response?.data || err);
      const msg =
        err?.response?.data?.message || "No se pudo agregar al carrito.";
      Swal.fire({
        icon: "error",
        title: "Error",
        text: msg,
      });
    }
  },

  // =============================
  // Eliminar item
  // =============================
  removeItem: async (id_item) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/carrito/item/${id_item}`,
      );
      set((state) => ({
        items: state.items.filter((i) => i.id_item !== id_item),
      }));
      // localStorage.setItem(
      //   "items_carrito",
      //   JSON.stringify(get().items.filter((i) => i.id_item !== id_item)),
      // );
    } catch (err) {
      console.error("Error al eliminar item:", err);
      Swal.fire({
        icon: "error",
        title: "Error al eliminar",
        text: "No se pudo eliminar el item del carrito.",
      });
    }
  },

  // =============================
  // Actualizar cantidad
  // =============================
  updateCantidad: async (id_item, nuevaCantidad) => {
    if (!Number.isFinite(nuevaCantidad) || nuevaCantidad <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Cantidad inválida",
        text: "La cantidad debe ser mayor a cero.",
      });
      return;
    }

    try {
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/carrito/item/${id_item}`,
        { cantidad_personas: nuevaCantidad },
      );

      const { nuevaCantidad: cant, nuevoSubtotal } = res.data;

      const nuevosItems = get().items.map((i) =>
        i.id_item === id_item
          ? { ...i, cantidad_personas: cant, subtotal: nuevoSubtotal }
          : i,
      );

      set({ items: nuevosItems });
      // localStorage.setItem("items_carrito", JSON.stringify(nuevosItems));
    } catch (err) {
      console.error("Error al actualizar cantidad:", err);
      Swal.fire({
        icon: "error",
        title: "Error al actualizar",
        text:
          err?.response?.data?.message ||
          "Ocurrió un error al actualizar la cantidad.",
      });
    }
  },

  // =============================
  // Calcular total
  // =============================
  calcularTotal: () => {
    const items = get().items;
    return items.reduce((acc, i) => acc + Number(i.subtotal || 0), 0);
  },

  // =============================
  // Vaciar carrito
  // =============================
  clearCarrito: () => {
    set({ carrito: null, items: [] });
    // localStorage.removeItem("carrito");
    // localStorage.removeItem("items_carrito");
  },
}));

export default useCarritoStore;
