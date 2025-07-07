import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import authService from '../services/authService'; // <-- USA EL SERVICIO
import { toast } from 'react-toastify';

function ResetPasswordPage() {
    const { token } = useParams(); // Obtener el token de la URL
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast.error('Las contraseñas no coinciden.');
            return;
        }
        if (password.length < 6) {
            toast.error('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        setLoading(true);
        try {
            const response = await authService.resetPassword(token, password);
            toast.success(response.message || '¡Contraseña actualizada! Ya puedes iniciar sesión.');
            setLoading(false);
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (error) {
            setLoading(false);
            toast.error(error.message || 'Error al resetear la contraseña.');
        }
    };

    return (
        <div className="form-card" style={{ maxWidth: '500px' }}> {/* Estilo de tarjeta */}
            <h2>Establecer Nueva Contraseña</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="password">Nueva Contraseña:</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="confirmPassword">Confirmar Nueva Contraseña:</label>
                    <input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" disabled={loading} style={{ width: '100%', marginTop: '10px' }}>
                    {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
                </button>
            </form>
            <div style={{ textAlign: 'center', marginTop: '15px' }}>
                <Link to="/login">Volver a Iniciar Sesión</Link>
            </div>
        </div>
    );
}

export default ResetPasswordPage;