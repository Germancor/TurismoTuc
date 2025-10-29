import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/components/login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    

    try {
      const response = await axios.post("http://localhost:3000/api/usuarios/login", { email, password });

      if (response.data.success) {
        const userData = response.data.user;
        localStorage.setItem("user", JSON.stringify(userData));

        // redirección según rol
        if (userData.rol === "Administrador") {
          navigate("/dashboard-admin");
        } else if (userData.rol === "Guía turístico" || userData.rol === "Personal de ventas") {
          navigate("/dashboard-empleados");
        } else {
          setError("No tiene permisos para acceder al panel.");
        }
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      console.error("Error en el login:", err);
      setError("Email o contraseña incorrectos.");
    }
  };

  return (
    <div className="login-container d-flex align-items-center justify-content-center">
      <form onSubmit={handleSubmit} className="login-card shadow-sm p-4 bg-white rounded">
        <h4 className="text-center text-success fw-bold mb-4">Inicio de sesión</h4>

        {error && <div className="alert alert-danger py-2">{error}</div>}

        <div className="mb-3">
          <label className="form-label fw-semibold">Email</label>
          <input
            type="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label fw-semibold">Contraseña</label>
          <input
            type="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn btn-success w-100">
          Ingresar
        </button>
      </form>
    </div>
  );
}
