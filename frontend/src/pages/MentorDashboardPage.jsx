import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom'; // useNavigate para acciones
import mentorshipRequestService from '../services/mentorshipRequestService';
import { useAuth } from '../contexts/AuthContext'; // Para obtener el ID del mentor actual

function MentorDashboardPage() {
    const { currentUser } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionMessage, setActionMessage] = useState('');
    const [actionError, setActionError] = useState(''); // Errores específicos de acciones

    const fetchMentorRequests = useCallback(async () => {
        if (!currentUser) return; // No hacer nada si currentUser no está listo
        try {
            setLoading(true);
            setError('');
            setActionMessage('');
            setActionError('');
            // El backend filtra por el mentor logueado:
            // Muestra las asignadas a él O las pendientes sin asignar.
            const data = await mentorshipRequestService.getAllRequests();
            setRequests(data);
        } catch (err) {
            setError(err.message || 'Error al cargar tus solicitudes de mentoría.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        fetchMentorRequests();
    }, [fetchMentorRequests]);

    const handleUpdateRequestStatus = async (requestId, newStatus, requestTitle) => {
        if (newStatus === 'aceptada_mentor' || newStatus === 'rechazada_mentor') {
            if (!window.confirm(`¿Estás seguro de que quieres "${newStatus === 'aceptada_mentor' ? 'aceptar' : 'rechazar'}" la solicitud "${requestTitle}"?`)) {
                return;
            }
        }
        // Podríamos añadir más confirmaciones para otros estados si es necesario.

        try {
            setLoading(true); // Podríamos tener un loading específico para esta acción por fila
            setActionMessage('');
            setActionError('');
            
            const updateData = { status: newStatus };
            // Si es aceptada_mentor y la solicitud no tenía mentor, el backend debería asignarlo
            // basado en el currentUser.id del mentor.
            // Nuestra lógica actual en el backend para updateMentorshipRequest no asigna
            // automáticamente el mentor si el mentorUserId es null y el status cambia a aceptada_mentor
            // por un mentor. Esto es algo que podríamos refinar en el backend.
            // Por ahora, asumimos que el admin asigna primero o la solicitud ya tiene mentor.
            // O, si el mentor "toma" una pendiente, el backend tendría que manejar la auto-asignación.

            const response = await mentorshipRequestService.updateRequest(requestId, updateData);
            setActionMessage(response.message || `Solicitud actualizada a "${newStatus}".`);
            await fetchMentorRequests(); // Recargar la lista
        } catch (err) {
            setActionError(err.message || `Error al actualizar la solicitud a "${newStatus}".`);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading && requests.length === 0) {
        return <p>Cargando solicitudes...</p>;
    }

    if (error && requests.length === 0 && !actionMessage && !actionError) {
        return <p style={{ color: 'red' }}>Error: {error}</p>;
    }

    const canAcceptOrReject = (status) => status === 'pendiente';
    const canStartProgress = (status) => status === 'aceptada_mentor';
    const canCompleteOrCancelMentor = (status) => status === 'en_progreso' || status === 'aceptada_mentor';


    return (
        <div>
            <h2>Panel de Mentor - Solicitudes de Mentoría</h2>
            {/* Aquí podría ir un resumen o estadísticas para el mentor */}

            {actionMessage && <p style={{ color: 'green' }}>{actionMessage}</p>}
            {actionError && <p style={{ color: 'red' }}>Error en acción: {actionError}</p>}
            
            {loading && <p>Actualizando lista...</p>}

            {requests.length === 0 && !loading ? (
                <p>No hay solicitudes de mentoría para mostrarte en este momento.</p>
            ) : (
                <table border="1" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                    <thead>
                        <tr>
                            <th>Título</th>
                            <th>Estudiante</th>
                            <th>Tipo de Ayuda</th>
                            <th>Estado</th>
                            <th>Fecha Creación</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.map((req) => {
                            const isAssignedToMe = req.mentorUser?._id === currentUser?.id;
                            const isPendingAndUnassigned = req.status === 'pendiente' && !req.mentorUser;

                            return (
                                <tr key={req._id} style={{ backgroundColor: req.isDeleted ? '#ffe0e0' : 'transparent' }}>
                                    <td>
                                        <Link to={`/mentor-dashboard/requests/${req._id}`}>
                                            {req.title}
                                        </Link>
                                    </td>
                                    <td>{req.studentUser?.nombre} {req.studentUser?.apellido || ''}</td>
                                    <td>{req.helpType?.name || 'N/A'}</td>
                                    <td>{req.status}</td>
                                    <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        {/* Lógica de botones de acción para el mentor */}
                                        {isAssignedToMe && canAcceptOrReject(req.status) && (
                                            <>
                                                <button onClick={() => handleUpdateRequestStatus(req._id, 'aceptada_mentor', req.title)} style={{backgroundColor: 'lightgreen'}}>Aceptar</button>
                                                <button onClick={() => handleUpdateRequestStatus(req._id, 'rechazada_mentor', req.title)} style={{backgroundColor: 'salmon', marginLeft: '5px'}}>Rechazar</button>
                                            </>
                                        )}
                                        {isAssignedToMe && canStartProgress(req.status) && (
                                            <button onClick={() => handleUpdateRequestStatus(req._id, 'en_progreso', req.title)} style={{backgroundColor: 'lightblue'}}>Iniciar Progreso</button>
                                        )}
                                        {isAssignedToMe && canCompleteOrCancelMentor(req.status) && (
                                            <>
                                                <button onClick={() => handleUpdateRequestStatus(req._id, 'completada', req.title)} style={{backgroundColor: 'lightgreen', marginLeft: '5px'}}>Completar</button>
                                                <button onClick={() => handleUpdateRequestStatus(req._id, 'cancelada_mentor', req.title)} style={{backgroundColor: 'grey', color: 'white', marginLeft: '5px'}}>Cancelar (Mentor)</button>
                                            </>
                                        )}
                                        {isPendingAndUnassigned && ( // Si el mentor puede "tomar" una solicitud pendiente
                                            <button onClick={() => handleUpdateRequestStatus(req._id, 'aceptada_mentor', req.title)} style={{backgroundColor: 'orange', color: 'white'}}>Tomar Solicitud</button>
                                        )}
                                        {/* Botón para ver detalles siempre disponible si es relevante para el mentor */}
                                        {/* <Link to={`/mentor-dashboard/requests/${req._id}`} style={{marginLeft: '5px'}}><button>Detalles</button></Link> */}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default MentorDashboardPage;