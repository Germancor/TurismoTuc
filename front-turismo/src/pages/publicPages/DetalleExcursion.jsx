import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Container, Row, Col, Spinner, Alert } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import useTuristaStore from "../../store/useTuristaStore";

import ExcursionHero from "../../Components/publicComponents/DetalleExcursion/ExcursionHero";
import ExcursionTabs from "../../Components/publicComponents/DetalleExcursion/ExcursionTabs";
import ExcursionMap from "../../Components/publicComponents/DetalleExcursion/ExcursionMap";
import ExcursionGallery from "../../Components/publicComponents/DetalleExcursion/ExcursionGallery";
import ExcursionSidebar from "../../Components/publicComponents/DetalleExcursion/ExcursionSidebar";
import ReseñasCarousel from "../../Components/publicComponents/DetalleExcursion/ReseñasCarrousel";

import "../../styles/publicComponents/detalleex.css";

export default function DetalleExcursion() {
  const { id } = useParams();
  const [excursion, setExcursion] = useState(null);
  const [fechas, setFechas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { turista } = useTuristaStore();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchExcursion = async () => {
      try {
        // Datos principales
        const resExc = await axios.get(`${import.meta.env.VITE_API_URL}/excursiones/${id}`);
        const excursionData = resExc.data;

        // Imágenes
        const resImgs = await axios.get(`${import.meta.env.VITE_API_URL}/excursiones/${id}/multimedia`);
        excursionData.imagenes = resImgs.data || [];

        // Fechas disponibles
        const resFechas = await axios.get(`${import.meta.env.VITE_API_URL}/excursiones/${id}/fechas`);
        setFechas(resFechas.data || []);

        setExcursion(excursionData);
      } catch (err) {
        console.error("Error al obtener excursión:", err);
        setError("No se pudo cargar la información de la excursión.");
      } finally {
        setLoading(false);
      }
    };

    fetchExcursion();
  }, [id]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner animation="border" variant="success" />
        <div className="text-success mt-2">{t("excursionDetalle.loading")}</div> 
      </div>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger" className="text-center">
          {error}
        </Alert>
      </Container>
    );
  }

  if (!excursion) {
    return (
      <Container className="py-5 text-center">
        <Alert variant="warning">{t("excursionDetalle.notFound")}</Alert>
      </Container>
    );
  }

  return (
    <div className="detalle-excursion-page bg-light py-4">
      <Container>
        <ExcursionHero excursion={excursion} imagenes={excursion.imagenes} />
        <Row className="mt-4">
          <Col xs={12} md={8} lg={9} className="mb-4">
            <ExcursionTabs excursion={excursion} />
            <ExcursionMap excursion={excursion} />
            <ExcursionGallery excursion={excursion} />
            <ReseñasCarousel id_excursion={id} />
          </Col>

          <Col xs={12} md={4} lg={3}>
            {/*  ahora le pasamos las fechas también */}
            <ExcursionSidebar excursion={excursion} fechas={fechas} turista={turista} />
          </Col>
        </Row>
      </Container>
    </div>
  );
}
