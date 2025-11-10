// src/hooks/useDebounce.js
import { useEffect, useState } from "react";

export const useDebounce = (value, delay = 5000) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Limpia el timeout si cambia el valor o se desmonta el componente
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};
