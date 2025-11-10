import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainFecha from '../../../Components/FechaExcursion/MainFecha.jsx';
import CreateFecha from '../../../Components/FechaExcursion/CreateFecha.jsx';
import EditFecha from '../../../Components/FechaExcursion/EditFecha.jsx';


const FechasCRUD = () => {
  return (
    <main>
      <br />
      <Routes>
        <Route path="/" element={<MainFecha />} />
        <Route path="create" element={<CreateFecha />} />
        <Route path="edit/:id" element={<EditFecha />} />
      </Routes>
    </main>
  );
};

export default FechasCRUD;