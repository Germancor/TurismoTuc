export default function SearchResults({ resultados }) {
    if (!resultados || resultados.length === 0) return null;
  
    return (
      <section className="container py-5">
        <h4 className="fw-bold mb-4">Resultados de búsqueda</h4>
        <div className="row">
          {resultados.map((exc) => (
            <div key={exc.id_excursion} className="col-md-4 mb-4">
              <div className="card h-100 shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">{exc.titulo}</h5>
                  <p className="card-text">{exc.descripcion?.slice(0, 100)}...</p>
                  <p className="text-success fw-bold">${exc.precio_base}</p>
                  <button className="btn btn-outline-success btn-sm">
                    Ver más
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }