import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';


const API_URL = 'http://localhost:5000/api/auth';

function ResetPasswordPage() {
    const { token } = useParams(); // Obtiene el token de la URL
    const navigate = useNavigate();
    const { setToken, setCurrentUser } = useAuth(); 

    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [loading, setLoading] = useState(false);


    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (password !== passwordConfirm) {
            toast.error('Las contraseñas no coinciden.');
            return;
        }
        if (password.length < 6) {
            toast.error('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        try {
            setLoading(true);
            const response = await axios.put(`${API_URL}/reset-password/${token}`, {
                password: password,
                // passwordConfirm: passwordConfirm // El backend no lo necesita, pero se podría enviar
            });

            toast.success(response.data.message || 'Contraseña actualizada exitosamente. Has iniciado sesión.');

            // Loguear al usuario automáticamente con el nuevo token recibido
            if (response.data.token) {
                setToken(response.data.token); // Esto actualizará el contexto
                // Podríamos decodificar el token para setear el currentUser o esperar
                // a que el contexto lo haga al recargar. Por ahora, esto es suficiente.
            }

            // Redirigir al dashboard después de un momento
            setTimeout(() => {
                navigate('/'); // O a la página del dashboard que corresponda
            }, 2000);

        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Error al resetear la contraseña.';
            toast.error(errorMessage);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-card" style={{ maxWidth: '500px' }}> {/* Reutilizando la clase de estilo de formulario */}
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
                        placeholder="Mínimo 6 caracteres"
                    />
                </div>
                <div>
                    <label htmlFor="passwordConfirm">Confirmar Nueva Contraseña:</label>
                    <input
                        type="password"
                        id="passwordConfirm"
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
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