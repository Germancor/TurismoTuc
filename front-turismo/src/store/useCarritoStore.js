// src/store/useCarritoStore.js
import { create } from "zustand";
import axios from "axios";
import useTuristaStore from "./useTuristaStore";

const useCarritoStore = create((set, get) => ({
  carrito: null,
  items: [],

  // =============================
  // Obtener carrito del turista
  // =============================
  fetchCarrito: async () => {
    const { turista, initSession } = useTuristaStore.getState();

    if (!turista) {
      await initSession();
    }

    const turistaActual = useTuristaStore.getState().turista;
    const idTurista =
      turistaActual?.id_turista ||
      turistaActual?.id ||
      turistaActual?.id_usuario;

    if (!idTurista) {
      console.warn("⚠️ No hay turista logueado o falta id_turista");
      return;
    }

    try {
      const resCarrito = await axios.get(
        `http://localhost:8000/api/carrito/${idTurista}`
      );
      const carrito = resCarrito.data;

      const resItems = await axios.get(
        `http://localhost:8000/api/carrito/${carrito.id_carrito}/items`
      );

      set({ carrito, items: resItems.data || [] });
    } catch (err) {
      console.error("Error al obtener carrito:", err);
    }
  },

  // =============================
  // Agregar item
  // =============================
  addItem: async (id_fecha, cantidad_personas) => {
    const { turista } = useTuristaStore.getState();
    const { fetchCarrito } = get();

    if (!turista) {
      alert("Debes iniciar sesión para agregar al carrito");
      return;
    }

    const idTurista =
      turista.id_turista || turista.id || turista.id_usuario;

    try {
      await axios.post("http://localhost:8000/api/carrito/item", {
        id_turista: idTurista,
        id_fecha,
        cantidad_personas,
      });

      await fetchCarrito();
      alert("✅ Excursión agregada al carrito");
    } catch (err) {
      console.error("Error al agregar item:", err?.response?.data || err);
      const msg =
        err?.response?.data?.message ||
        "No se pudo agregar al carrito.";
      alert(msg);
    }
  },

  // =============================
  // Eliminar item
  // =============================
  removeItem: async (id_item) => {
    try {
      await axios.delete(`http://localhost:8000/api/carrito/item/${id_item}`);
      set((state) => ({
        items: state.items.filter((i) => i.id_item !== id_item),
      }));
    } catch (err) {
      console.error("Error al eliminar item:", err);
    }
  },

  // =============================
  // Actualizar cantidad (usa el back nuevo)
  // =============================
  updateCantidad: async (id_item, nuevaCantidad) => {
    try {
      const res = await axios.put(
        `http://localhost:8000/api/carrito/item/${id_item}`,
        { cantidad_personas: nuevaCantidad }
      );

      const {
        cantidad_personas,
        subtotal,
        precio_unitario,
      } = res.data;

      set((state) => ({
        items: state.items.map((i) =>
          i.id_item === id_item
            ? {
                ...i,
                cantidad_personas,
                subtotal,
                precio_unitario: precio_unitario ?? i.precio_unitario,
              }
            : i
        ),
      }));
    } catch (err) {
      console.error("Error al actualizar cantidad:", err);
      alert(
        err?.response?.data?.message ||
          "Ocurrió un error al actualizar la cantidad."
      );
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
  clearCarrito: () => set({ carrito: null, items: [] }),
}));

export default useCarritoStore;
