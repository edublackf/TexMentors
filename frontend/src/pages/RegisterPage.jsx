import React from 'react';
import { Link } from 'react-router-dom';
import RegisterForm from '../components/auth/RegisterForm'; // Importamos el formulario

function RegisterPage() {
    return (
        <div className="detail-page-container"> {/* Reutilizamos el estilo de contenedor si te gusta */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                {/* Puedes poner un logo o imagen aquí si quieres 
                <img src="/TexMentor-logo.png" alt="TexMentors Logo" style={{ maxWidth: '150px', marginBottom: '10px' }}/> {/* Ejemplo de logo */}
                <h1>Crear Cuenta de Estudiante</h1>
                <p>Únete a TexMentors para encontrar la ayuda que necesitas.</p>
            </div>
            
            <RegisterForm />

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <p>
                    ¿Ya tienes una cuenta? <Link to="/login">Inicia Sesión aquí</Link>
                </p>
            </div>
        </div>
    );
}

export default RegisterPage;