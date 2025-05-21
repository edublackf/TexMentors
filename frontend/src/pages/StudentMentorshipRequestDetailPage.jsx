import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import mentorshipRequestService from '../services/mentorshipRequestService';
// import { useAuth } from '../contexts/AuthContext'; // Para verificar si el usuario logueado es el dueño

function StudentMentorshipRequestDetailPage() {
    const { requestId } = useParams(); // Obtiene el :requestId de la URL
    // const { currentUser } = useAuth(); // Para verificar si el usuario actual es el dueño

    const [requestDetails, setRequestDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchRequestDetails = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const data = await mentorshipRequestService.getRequestById(requestId);
            
            // Doble verificación (aunque el backend debería manejar permisos):
            // Asegurarse de que el estudiante solo vea sus propias solicitudes si accedió por URL directa.
            // Nota: currentUser podría no estar disponible inmediatamente si la página se carga directamente.
            // El backend ya protege este endpoint, así que esta verificación en frontend es una capa extra.
            // if (currentUser && data.studentUser?._id !== currentUser.id && currentUser.rol !== 'admin') {
            //     setError('No tienes permiso para ver esta solicitud.');
            //     setRequestDetails(null);
            //     setLoading(false);
            //     return;
            // }
            setRequestDetails(data);
        } catch (err) {
            setError(err.message || `Error al cargar los detalles de la solicitud ${requestId}.`);
            setRequestDetails(null);
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [requestId /*, currentUser */]); // Añadir currentUser si se usa la verificación extra

    useEffect(() => {
        fetchRequestDetails();
    }, [fetchRequestDetails]);

    if (loading) {
        return <p>Cargando detalles de la solicitud...</p>;
    }

    if (error) {
        return (
            <div>
                <p style={{ color: 'red' }}>Error: {error}</p>
                <Link to="/student-dashboard">Volver a Mis Solicitudes</Link>
            </div>
        );
    }

    if (!requestDetails) {
        return (
            <div>
                <p>No se encontraron detalles para esta solicitud.</p>
                <Link to="/student-dashboard">Volver a Mis Solicitudes</Link>
            </div>
        );
    }

    // Formatear fechas para mejor lectura
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString();
    };

    return (
        <div>
            <h2>Detalles de la Solicitud de Mentoría</h2>
            <Link to="/student-dashboard" style={{ marginBottom: '20px', display: 'inline-block' }}>
                ← Volver a Mis Solicitudes
            </Link>
            
            <h3>{requestDetails.title}</h3>
            <p><strong>Tipo de Ayuda:</strong> {requestDetails.helpType?.name || 'N/A'}</p>
            <p><strong>Estado:</strong> <span style={{ fontWeight: 'bold', color: requestDetails.status === 'completada' ? 'green' : requestDetails.status.includes('cancelada') || requestDetails.status.includes('rechazada') ? 'red' : 'orange' }}>
                {requestDetails.status}
            </span></p>
            <p><strong>Descripción:</strong></p>
            <p style={{ whiteSpace: 'pre-wrap', border: '1px solid #eee', padding: '10px', background: '#f9f9f9' }}>
                {requestDetails.description}
            </p>
            <p><strong>Tu Disponibilidad Indicada:</strong> {requestDetails.studentAvailability || 'No especificada'}</p>
            
            <h4>Mentor Asignado:</h4>
            {requestDetails.mentorUser ? (
                <div>
                    <p><strong>Nombre:</strong> {requestDetails.mentorUser.nombre} {requestDetails.mentorUser.apellido}</p>
                    <p><strong>Email:</strong> {requestDetails.mentorUser.email}</p>
                    {/* No mostrar notas internas del mentor al estudiante a menos que sea un requisito */}
                </div>
            ) : (
                <p>Aún no se ha asignado un mentor.</p>
            )}

            {requestDetails.internalNotes && (requestDetails.currentUser?.rol === 'admin' || requestDetails.currentUser?.rol === 'mentor') && ( // Solo para admin/mentor
                 <div>
                    <h4>Notas Internas (Solo visible para Admin/Mentor):</h4>
                    <p style={{ whiteSpace: 'pre-wrap', border: '1px solid #eee', padding: '10px', background: '#f0f0ff' }}>
                        {requestDetails.internalNotes}
                    </p>
                </div>
            )}


            <p><strong>Fecha de Creación:</strong> {formatDate(requestDetails.createdAt)}</p>
            <p><strong>Última Actualización:</strong> {formatDate(requestDetails.updatedAt)}</p>

            {/* Aquí podrían ir acciones si el estudiante puede hacer algo desde esta vista, 
                como cancelar si el estado lo permite (aunque ya lo tiene en la tabla) */}
        </div>
    );
}

export default StudentMentorshipRequestDetailPage;