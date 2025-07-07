import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDebounce } from 'use-debounce';
import { toast } from 'react-toastify';
import userService from '../services/userService';
import ConfirmationModal from '../components/ui/ConfirmationModal';

// Helper para obtener la clase CSS para el punto de estado del rol
const getStatusClass = (role) => {
    switch (role) {
        case 'admin': return 'status-completed'; // Celeste
        case 'mentor': return 'status-active';   // Verde
        case 'estudiante': return 'status-pending'; // Naranja
        default: return 'status-default'; // Gris
    }
};

function AdminUsersPage() {
    // --- ESTADOS ---
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 0, totalUsers: 0 });
    const USERS_PER_PAGE = 10;

    const [filters, setFilters] = useState({ searchTerm: '', roleFilter: '' });
    const [debouncedSearchTerm] = useDebounce(filters.searchTerm, 500);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    // --- LÓGICA DE CARGA DE DATOS CENTRALIZADA ---

    // Este useEffect es ahora el ÚNICO responsable de cargar los datos.
    // Reacciona a los cambios en la página actual o en los filtros (debounced).
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoading(true);
                const data = await userService.getAllUsers(
                    pagination.currentPage,
                    USERS_PER_PAGE,
                    debouncedSearchTerm,
                    filters.roleFilter
                );

                if (data && Array.isArray(data.users)) {
                    setUsers(data.users);
                    setPagination(prev => ({ // Actualizar paginación con los datos de la respuesta
                        ...prev,
                        totalPages: data.totalPages,
                        totalUsers: data.totalUsers
                    }));
                } else {
                    throw new Error("La respuesta de la API no tiene el formato esperado.");
                }
            } catch (err) {
                toast.error(err.message || 'Error al cargar usuarios.');
                setUsers([]);
                setPagination({ currentPage: 1, totalPages: 0, totalUsers: 0 });
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [pagination.currentPage, debouncedSearchTerm, filters.roleFilter]); // Dependencias claras


    // --- MANEJADORES DE EVENTOS ---

    // Cuando un filtro cambia, reseteamos a la página 1
    useEffect(() => {
        setPagination(prev => ({ ...prev, currentPage: 1 }));
    }, [debouncedSearchTerm, filters.roleFilter]);


    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleClearFilters = () => {
        setFilters({ searchTerm: '', roleFilter: '' });
    };

    const handlePageChange = (newPage) => {
        if (newPage > 0 && newPage <= pagination.totalPages && newPage !== pagination.currentPage) {
            setPagination(prev => ({ ...prev, currentPage: newPage }));
        }
    };
    
    const handleDeleteClick = (user) => {
        setUserToDelete(user);
        setIsModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!userToDelete) return;
        try {
            const response = await userService.deleteUser(userToDelete._id);
            toast.success(response.message || 'Usuario eliminado exitosamente.');
            
            // Lógica para recargar después de eliminar
            if (users.length === 1 && pagination.currentPage > 1) {
                // Si era el último en la página (y no es la primera), retrocede una página
                handlePageChange(pagination.currentPage - 1);
            } else {
                // Si no, simplemente recarga la página actual
                // Para forzar la recarga, podemos llamar a fetchUsers directamente o
                // cambiar una dependencia del useEffect. La forma más limpia es hacer la llamada
                // aquí, pero para evitar duplicar código, podemos hacer un truco
                // o simplemente mantenerlo simple, ya que la recarga total es robusta.
                // Reintroducimos la llamada a fetchUsers aquí para robustez.
                const data = await userService.getAllUsers(pagination.currentPage, USERS_PER_PAGE, debouncedSearchTerm, filters.roleFilter);
                setUsers(data.users);
                setPagination({ currentPage: data.page, totalPages: data.totalPages, totalUsers: data.totalUsers });
            }

        } catch (err) {
            toast.error(err.message || 'Error al eliminar el usuario.');
        } finally {
            setIsModalOpen(false);
            setUserToDelete(null);
        }
    };

    return (
        <div>
            <ConfirmationModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Confirmar Eliminación de Usuario"
                message={`¿Estás seguro de que quieres eliminar al usuario "${userToDelete?.nombre} ${userToDelete?.apellido}"?`}
            />
            
            <h2>Gestión de Usuarios ({pagination.totalUsers})</h2>

            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                <input 
                    type="text" 
                    name="searchTerm"
                    placeholder="Buscar por nombre, apellido o email..."
                    value={filters.searchTerm}
                    onChange={handleFilterChange}
                    style={{ flexGrow: 1, minWidth: '250px' }}
                />
                <select
                    name="roleFilter"
                    value={filters.roleFilter}
                    onChange={handleFilterChange}
                    style={{ minWidth: '150px' }}
                >
                    <option value="">Todos los Roles</option>
                    <option value="estudiante">Estudiante</option>
                    <option value="mentor">Mentor</option>
                    <option value="admin">Admin</option>
                </select>
                {(filters.searchTerm || filters.roleFilter) && (
                    <button onClick={handleClearFilters} style={{backgroundColor: '#7f8c8d'}}>Limpiar Filtros</button>
                )}
            </div>

            {loading ? (
                <p>Cargando...</p>
            ) : users.length > 0 ? (
                <ul className="item-list">
                    {users.map((user) => (
                        <li key={user._id} className="item-list-row" style={{ opacity: user.isDeleted ? 0.6 : 1 }}>
                            <div className="item-field" style={{flexBasis: '25%', flexGrow: 1.5}}>
                                <strong>Nombre:</strong>
                                <span>{user.nombre} {user.apellido}</span>
                            </div>
                            <div className="item-field" style={{flexBasis: '30%', flexGrow: 2}}>
                                <strong>Email:</strong>
                                <span>{user.email}</span>
                            </div>
                            <div className="item-field" style={{flexBasis: '15%'}}>
                                <strong>Rol:</strong>
                                <span><span className={`status-dot ${getStatusClass(user.rol)}`}></span>{user.rol}</span>
                            </div>
                            <div className="item-actions" style={{flexBasis: '20%'}}>
                                <Link to={`/admin-dashboard/users/${user._id}/edit`}>
                                    <button disabled={user.isDeleted} title="Editar">Editar</button>
                                </Link>
                                <button 
                                    onClick={() => handleDeleteClick(user)} 
                                    disabled={user.isDeleted || user.rol === 'admin'}
                                    title={user.isDeleted ? 'Usuario ya eliminado' : (user.rol === 'admin' ? 'No se puede eliminar admin' : 'Eliminar')}
                                    style={{ backgroundColor: (user.isDeleted || user.rol === 'admin') ? '#bdc3c7' : '#e74c3c' }}
                                >
                                    Eliminar
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No se encontraron usuarios con los filtros aplicados o no hay usuarios registrados.</p>
            )}
            
            {!loading && pagination.totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '20px 0' }}>
                    <button onClick={() => handlePageChange(pagination.currentPage - 1)} disabled={pagination.currentPage === 1}>
                        ← Anterior
                    </button>
                    <span style={{ margin: '0 15px' }}>
                        Página <strong>{pagination.currentPage}</strong> de <strong>{pagination.totalPages}</strong>
                    </span>
                    <button onClick={() => handlePageChange(pagination.currentPage + 1)} disabled={pagination.currentPage === pagination.totalPages}>
                        Siguiente →
                    </button>
                </div>
            )}
        </div>
    );
}

export default AdminUsersPage;