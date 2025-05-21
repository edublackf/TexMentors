import React, { useState, useEffect, useCallback } from 'react'; // Añadimos useCallback
import userService from '../services/userService';
import { Link } from 'react-router-dom'; // Lo usaremos cuando implementemos Editar

function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionMessage, setActionMessage] = useState(''); // Para mensajes de éxito/error de acciones

    // Función para cargar usuarios, la hacemos useCallback para poder usarla en dependencias de useEffect
    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            setActionMessage(''); // Limpiar mensajes de acciones previas
            const data = await userService.getAllUsers();
            setUsers(data);
        } catch (err) {
            setError(err.message || 'Error al cargar usuarios. Asegúrate de estar logueado como administrador.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []); // useCallback con array de dependencias vacío

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]); // Ejecutar fetchUsers cuando el componente se monta o la función fetchUsers cambia (no debería cambiar)

    const handleDeleteUser = async (userId, userName) => {
        // Mostrar confirmación
        if (window.confirm(`¿Estás seguro de que quieres eliminar (lógicamente) al usuario "${userName}"?`)) {
            try {
                setLoading(true); // Podríamos tener un loading específico para la acción
                setError('');
                setActionMessage('');
                const response = await userService.deleteUser(userId);
                setActionMessage(response.message || 'Usuario eliminado exitosamente.');
                // Volver a cargar la lista de usuarios para reflejar el cambio
                // O, alternativamente, actualizar el estado local del usuario:
                // setUsers(prevUsers => 
                //     prevUsers.map(user => 
                //         user._id === userId ? { ...user, isDeleted: true, deletedAt: new Date().toISOString() } : user
                //     )
                // );
                // Por simplicidad y consistencia, recargar la lista es más robusto:
                await fetchUsers(); 
            } catch (err) {
                const errorMessage = err.message || 'Error al eliminar el usuario.';
                setError(errorMessage);
                setActionMessage(''); // Limpiar mensaje de éxito si lo hubo antes
                console.error(err);
            } finally {
                setLoading(false); // Desactivar loading general
            }
        }
    };

    if (loading && users.length === 0) { // Mostrar "Cargando usuarios..." solo si no hay usuarios cargados aún
        return <p>Cargando usuarios...</p>;
    }

    if (error && users.length === 0) { // Mostrar error solo si no se pudieron cargar usuarios
        return <p style={{ color: 'red' }}>Error: {error}</p>;
    }

    return (
        <div>
            <h2>Gestión de Usuarios</h2>
            {actionMessage && <p style={{ color: 'green' }}>{actionMessage}</p>}
            {error && !actionMessage && <p style={{ color: 'red' }}>Error en acción: {error}</p>} {/* Mostrar error de acción si no hay mensaje de éxito */}
            
            {/* TODO: Botón para Crear Nuevo Usuario */}
            
            {loading && <p>Actualizando lista...</p>} {/* Mensaje de loading para recarga */}

            {users.length === 0 && !loading ? (
                <p>No hay usuarios registrados o activos.</p>
            ) : (
                <table border="1" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Apellido</th>
                            <th>Email</th>
                            <th>Rol</th>
                            <th>Carrera</th>
                            <th>Ciclo</th>
                            <th>Verificado</th>
                            <th>Estado</th> {/* Cambiado de "Eliminado" a "Estado" */}
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user._id} style={{ backgroundColor: user.isDeleted ? '#ffe0e0' : 'transparent' }}>
                                <td>{user.nombre}</td>
                                <td>{user.apellido}</td>
                                <td>{user.email}</td>
                                <td>{user.rol}</td>
                                <td>{user.carrera || '-'}</td>
                                <td>{user.cicloActual || '-'}</td>
                                <td>{user.isVerified ? 'Sí' : 'No'}</td>
                                <td>{user.isDeleted ? 'Eliminado' : 'Activo'}</td> {/* Mostrar "Activo" o "Eliminado" */}
                                <td>
                                    <Link to={`/admin-dashboard/users/${user._id}/edit`}>
                                        <button disabled={user.isDeleted}>
                                            Editar
                                        </button>
                                    </Link>
                                    <button 
                                        onClick={() => handleDeleteUser(user._id, `${user.nombre} ${user.apellido}`)} 
                                        disabled={user.isDeleted || user.rol === 'admin'} // Deshabilitar si ya está eliminado O si es admin
                                        style={{ 
                                            marginLeft: '5px', 
                                            backgroundColor: (user.isDeleted || user.rol === 'admin') ? 'grey' : 'tomato', // Color diferente para deshabilitado
                                            color: 'white',
                                            cursor: (user.isDeleted || user.rol === 'admin') ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        {user.isDeleted ? 'Ya Eliminado' : 'Eliminar'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default AdminUsersPage;