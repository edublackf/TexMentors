import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import authService from '../services/authService'; 
import { toast } from 'react-toastify';

function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(''); 

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setLoading(true);

        try {
            const response = await authService.forgotPassword(email);
            // Por seguridad, siempre mostramos un mensaje genérico para no revelar si un email existe o no.
            setMessage(response.message || 'Si tu correo electrónico se encuentra en nuestra base de datos, recibirás un enlace para restablecer tu contraseña.');
            toast.info('Revisa tu bandeja de entrada (y la carpeta de spam).');
            setEmail(''); // Limpiar el campo
        } catch (err) {

            const errorMessage = err.message || 'Ocurrió un error al procesar tu solicitud.';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-card" style={{ maxWidth: '500px' }}>
            <h2>¿Olvidaste tu Contraseña?</h2>
            <p>No te preocupes. Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.</p>

            {!message ? (
                <form onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="email">Correo Electrónico:</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="tu.correo@example.com"
                        />
                    </div>
                    
                    <button type="submit" disabled={loading} style={{ width: '100%', marginTop: '10px' }}>
                        {loading ? 'Enviando...' : 'Enviar Enlace de Reseteo'}
                    </button>
                </form>
            ) : (
                <div style={{ padding: '20px', backgroundColor: '#eaf4fc', borderRadius: '5px', textAlign: 'center' }}>
                    <p>{message}</p>
                </div>
            )}

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
                <Link to="/login">Volver a Iniciar Sesión</Link>
            </div>
        </div>
    );
}

export default ForgotPasswordPage;