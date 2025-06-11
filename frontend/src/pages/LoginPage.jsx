import React from 'react';
import { Link } from 'react-router-dom'; // <--- IMPORTAR Link
import LoginForm from '../components/auth/LoginForm';

function LoginPage() {
  return (
    <div className="detail-page-container"> {/* Reutilizar estilo si quieres centrarlo */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
         {/* <img src="/TexMentor-logo.png" alt="TexMentors Logo" style={{ maxWidth: '150px', marginBottom: '10px' }}/>*/}
        <h1>Iniciar Sesión</h1>
        <p>Bienvenido de vuelta a TexMentors.</p>
      </div>
      
      <LoginForm />

      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <p>
          ¿No tienes una cuenta? <Link to="/register">Regístrate aquí como estudiante</Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;