import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainTuristas from '../../../Components/Turistas/MainTuristas.jsx';
import ViewTurista from '../../../Components/Turistas/ViewTuristas.jsx';
import EditTurista from '../../../Components/Turistas/EditTuristas.jsx';
import CreateTurista from '../../../Components/Turistas/CreateTuristas.jsx';

const ExcursionesCRUD = () => {
  return (
    <main>
      <br />
      <Routes>
        <Route path="/" element={<MainTuristas />} />
        <Route path="view/:id" element={<ViewTurista />} />
        <Route path="edit/:id" element={<EditTurista />} />
        <Route path="create" element={< CreateTurista/>} />
      </Routes>
    </main>
  );
};

export default ExcursionesCRUD;