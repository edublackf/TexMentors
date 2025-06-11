import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import mentorshipRequestService from '../services/mentorshipRequestService';
import mentorshipSessionService from '../services/mentorshipSessionService';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

// --- Funciones Helper (pueden ir fuera del componente) ---
const formatStatusText = (status, type = 'request') => {
    if (!status) return 'Desconocido';
    const requestStatusMap = {
        'pendiente': 'Pendiente',
        'aceptada_mentor': 'Aceptada por Mentor',
        'rechazada_mentor': 'Rechazada por Mentor',
        'rechazada_admin': 'Rechazada por Admin',
        'en_progreso': 'En Progreso',
        'completada': 'Finalizada',
        'cancelada_estudiante': 'Cancelada por Ti',
        'cancelada_admin': 'Cancelada por Admin',
        'cancelada_mentor': 'Cancelada por Mentor'
    };
    const sessionStatusMap = {
        'propuesta': 'Propuesta',
        'confirmada': 'Confirmada',
        'realizada': 'Realizada',
        'cancelada_mentor': 'Cancelada por Mentor',
        'cancelada_estudiante': 'Cancelada por Ti',
        'reprogramar_mentor': 'Reprogramación (Mentor)',
        'reprogramar_estudiante': 'Reprogramación (Estudiante)'
    };
    const roleMap = {
        'estudiante': 'Estudiante',
        'mentor': 'Mentor',
        'admin': 'Admin'
    };

    let map;
    if (type === 'request') map = requestStatusMap;
    else if (type === 'session') map = sessionStatusMap;
    else if (type === 'rol') map = roleMap;
    else map = {};
    
    return map[status] || status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const getStatusColorClass = (status) => {
    if (!status) return '#7f8c8d';
    if (status.includes('completada') || status.includes('realizada') || status.includes('aceptada')) return '#3498db';
    if (status.includes('cancelada') || status.includes('rechazada')) return '#e74c3c';
    if (status.includes('pendiente') || status.includes('propuesta')) return '#f39c12';
    if (status.includes('progreso') || status.includes('confirmada')) return '#2ecc71';
    if (status.includes('reprogramar')) return '#9b59b6';
    return '#7f8c8d';
};
// --- Fin Funciones Helper ---


function StudentMentorshipRequestDetailPage() {
    const { requestId } = useParams();
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const [requestDetails, setRequestDetails] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sessionsLoading, setSessionsLoading] = useState(false); // Estado para carga de sesiones

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
    };

    const fetchRequestAndSessions = useCallback(async () => {
        try {
            setLoading(true); // Loading general para la página
            setSessionsLoading(true); // Inicia carga de sesiones también

            const requestData = await mentorshipRequestService.getRequestById(requestId);
            setRequestDetails(requestData);

            if (requestData && ['aceptada_mentor', 'en_progreso', 'realizada', 'reprogramar_mentor', 'reprogramar_estudiante', 'confirmada', 'propuesta'].includes(requestData.status) ) {
                const sessionsData = await mentorshipSessionService.getSessionsForRequest(requestId);
                setSessions(sessionsData);
            } else if (requestData) {
                setSessions([]);
            }
        } catch (err) {
            toast.error(err.message || `Error al cargar detalles de la solicitud.`);
            setRequestDetails(null);
            setSessions([]);
            console.error(err);
        } finally {
            setLoading(false);
            setSessionsLoading(false);
        }
    }, [requestId]);

    useEffect(() => {
        fetchRequestAndSessions();
    }, [fetchRequestAndSessions]);

    const handleConfirmSession = async (sessionId, confirmedTime) => {
        if (!window.confirm(`¿Confirmar la sesión para ${formatDate(confirmedTime.startTime)} - ${formatDate(confirmedTime.endTime)}?`)) return;
        
        try {
            // Podrías tener un loading específico para esta acción si quieres deshabilitar solo este botón
            await mentorshipSessionService.updateSession(sessionId, {
                confirmedDateTime: { // Enviar como objeto
                    startTime: confirmedTime.startTime,
                    endTime: confirmedTime.endTime
                },
                status: 'confirmada'
            });
            toast.success('Sesión confirmada exitosamente.');
            fetchRequestAndSessions(); 
        } catch (err) {
            toast.error(err.message || 'Error al confirmar la sesión.');
            console.error(err);
        }
    };
    
    const canStudentProposeSession = () => {
        if (!requestDetails || !currentUser || !sessions) return false;
        const activeRequestStatus = ['aceptada_mentor', 'en_progreso', 'reprogramar_mentor'].includes(requestDetails.status);
        if (!activeRequestStatus) return false;

        const proposedByStudentSessions = sessions.filter(s => s.status === 'propuesta' && s.proposedBy?._id === currentUser.id);
        if (proposedByStudentSessions.length > 0) return false; // Estudiante ya propuso y está esperando

        const lastRelevantSession = sessions
            .filter(s => ['propuesta', 'reprogramar_mentor', 'reprogramar_estudiante', 'confirmada'].includes(s.status))
            .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

        if (!lastRelevantSession || lastRelevantSession.status === 'reprogramar_mentor' || lastRelevantSession.status === 'confirmada') {
            return true; 
        }
        return false; 
    };


    if (loading) return <div className="ticket-container" style={{textAlign: 'center', padding: '50px'}}><p>Cargando detalles...</p></div>;
    if (!requestDetails && !loading) return <div className="ticket-container" style={{textAlign: 'center', padding: '50px'}}><p>Solicitud no encontrada.</p><Link to="/student-dashboard">Volver</Link></div>;

    return (
        <div className="ticket-container">
            <div className="ticket-header">
                <h2>{requestDetails.title}</h2>
                <span className="request-status" style={{ color: getStatusColorClass(requestDetails.status) }}>
                    Estado: {formatStatusText(requestDetails.status, 'request')}
                </span>
            </div>

            <div className="ticket-body">
                <div className="ticket-section">
                    <h4>Información de la Solicitud</h4>
                    <div className="ticket-item"><strong>Tipo de Ayuda:</strong><span>{requestDetails.helpType?.name || 'N/A'}</span></div>
                    <div className="ticket-item"><strong>Tu Disponibilidad:</strong><span>{requestDetails.studentAvailability || 'No especificada'}</span></div>
                    <div className="ticket-item"><strong>Fecha Creación:</strong><span>{formatDate(requestDetails.createdAt)}</span></div>
                    <div className="ticket-item"><strong>Descripción:</strong></div>
                    <div className="description-block">{requestDetails.description}</div>
                </div>

                <div className="ticket-section">
                    <h4>Mentor Asignado</h4>
                    {requestDetails.mentorUser ? (
                        <>
                            <div className="ticket-item"><strong>Nombre:</strong><span>{requestDetails.mentorUser.nombre} {requestDetails.mentorUser.apellido}</span></div>
                            <div className="ticket-item"><strong>Email:</strong><span>{requestDetails.mentorUser.email}</span></div>
                        </>
                    ) : (
                        <p style={{textAlign:'center', fontStyle: 'italic'}}>Aún no se ha asignado un mentor.</p>
                    )}
                </div>
                
                {['aceptada_mentor', 'en_progreso', 'realizada', 'reprogramar_mentor', 'reprogramar_estudiante', 'confirmada', 'propuesta'].includes(requestDetails.status) && (
                <div className="sessions-highlight-section">
                    <h4>Sesiones</h4>
                   {/* {canStudentProposeSession() && (
     <div className="propose-session-btn-container">
        <Link to={`/student-dashboard/requests/${requestId}/propose-session`}>
            <button>Proponer Nuevo Horario</button>
        </Link>
     </div>
)} */}

                    {sessionsLoading && <p style={{textAlign:'center'}}>Cargando sesiones...</p>}
                    
                    {!sessionsLoading && sessions.length === 0 && 
                        <p style={{textAlign:'center', fontStyle: 'italic'}}>No hay sesiones propuestas o programadas.</p>
                    }

                    {sessions.length > 0 && (
                        <ul className="sessions-list">
                            {sessions.map(session => (
                                <li key={session._id} className="session-card">
                                    <p><strong>Estado:</strong> <span style={{fontWeight: 'bold', color: getStatusColorClass(session.status)}}>{formatStatusText(session.status, 'session')}</span></p>
                                    <p><strong>Propuesta por:</strong> {session.proposedBy?.nombre} {session.proposedBy?.apellido} ({formatStatusText(session.proposedBy?.rol, 'rol')})</p>
                                    
                                    {session.status === 'propuesta' && (
                                        <div>
                                            <strong>Horarios Propuestos:</strong>
                                            <ul>
                                                {session.proposedDateTimes.map((pdt, index) => (
                                                    <li key={index} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0'}}>
                                                        <span>{formatDate(pdt.startTime)} - {formatDate(pdt.endTime)}</span>
                                                        {currentUser && session.proposedBy?._id !== currentUser.id && (
                                                            <button onClick={() => handleConfirmSession(session._id, { startTime: pdt.startTime, endTime: pdt.endTime })}>
                                                                Confirmar
                                                            </button>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {session.confirmedDateTime?.startTime && (
                                        <p><strong>Confirmado:</strong> {formatDate(session.confirmedDateTime.startTime)} - {formatDate(session.confirmedDateTime.endTime)}</p>
                                    )}
                                    
                                    <p><strong>Lugar/Enlace:</strong> {session.locationOrLink || 'No especificado'}</p>
                                    
                                    {session.status === 'realizada' && (
                                        <>
                                            {session.summaryMentor && <p><strong>Resumen Mentor:</strong> <span className="text-block" style={{display:'block'}}>{session.summaryMentor}</span></p>}
                                            {session.feedbackStudent ? 
                                                <p><strong>Tu Feedback:</strong> <span className="text-block" style={{display:'block'}}>{session.feedbackStudent}</span></p> :
                                                (currentUser && currentUser.id === session.student?._id && <div style={{textAlign:'right'}}><button onClick={() => alert('Implementar dar feedback!')}>Dar Feedback</button></div>)
                                            }
                                        </>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                )}
                 <div style={{textAlign: 'center', marginTop: '20px'}}>
                    <Link to="/student-dashboard">
                        <button type="button" style={{backgroundColor: '#7f8c8d'}}>Volver a Mis Solicitudes</button>
                    </Link>
                 </div>
            </div> {/* Fin ticket-body */}
        </div> /* Fin ticket-container */
    );
}

export default StudentMentorshipRequestDetailPage;