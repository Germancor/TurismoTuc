// Components/publicComponents/Catalogo/SortBar.jsx
import React from "react";

export default function SortBar({ onSortChange }) {
  return (
    <div className="sort-bar">
      <select
        className="form-select"
        onChange={(e) => onSortChange(e.target.value)}
        defaultValue=""
      >
        <option value="" disabled>
          Ordenar por...
        </option>
        <option value="precio_asc">Precio: menor a mayor</option>
        <option value="precio_desc">Precio: mayor a menor</option>
        <option value="fecha_nueva">Más recientes</option>
        <option value="fecha_vieja">Más antiguas</option>
      </select>
    </div>
  );
}
