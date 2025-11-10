import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainExcursiones from '../../../Components/Excursion/MainExcursion.jsx';
import EditExcursion from '../../../Components/Excursion/EditExcursion.jsx';
import ViewExcursion from '../../../Components/Excursion/ViewExcursion.jsx';
import CreateExcursion from '../../../Components/Excursion/CreateExcursion.jsx';
// import ExcursionesCategoria from '../../components/Excursion/ExcursionesCategoria'; // si lo usás como filtro o vista

const ExcursionesCRUD = () => {
  return (
    <main>
      <br />
      <Routes>
        <Route path="/" element={<MainExcursiones />} />
        <Route path="edit/:id" element={<EditExcursion />} />
        <Route path="view/:id" element={<ViewExcursion />} />
        <Route path="create" element={<CreateExcursion />} /> 
        {/* /* <Route path="categoria/:nombre" element={<ExcursionesCategoria />} /> */}
      </Routes>
    </main>
  );
};

export default ExcursionesCRUD;