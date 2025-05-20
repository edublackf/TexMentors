import React, { useState, useEffect } from 'react';
import userService from '../services/userService'; // Importamos nuestro servicio
// import { Link } from 'react-router-dom'; // Para enlaces a editar, etc.

function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoading(true);
                setError('');
                const data = await userService.getAllUsers();
                setUsers(data);
            } catch (err) {
                setError(err.message || 'Error al cargar usuarios. Asegúrate de estar logueado como administrador.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []); // El array vacío asegura que se ejecute solo una vez al montar el componente

    if (loading) {
        return <p>Cargando usuarios...</p>;
    }

    if (error) {
        return <p style={{ color: 'red' }}>Error: {error}</p>;
    }

    return (
        <div>
            <h2>Gestión de Usuarios</h2>
            {/* TODO: Botón para Crear Nuevo Usuario (si se implementa) */}
            {users.length === 0 ? (
                <p>No hay usuarios registrados.</p>
            ) : (
                <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Apellido</th>
                            <th>Email</th>
                            <th>Rol</th>
                            <th>Carrera</th>
                            <th>Ciclo</th>
                            <th>Verificado</th>
                            <th>Eliminado</th>
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
                                <td>{user.isDeleted ? 'Sí' : 'No'}</td>
                                <td>
                                    {/* TODO: Enlaces/Botones para Editar y Eliminar */}
                                    <button onClick={() => alert(`Editar usuario: ${user.nombre}`)}>Editar</button>
                                    <button 
                                        onClick={() => alert(`Eliminar usuario: ${user.nombre}`)} 
                                        disabled={user.isDeleted}
                                        style={{ marginLeft: '5px', backgroundColor: user.isDeleted ? 'grey' : ''}}
                                    >
                                        {user.isDeleted ? 'Eliminado' : 'Eliminar'}
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