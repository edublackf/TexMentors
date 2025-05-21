import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import mentorshipRequestService from '../services/mentorshipRequestService';
import { useAuth } from '../contexts/AuthContext'; // Para verificar si el mentor es el asignado o admin

function MentorMentorshipRequestDetailPage() {
    const { requestId } = useParams();
    const { currentUser } = useAuth(); // Necesitamos el rol y el ID del usuario actual

    const [requestDetails, setRequestDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchRequestDetails = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const data = await mentorshipRequestService.getRequestById(requestId);
            
            // El backend ya valida si el mentor asignado (o admin) puede verla.
            // No es estrictamente necesaria una validación extra aquí si confiamos en el backend.
            setRequestDetails(data);
        } catch (err) {
            setError(err.message || `Error al cargar los detalles de la solicitud ${requestId}.`);
            setRequestDetails(null);
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [requestId]);

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
                <Link to="/mentor-dashboard">Volver al Panel de Mentor</Link>
            </div>
        );
    }

    if (!requestDetails) {
        return (
            <div>
                <p>No se encontraron detalles para esta solicitud.</p>
                <Link to="/mentor-dashboard">Volver al Panel de Mentor</Link>
            </div>
        );
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString();
    };

    // Determinar si el usuario actual es el mentor asignado
    const isMentorAssigned = currentUser && requestDetails.mentorUser && requestDetails.mentorUser._id === currentUser.id;

    return (
        <div>
            <h2>Detalles de Solicitud de Mentoría (Vista Mentor)</h2>
            <Link to="/mentor-dashboard" style={{ marginBottom: '20px', display: 'inline-block' }}>
                ← Volver al Panel de Mentor
            </Link>
            
            <h3>{requestDetails.title}</h3>
            <p><strong>Estudiante:</strong> {requestDetails.studentUser?.nombre} {requestDetails.studentUser?.apellido} ({requestDetails.studentUser?.email})</p>
            <p><strong>Tipo de Ayuda:</strong> {requestDetails.helpType?.name || 'N/A'}</p>
            <p><strong>Estado:</strong> <span style={{ fontWeight: 'bold', color: requestDetails.status === 'completada' ? 'green' : requestDetails.status.includes('cancelada') || requestDetails.status.includes('rechazada') ? 'red' : 'orange' }}>
                {requestDetails.status}
            </span></p>
            <p><strong>Descripción del Estudiante:</strong></p>
            <p style={{ whiteSpace: 'pre-wrap', border: '1px solid #eee', padding: '10px', background: '#f9f9f9' }}>
                {requestDetails.description}
            </p>
            <p><strong>Disponibilidad Indicada por Estudiante:</strong> {requestDetails.studentAvailability || 'No especificada'}</p>
            
            {requestDetails.mentorUser && (
                <h4>Mentor Asignado: {requestDetails.mentorUser._id === currentUser?.id ? "Tú" : `${requestDetails.mentorUser.nombre} ${requestDetails.mentorUser.apellido}`}</h4>
            )}

            { (currentUser?.rol === 'admin' || isMentorAssigned) && requestDetails.internalNotes && (
                 <div>
                    <h4>Notas Internas:</h4>
                    <p style={{ whiteSpace: 'pre-wrap', border: '1px solid #eee', padding: '10px', background: '#f0f0ff' }}>
                        {requestDetails.internalNotes}
                    </p>
                </div>
            )}
            {/* Aquí un mentor podría tener un campo para AÑADIR/EDITAR notas internas */}


            <p><strong>Fecha de Creación:</strong> {formatDate(requestDetails.createdAt)}</p>
            <p><strong>Última Actualización:</strong> {formatDate(requestDetails.updatedAt)}</p>

            {/* Aquí podrían ir los botones de acción (Aceptar, Rechazar, etc.) si el mentor también
                puede gestionarlos desde esta vista de detalle, además de la tabla del dashboard.
                Por ahora, las acciones están en la tabla del MentorDashboardPage. 
            */}
        </div>
    );
}

export default MentorMentorshipRequestDetailPage;