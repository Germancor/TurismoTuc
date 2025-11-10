export default function PromoSection() {
    return (
      <section className="bg-light py-5">
        <div className="container text-center">
          <h4 className="fw-bold mb-3">¿Por qué elegirnos?</h4>
          <p className="lead mb-4">Reservá sin crear cuenta, accedé a experiencias únicas y recibí atención personalizada.</p>
          <div className="row justify-content-center">
            <div className="col-md-4 mb-3">
              <div className="p-3 border rounded shadow-sm">
                <i className="bi bi-person-check fs-2 text-success mb-2"></i>
                <h6 className="fw-bold">Sin registro</h6>
                <p className="text-muted">Reservá en segundos sin crear usuario.</p>
              </div>
            </div>
            <div className="col-md-4 mb-3">
              <div className="p-3 border rounded shadow-sm">
                <i className="bi bi-compass fs-2 text-success mb-2"></i>
                <h6 className="fw-bold">Experiencias únicas</h6>
                <p className="text-muted">Excursiones seleccionadas por expertos locales.</p>
              </div>
            </div>
            <div className="col-md-4 mb-3">
              <div className="p-3 border rounded shadow-sm">
                <i className="bi bi-whatsapp fs-2 text-success mb-2"></i>
                <h6 className="fw-bold">Atención directa</h6>
                <p className="text-muted">Consultá por WhatsApp sin intermediarios.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }