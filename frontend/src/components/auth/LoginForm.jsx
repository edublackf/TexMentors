import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'; 

const API_URL = 'http://localhost:5000/api/auth';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { setToken, setCurrentUser } = useAuth(); 

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Por favor, ingrese email y contraseña');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, { 
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
      <div style={{ textAlign: 'right', marginTop: '10px' }}>
                <Link to="/forgot-password">¿Olvidaste tu contraseña?</Link>
            </div>
      </form>
      
    
    
  );
}

export default LoginForm;