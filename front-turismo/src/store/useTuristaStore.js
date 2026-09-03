import { create } from "zustand";

const useTuristaStore = create((set, get) => ({
  turista: null,
  token: null,
  hydrated: false, //  indica si ya se leyó el localStorage

  //  Inicializa la sesión guardada (solo una vez)
  initSession: async () => {
    if (get().hydrated) return;

    try {
      const turistaData = localStorage.getItem("turista");
      const tokenData = localStorage.getItem("tokenTurista");

      if (turistaData && tokenData) {
        const parsedTurista = JSON.parse(turistaData);
        //  Normaliza el id si viene como id_turista
        const normalizedTurista = {
          ...parsedTurista,
          id: parsedTurista.id ?? parsedTurista.id_turista,
        };
        set({ turista: normalizedTurista, token: tokenData });
        console.log(" Sesión cargada desde localStorage:", normalizedTurista);
      } else {
        console.warn(" No se encontró sesión guardada.");
      }
    } catch (error) {
      console.error(" Error al cargar sesión desde localStorage:", error);
    } finally {
      set({ hydrated: true });
    }
  },

  //  Guardar sesión luego del login o update
  setTurista: (turista, token = get().token) => {
    try {
      //  Asegura consistencia en la clave del ID
      const normalizedTurista = {
        ...turista,
        id: turista.id ?? turista.id_turista,
      };
      localStorage.setItem("turista", JSON.stringify(normalizedTurista));
      localStorage.setItem("tokenTurista", token);
      set({ turista: normalizedTurista, token });
      console.log(" Sesión guardada en localStorage:", normalizedTurista);
    } catch (error) {
      console.error(" Error al guardar sesión:", error);
    }
  },

  //  Cerrar sesión completamente
  clearTurista: () => {
    try {
      localStorage.removeItem("turista");
      localStorage.removeItem("tokenTurista");
      set({ turista: null, token: null });
      console.log(" Sesión cerrada, turista limpiado.");
    } catch (error) {
      console.error(" Error al limpiar sesión:", error);
    }
  },
}));

export default useTuristaStore;
