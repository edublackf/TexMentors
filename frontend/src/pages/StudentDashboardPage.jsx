import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import mentorshipRequestService from '../services/mentorshipRequestService';
// import { useAuth } from '../contexts/AuthContext'; // Si necesitas datos del currentUser aquí

function StudentDashboardPage() {
    // const { currentUser } = useAuth(); // Si necesitas el nombre del estudiante, etc.
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionMessage, setActionMessage] = useState(''); // Para mensajes de cancelación

    const fetchStudentRequests = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            setActionMessage('');
            const data = await mentorshipRequestService.getAllRequests(); // El backend filtra por el estudiante logueado
            setRequests(data);
        } catch (err) {
            setError(err.message || 'Error al cargar tus solicitudes de mentoría.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStudentRequests();
    }, [fetchStudentRequests]);

    const handleCancelRequest = async (requestId, requestTitle) => {
        // Solo permitir cancelar si el estado es 'pendiente' o 'aceptada_mentor'
        const requestToCancel = requests.find(req => req._id === requestId);
        if (!requestToCancel || !['pendiente', 'aceptada_mentor'].includes(requestToCancel.status)) {
            setError(`No puedes cancelar la solicitud "${requestTitle}" porque su estado es '${requestToCancel?.status || 'desconocido'}'.`);
            setTimeout(() => setError(''), 3000); // Limpiar error después de 3s
            return;
        }

        if (window.confirm(`¿Estás seguro de que quieres cancelar tu solicitud "${requestTitle}"?`)) {
            try {
                setLoading(true); // Podría ser un loading específico para la acción
                const response = await mentorshipRequestService.updateRequest(requestId, { status: 'cancelada_estudiante' });
                setActionMessage(response.message || 'Solicitud cancelada exitosamente.');
                await fetchStudentRequests(); // Recargar la lista
            } catch (err) {
                setError(err.message || 'Error al cancelar la solicitud.');
            } finally {
                setLoading(false);
            }
        }
    };


    if (loading && requests.length === 0) {
        return <p>Cargando tus solicitudes...</p>;
    }

    // No mostramos el error principal si ya hay solicitudes cargadas y el error es de una acción
    if (error && requests.length === 0 && !actionMessage) {
        return <p style={{ color: 'red' }}>Error: {error}</p>;
    }

    return (
        <div>
            <h2>Mis Solicitudes de Mentoría</h2>
            <Link to="/student-dashboard/create-request">
                <button style={{ marginBottom: '20px' }}>Crear Nueva Solicitud</button>
            </Link>

            {actionMessage && <p style={{ color: 'green' }}>{actionMessage}</p>}
            {error && !actionMessage && <p style={{ color: 'red' }}>Error en acción: {error}</p>}
            
            {loading && <p>Actualizando lista...</p>}

            {requests.length === 0 && !loading ? (
                <p>Aún no has creado ninguna solicitud de mentoría.</p>
            ) : (
                <table border="1" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                    <thead>
                        <tr>
                            <th>Título</th>
                            <th>Tipo de Ayuda</th>
                            <th>Mentor Asignado</th>
                            <th>Estado</th>
                            <th>Fecha Creación</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.map((req) => (
                            <tr key={req._id} style={{ backgroundColor: req.isDeleted ? '#ffe0e0' : 
                                                        req.status === 'cancelada_estudiante' ? '#fff0f0' : 
                                                        req.status === 'completada' ? '#e0ffe0' : 'transparent' }}>
                                <td><Link to={`/student-dashboard/requests/${req._id}`}>
                                        {req.title}
                                    </Link></td>
                                <td>{req.helpType?.name || 'N/A'}</td> {/* El '?' es optional chaining */}
                                <td>{req.mentorUser?.nombre || 'Pendiente de asignación'} {req.mentorUser?.apellido || ''}</td>
                                <td>{req.status}</td>
                                <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                                <td>
                                    {/* <Link to={`/student-dashboard/request/${req._id}`}>
                                        <button>Ver Detalles</button>
                                    </Link> */}
                                    {['pendiente', 'aceptada_mentor'].includes(req.status) && !req.isDeleted && (
                                        <button
                                            onClick={() => handleCancelRequest(req._id, req.title)}
                                            style={{ marginLeft: '5px', backgroundColor: 'orange', color: 'white' }}
                                        >
                                            Cancelar
                                        </button>
                                    )}
                                    {req.isDeleted && <span>(Eliminada)</span>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default StudentDashboardPage;