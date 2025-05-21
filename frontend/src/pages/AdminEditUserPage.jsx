import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import userService from '../services/userService';
import UserForm from '../components/ui/UserForm'; // Importamos el formulario

function AdminEditUserPage() {
    const { userId } = useParams(); // Obtiene el :userId de la URL
    const navigate = useNavigate();

    const [user, setUser] = useState(null); // Datos del usuario a editar
    const [loading, setLoading] = useState(true);
    const [formLoading, setFormLoading] = useState(false); // Loading para el submit del form
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const fetchUserData = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const userData = await userService.getUserById(userId);
            setUser(userData);
        } catch (err) {
            setError(err.message || `Error al cargar datos del usuario ${userId}.`);
            setUser(null); // Asegurarse de que no haya datos viejos
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchUserData();
    }, [fetchUserData]);

    const handleFormSubmit = async (formData) => {
        try {
            setFormLoading(true);
            setError('');
            setSuccessMessage('');
            const response = await userService.updateUser(userId, formData);
            setSuccessMessage(response.message || 'Usuario actualizado exitosamente.');
            // Opcional: actualizar el estado 'user' localmente con response.user
            // setUser(response.user); 
            // O redirigir después de un breve delay o al hacer clic en un botón "Volver"
            setTimeout(() => {
                navigate('/admin-dashboard/users'); // Volver a la lista de usuarios
            }, 1500); // Delay para que el mensaje de éxito sea visible
        } catch (err) {
            setError(err.message || 'Error al actualizar el usuario.');
        } finally {
            setFormLoading(false);
        }
    };

    if (loading) {
        return <p>Cargando datos del usuario...</p>;
    }

    if (error && !user) { // Si hubo error al cargar y no hay datos de usuario
        return (
            <div>
                <p style={{ color: 'red' }}>Error: {error}</p>
                <Link to="/admin-dashboard/users">Volver a la lista de usuarios</Link>
            </div>
        );
    }
    
    if (!user) { // Si no está cargando y no hay usuario (después de un error o ID inválido manejado por el servicio)
        return (
            <div>
                <p>Usuario no encontrado.</p>
                <Link to="/admin-dashboard/users">Volver a la lista de usuarios</Link>
            </div>
        );
    }

    return (
        <div>
            <h2>Editar Usuario: {user.nombre} {user.apellido}</h2>
            <Link to="/admin-dashboard/users">Volver a la lista de usuarios</Link>
            <hr />
            {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
            
            <UserForm 
                onSubmit={handleFormSubmit}
                initialData={user}
                isEditMode={true}
                loading={formLoading}
                error={error && !successMessage ? error : null} // Mostrar error del form solo si no hay mensaje de éxito
            />
        </div>
    );
}

export default AdminEditUserPage;