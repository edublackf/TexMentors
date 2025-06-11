import React, { useState, useEffect, useCallback } from 'react';
import userService from '../services/userService';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

// Helper para clases de estado
const getStatusClass = (statusKey, value) => {
    if (statusKey === 'rol') {
        if (value === 'admin') return 'status-completed'; // Celeste para admin
        if (value === 'mentor') return 'status-active';   // Verde para mentor
        if (value === 'estudiante') return 'status-pending'; // Naranja para estudiante
    }
    if (statusKey === 'isVerified') {
        return value ? 'status-isVerified-true' : 'status-isVerified-false';
    }
    if (statusKey === 'estado') { // Para el estado Eliminado/Activo
        return value === 'Eliminado' ? 'status-rejected' : 'status-active';
    }
    return '';
};


function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    // const [error, setError] = useState(''); // Usaremos toast para errores de acción

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            // setError('');
            const data = await userService.getAllUsers();
            setUsers(data);
        } catch (err) {
            toast.error(err.message || 'Error al cargar usuarios.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleDeleteUser = async (userId, userName) => {
        if (window.confirm(`¿Estás seguro de que quieres eliminar (lógicamente) al usuario "${userName}"?`)) {
            try {
                setLoading(true); 
                const response = await userService.deleteUser(userId);
                toast.success(response.message || 'Usuario eliminado exitosamente.');
                await fetchUsers(); 
            } catch (err) {
                toast.error(err.message || 'Error al eliminar el usuario.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
    };

    if (loading && users.length === 0) {
        return <p>Cargando usuarios...</p>;
    }

    return (
        <div>
            <h2>Gestión de Usuarios</h2>
            {/* TODO: Botón para Crear Nuevo Usuario (si se implementa) */}
            {/* <Link to="/admin-dashboard/users/new"><button>Crear Usuario</button></Link> */}
            
            {loading && users.length > 0 && <p>Actualizando lista...</p>}

            {users.length === 0 && !loading ? (
                <p>No hay usuarios registrados o activos.</p>
            ) : (
                <ul className="item-list"> {/* Usamos la clase para la lista */}
                    {users.map((user) => (
                        <li key={user._id} className="item-list-row" style={{ opacity: user.isDeleted ? 0.6 : 1 }}>
                            <div className="item-field" style={{flexBasis: '180px', flexGrow: 0}}> {/* Nombre y Apellido */}
                                <strong>Nombre:</strong>
                                <span>{user.nombre} {user.apellido}</span>
                            </div>
                            <div className="item-field" style={{flexBasis: '200px'}}>
                                <strong>Email:</strong>
                                <span>{user.email}</span>
                            </div>
                            <div className="item-field" style={{flexBasis: '100px'}}>
                                <strong>Rol:</strong>
                                <span><span className={`status-dot ${getStatusClass('rol', user.rol)}`}></span>{user.rol}</span>
                            </div>
                            <div className="item-field" style={{flexBasis: '150px'}}>
                                <strong>Carrera:</strong>
                                <span>{user.carrera || '-'}</span>
                            </div>
                            <div className="item-field" style={{flexBasis: '80px'}}>
                                <strong>Ciclo:</strong>
                                <span>{user.cicloActual || '-'}</span>
                            </div>
                            <div className="item-field" style={{flexBasis: '100px'}}>
                                <strong>Verificado:</strong>
                                <span><span className={`status-dot ${getStatusClass('isVerified', user.isVerified)}`}></span>{user.isVerified ? 'Sí' : 'No'}</span>
                            </div>
                            <div className="item-field" style={{flexBasis: '100px'}}>
                                <strong>Estado:</strong>
                                <span style={{ fontWeight: 'bold', color: user.isDeleted ? '#e74c3c' : '#2ecc71' }}>
                                    <span className={`status-dot ${getStatusClass('estado', user.isDeleted ? 'Eliminado' : 'Activo')}`}></span>
                                    {user.isDeleted ? 'Eliminado' : 'Activo'}
                                </span>
                            </div>
                            <div className="item-actions">
                                <Link to={`/admin-dashboard/users/${user._id}/edit`}>
                                    <button disabled={user.isDeleted} title="Editar">
                                        {/* Podrías usar un ícono de lápiz aquí */}
                                        Editar 
                                    </button>
                                </Link>
                                <button 
                                    onClick={() => handleDeleteUser(user._id, `${user.nombre} ${user.apellido}`)} 
                                    disabled={user.isDeleted || user.rol === 'admin'}
                                    title={user.isDeleted ? 'Usuario ya eliminado' : (user.rol === 'admin' ? 'No se puede eliminar admin' : 'Eliminar')}
                                    style={{ 
                                        backgroundColor: (user.isDeleted || user.rol === 'admin') ? '#bdc3c7' : '#e74c3c', /* Rojo para eliminar */
                                    }}
                                >
                                    {/* Podrías usar un ícono de basura aquí */}
                                    {user.isDeleted ? 'Eliminado' : 'Eliminar'}
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default AdminUsersPage;