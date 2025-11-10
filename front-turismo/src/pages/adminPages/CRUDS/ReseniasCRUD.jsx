import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainResenias from '../../../Components/Reseñas/MainResenias.jsx';
import EditResenia from '../../../Components/Reseñas/EditResenias.jsx';


const ExcursionesCRUD = () => {
  return (
    <main>
      <br />
      <Routes>
        <Route path="/" element={<MainResenias />} />
        <Route path="edit/:id" element={<EditResenia />} />
      </Routes>
    </main>
  );
};

export default ExcursionesCRUD;