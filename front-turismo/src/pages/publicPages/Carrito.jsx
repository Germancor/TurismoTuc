// src/pages/publicPages/Carrito.jsx
import { useEffect } from "react";
import { Container, Row, Col, Alert } from "react-bootstrap";
import useCarritoStore from "../../store/useCarritoStore";
import CarritoItem from "../../Components/publicComponents/Carrito/CarritoItem";
import CarritoResumen from "../../Components/publicComponents/Carrito/CarritoResumen";

export default function Carrito() {
  const { items, fetchCarrito } = useCarritoStore();

  useEffect(() => {
    fetchCarrito();
  }, [fetchCarrito]);

  const subtotal = items.reduce((acc, item) => acc + Number(item.subtotal || 0), 0);
  const impuestos = 0;
  const total = subtotal + impuestos;

  return (
    <Container className="py-5">
      <h3 className="fw-bold text-teal mb-4">Tu carrito</h3>

      {items.length === 0 ? (
        <Alert variant="info" className="text-center">
          Tu carrito está vacío. ¡Explorá las excursiones y agregá las que te interesen!
        </Alert>
      ) : (
        <Row>
          <Col md={8}>
            {items.map((item) => (
              <CarritoItem key={item.id_item} item={item} />
            ))}
          </Col>

          <Col md={4}>
            <CarritoResumen subtotal={subtotal} impuestos={impuestos} total={total} />
          </Col>
        </Row>
      )}
    </Container>
  );
}
