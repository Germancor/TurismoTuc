import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainUsuarios from '../../../Components/Usuarios/MainUsuarios.jsx';
import CreateUsuario from '../../../Components/Usuarios/CreateUsuarios.jsx';
import EditUsuarios from '../../../Components/Usuarios/EditUsuarios.jsx';
import ViewUsuarios from '../../../Components/Usuarios/ViewUsuarios.jsx';

const ExcursionesCRUD = () => {
  return (
    <main>
      <br />
      <Routes>
        <Route path="/" element={<MainUsuarios />} />
        <Route path="create" element={<CreateUsuario />} />
        <Route path="edit/:id" element={<EditUsuarios />} />
        <Route path="view/:id" element={<ViewUsuarios />} />
      </Routes>
    </main>
  );
};

export default ExcursionesCRUD;