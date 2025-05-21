import React, { useState, useEffect, useCallback } from 'react';
import helpTypeService from '../services/helpTypeService';
import { Link } from 'react-router-dom';

function AdminHelpTypesPage() {
    const [helpTypes, setHelpTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionMessage, setActionMessage] = useState('');

    const fetchHelpTypes = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            setActionMessage('');
            const data = await helpTypeService.getAllHelpTypes();
            setHelpTypes(data);
        } catch (err) {
            setError(err.message || 'Error al cargar tipos de ayuda.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHelpTypes();
    }, [fetchHelpTypes]);

    const handleDeleteHelpType = async (helpTypeId, helpTypeName) => {
        if (window.confirm(`¿Estás seguro de que quieres eliminar el tipo de ayuda "${helpTypeName}"?`)) {
            try {
                setLoading(true);
                setError('');
                setActionMessage('');
                const response = await helpTypeService.deleteHelpType(helpTypeId);
                setActionMessage(response.message || 'Tipo de ayuda eliminado exitosamente.');
                await fetchHelpTypes(); // Recargar la lista
            } catch (err) {
                const errorMessage = err.message || 'Error al eliminar el tipo de ayuda.';
                setError(errorMessage);
                setActionMessage('');
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
    };

    if (loading && helpTypes.length === 0) {
        return <p>Cargando tipos de ayuda...</p>;
    }

    if (error && helpTypes.length === 0) {
        return <p style={{ color: 'red' }}>Error: {error}</p>;
    }

    return (
        <div>
            <h2>Gestión de Tipos de Ayuda</h2>
            <Link to="/admin-dashboard/helptypes/new">
                <button style={{ marginBottom: '10px' }}>Crear Nuevo Tipo de Ayuda</button>
            </Link>

            {actionMessage && <p style={{ color: 'green' }}>{actionMessage}</p>}
            {error && !actionMessage && <p style={{ color: 'red' }}>Error en acción: {error}</p>}
            
            {loading && <p>Actualizando lista...</p>}

            {helpTypes.length === 0 && !loading ? (
                <p>No hay tipos de ayuda registrados o activos.</p>
            ) : (
                <table border="1" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Descripción</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {helpTypes.map((ht) => (
                            <tr key={ht._id} style={{ backgroundColor: ht.isDeleted ? '#ffe0e0' : 'transparent' }}>
                                <td>{ht.name}</td>
                                <td>{ht.description || '-'}</td>
                                <td>{ht.isDeleted ? 'Eliminado' : 'Activo'}</td>
                                <td>
                                    <Link to={`/admin-dashboard/helptypes/${ht._id}/edit`}>
                                        <button disabled={ht.isDeleted}>Editar</button>
                                    </Link>
                                    <button 
                                        onClick={() => handleDeleteHelpType(ht._id, ht.name)} 
                                        disabled={ht.isDeleted}
                                        style={{ 
                                            marginLeft: '5px', 
                                            backgroundColor: ht.isDeleted ? 'grey' : 'tomato',
                                            color: 'white',
                                            cursor: ht.isDeleted ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        {ht.isDeleted ? 'Ya Eliminado' : 'Eliminar'}
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

export default AdminHelpTypesPage;