import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'; // <--- IMPORTAR useAuth

const API_URL = 'http://localhost:5000/api/auth';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { setToken, setCurrentUser } = useAuth(); // <--- OBTENER setToken y setCurrentUser DEL CONTEXTO

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Por favor, ingrese email y contraseña.');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/login`, {
        email: email,
        password: password,
      });

      setLoading(false);
      if (response.data.token) {
        // Actualizar el token y el usuario a través del contexto
        setToken(response.data.token); 
        setCurrentUser({
            id: response.data._id,
            nombre: response.data.nombre,
            email: response.data.email,
            rol: response.data.rol,
            fotoPerfilUrl: response.data.fotoPerfilUrl,
            token: response.data.token
        });

        // Redirigir
        if (response.data.rol === 'admin') {
            navigate('/admin-dashboard');
        } else if (response.data.rol === 'mentor') {
            navigate('/mentor-dashboard');
        } else if (response.data.rol === 'estudiante') {
            navigate('/student-dashboard');
        } else {
            navigate('/');
        }
      } else {
        setError('Respuesta inesperada del servidor.');
      }
    } catch (err) {
      setLoading(false);
      if (err.response) {
        setError(err.response.data.message || 'Error al iniciar sesión.');
      } else if (err.request) {
        setError('No se pudo conectar con el servidor.');
      } else {
        setError('Ocurrió un error inesperado.');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* ...el JSX del formulario sigue igual... */}
      <div>
        <label htmlFor="email">Email:</label>
        <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div>
        <label htmlFor="password">Contraseña:</label>
        <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? 'Ingresando...' : 'Ingresar'}
      </button>
    </form>
  );
}

export default LoginForm;