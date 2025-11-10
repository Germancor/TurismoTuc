import { create } from "zustand";

const useTuristaStore = create((set, get) => ({
  turista: null,
  token: null,
  hydrated: false, // 🔹 indica si ya se leyó el localStorage

  // 🧠 Inicializa la sesión guardada (solo una vez)
  initSession: async () => {
    // si ya está hidratado, no hace nada
    if (get().hydrated) return;

    try {
      const turistaData = localStorage.getItem("turista");
      const tokenData = localStorage.getItem("tokenTurista");

      if (turistaData && tokenData) {
        const parsedTurista = JSON.parse(turistaData);
        set({ turista: parsedTurista, token: tokenData });
        console.log("✅ Sesión cargada desde localStorage:", parsedTurista);
      } else {
        console.warn("⚠️ No se encontró sesión guardada.");
      }
    } catch (error) {
      console.error("💥 Error al cargar sesión desde localStorage:", error);
    } finally {
      // siempre marcar que ya se terminó el intento de carga
      set({ hydrated: true });
    }
  },

  // 🟢 Guardar sesión luego del login
  setTurista: (turista, token) => {
    try {
      localStorage.setItem("turista", JSON.stringify(turista));
      localStorage.setItem("tokenTurista", token);
      set({ turista, token });
      console.log("🟢 Sesión guardada en localStorage:", turista);
    } catch (error) {
      console.error("💥 Error al guardar sesión:", error);
    }
  },

  // 🔴 Cerrar sesión completamente
  clearTurista: () => {
    try {
      localStorage.removeItem("turista");
      localStorage.removeItem("tokenTurista");
      set({ turista: null, token: null });
      console.log("🔴 Sesión cerrada, turista limpiado.");
    } catch (error) {
      console.error("💥 Error al limpiar sesión:", error);
    }
  },
}));

export default useTuristaStore;
