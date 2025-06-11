import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import mentorshipRequestService from '../services/mentorshipRequestService';
import mentorshipSessionService from '../services/mentorshipSessionService';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

// --- Funciones Helper (Asegúrate de que estas definiciones sean consistentes donde las uses) ---
const formatStatusText = (status, type = 'request') => {
    if (!status) return 'Desconocido';
    const requestStatusMap = {
        'pendiente': 'Pendiente',
        'aceptada_mentor': 'Aceptada',
        'rechazada_mentor': 'Rechazada por Mentor',
        'rechazada_admin': 'Rechazada por Admin',
        'en_progreso': 'En Progreso',
        'completada': 'Finalizada',
        'cancelada_estudiante': 'Cancelada por Estudiante',
        'cancelada_admin': 'Cancelada por Admin',
        'cancelada_mentor': 'Cancelada por Mentor'
    };
    const sessionStatusMap = {
        'propuesta': 'Propuesta',
        'confirmada': 'Confirmada',
        'realizada': 'Realizada',
        'cancelada_mentor': 'Cancelada por Mentor',
        'cancelada_estudiante': 'Cancelada por Estudiante',
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
    if (status.includes('completada') || status.includes('realizada') || status.includes('aceptada_mentor')) return '#3498db'; // Aceptada por mentor ahora celeste también
    if (status.includes('cancelada') || status.includes('rechazada')) return '#e74c3c';
    if (status.includes('pendiente') || status.includes('propuesta')) return '#f39c12';
    if (status.includes('progreso') || status.includes('confirmada')) return '#2ecc71';
    if (status.includes('reprogramar')) return '#9b59b6';
    return '#7f8c8d';
};
// --- Fin Funciones Helper ---


function MentorMentorshipRequestDetailPage() {
    const { requestId } = useParams();
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const [requestDetails, setRequestDetails] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sessionsLoading, setSessionsLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false); // Para botones de acción individuales

    const [editingSummarySessionId, setEditingSummarySessionId] = useState(null);
    const [summaryText, setSummaryText] = useState('');

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
    };

    const fetchRequestAndSessionsDetails = useCallback(async () => {
        try {
            setLoading(true);
            setSessionsLoading(true);
            
            const requestData = await mentorshipRequestService.getRequestById(requestId);
            setRequestDetails(requestData);

            if (requestData && ['aceptada_mentor', 'en_progreso', 'realizada', 'reprogramar_mentor', 'reprogramar_estudiante', 'confirmada', 'propuesta'].includes(requestData.status) ) {
                const sessionsData = await mentorshipSessionService.getSessionsForRequest(requestId);
                setSessions(sessionsData);
            } else if (requestData) {
                setSessions([]);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || err.message || `Error al cargar detalles.`);
            setRequestDetails(null);
            setSessions([]);
            console.error(err);
        } finally {
            setLoading(false);
            setSessionsLoading(false);
        }
    }, [requestId]);

    useEffect(() => {
        if (currentUser) { // Solo cargar si currentUser está disponible
            fetchRequestAndSessionsDetails();
        }
    }, [fetchRequestAndSessionsDetails, currentUser]);

    const handleSessionAction = async (sessionId, actionData, successMessage, confirmMessage) => {
        if (confirmMessage && !window.confirm(confirmMessage)) return;
        
        setActionLoading(true);
        try {
            await mentorshipSessionService.updateSession(sessionId, actionData);
            toast.success(successMessage);
            fetchRequestAndSessionsDetails(); // Recargar todo
        } catch (err) {
            toast.error(err.response?.data?.message || err.message || 'Error al actualizar la sesión.');
        } finally {
            setActionLoading(false);
        }
    };
    
    const handleOpenSummaryEditor = (session) => {
        setEditingSummarySessionId(session._id);
        setSummaryText(session.summaryMentor || '');
    };

    const handleSaveSummary = async () => {
        if (!editingSummarySessionId) return;
        await handleSessionAction(editingSummarySessionId, { summaryMentor: summaryText }, "Resumen guardado.");
        setEditingSummarySessionId(null); 
    };

    const isCurrentUserTheAssignedMentor = currentUser && requestDetails?.mentorUser && requestDetails.mentorUser._id === currentUser.id;

    const canMentorProposeSession = () => {
        if (!requestDetails || !currentUser || !isCurrentUserTheAssignedMentor) return false;
        const activeRequestStatus = ['aceptada_mentor', 'en_progreso', 'reprogramar_estudiante'].includes(requestDetails.status);
        if (!activeRequestStatus) return false;

        const proposedByMentorSessions = sessions.filter(s => s.status === 'propuesta' && s.proposedBy?._id === currentUser.id);
        if (proposedByMentorSessions.length > 0) return false; 

        const lastRelevantSession = sessions
            .filter(s => ['propuesta', 'reprogramar_estudiante', 'reprogramar_mentor', 'confirmada'].includes(s.status))
            .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

        if (!lastRelevantSession || lastRelevantSession.status === 'reprogramar_estudiante' || lastRelevantSession.status === 'confirmada') {
            return true; 
        }
        return false;
    };


    if (loading) return <div className="ticket-container" style={{textAlign: 'center', padding: '50px'}}><p>Cargando...</p></div>;
    if (!requestDetails && !loading) return <div className="ticket-container" style={{textAlign: 'center', padding: '50px'}}><p>Solicitud no encontrada.</p><Link to="/mentor-dashboard">Volver</Link></div>;
    

    return (
        <div className="ticket-container">
            <div className="ticket-header">
                <h2>{requestDetails.title}</h2>
                <span className="request-status" style={{ color: 'white' }}>
                    Estado Solicitud: {formatStatusText(requestDetails.status, 'request')}
                </span>
            </div>

            <div className="ticket-body">
                <div className="ticket-section">
                    <h4>Información del Estudiante</h4>
                    <div className="ticket-item"><strong>Nombre:</strong><span>{requestDetails.studentUser?.nombre} {requestDetails.studentUser?.apellido}</span></div>
                    <div className="ticket-item"><strong>Email:</strong><span>{requestDetails.studentUser?.email}</span></div>
                    <div className="ticket-item"><strong>Disponibilidad:</strong><span>{requestDetails.studentAvailability || 'No especificada'}</span></div>
                </div>

                <div className="ticket-section">
                    <h4>Detalles de la Solicitud</h4>
                    <div className="ticket-item"><strong>Tipo de Ayuda:</strong><span>{requestDetails.helpType?.name || 'N/A'}</span></div>
                    <div className="ticket-item"><strong>Fecha Creación:</strong><span>{formatDate(requestDetails.createdAt)}</span></div>
                    <div className="ticket-item"><strong>Descripción:</strong></div>
                    <div className="description-block">{requestDetails.description}</div>
                </div>

                {(currentUser?.rol === 'admin' || isCurrentUserTheAssignedMentor) && (
                 <div className="ticket-section">
                    <h4>Notas Internas</h4>
                    {requestDetails.internalNotes ? (
                        <div className="description-block">{requestDetails.internalNotes}</div>
                    ) : (
                        <p style={{fontStyle:'italic'}}>No hay notas internas.</p>
                    )}
                    {/* Aquí el mentor podría tener un botón para AÑADIR/EDITAR notas internas de la SOLICITUD (no de la sesión) */}
                    {isCurrentUserTheAssignedMentor && 
                        <button onClick={() => {
                            const notes = prompt("Editar notas internas de la solicitud:", requestDetails.internalNotes || "");
                            if (notes !== null) { // Si el usuario no presiona cancelar
                                mentorshipRequestService.updateRequest(requestId, { internalNotes: notes })
                                    .then(() => {
                                        toast.success("Notas internas actualizadas.");
                                        fetchRequestAndSessionsDetails();
                                    })
                                    .catch(err => toast.error(err.message || "Error al actualizar notas."));
                            }
                        }} style={{marginTop: '10px', fontSize: '0.9em'}}>
                            Editar Notas de Solicitud
                        </button>
                    }
                </div>
                )}

                {['aceptada_mentor', 'en_progreso', 'realizada', 'reprogramar_mentor', 'reprogramar_estudiante', 'confirmada', 'propuesta'].includes(requestDetails.status) && (
                <div className="sessions-highlight-section">
                    <h4>Sesiones</h4>
                    {canMentorProposeSession() && (
                         <div className="propose-session-btn-container">
                            <Link to={`/mentor-dashboard/requests/${requestId}/propose-session`}>
                                <button disabled={actionLoading}>Proponer Nuevo Horario</button>
                            </Link>
                         </div>
                    )}

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
                                                    <li key={index}>
                                                        <span>{formatDate(pdt.startTime)} - {formatDate(pdt.endTime)}</span>
                                                        {currentUser && session.proposedBy?._id !== currentUser.id && isCurrentUserTheAssignedMentor && (
                                                            <button 
                                                                onClick={() => handleSessionAction(session._id, 
                                                                    { confirmedDateTime: {startTime: pdt.startTime, endTime: pdt.endTime}, status: 'confirmada' },
                                                                    "Sesión confirmada exitosamente.",
                                                                    `¿Confirmar la sesión para ${formatDate(pdt.startTime)} - ${formatDate(pdt.endTime)}?`
                                                                )}
                                                                disabled={actionLoading}
                                                            >
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
                                    
                                    {session.status === 'realizada' && isCurrentUserTheAssignedMentor && (
                                        <>
                                            {editingSummarySessionId === session._id ? (
                                                <div>
                                                    <textarea value={summaryText} onChange={(e) => setSummaryText(e.target.value)} rows="3" style={{width: '100%', boxSizing: 'border-box', margin: '5px 0'}}/>
                                                    <button onClick={handleSaveSummary} disabled={actionLoading}>Guardar Resumen</button>
                                                    <button onClick={() => setEditingSummarySessionId(null)} style={{marginLeft: '5px'}} disabled={actionLoading}>Cancelar</button>
                                                </div>
                                            ) : (
                                                session.summaryMentor ? 
                                                <p><strong>Tu Resumen:</strong> <span className="text-block" style={{display:'block'}}>{session.summaryMentor}</span> <button onClick={() => handleOpenSummaryEditor(session)} style={{fontSize:'0.8em', padding:'3px 6px', marginLeft:'5px'}} disabled={actionLoading}>Editar</button></p> :
                                                <button onClick={() => handleOpenSummaryEditor(session)} style={{marginTop:'10px'}} disabled={actionLoading}>Añadir Resumen</button>
                                            )}
                                            {session.feedbackStudent && <p><strong>Feedback Estudiante:</strong> <span className="text-block" style={{display:'block'}}>{session.feedbackStudent}</span></p>}
                                        </>
                                    )}
                                    {isCurrentUserTheAssignedMentor && session.status === 'confirmada' && (
                                        <button 
                                            onClick={() => handleSessionAction(session._id, { status: 'realizada' }, "Sesión marcada como Realizada.", "¿Marcar esta sesión como Realizada?")} 
                                            style={{marginTop: '10px', backgroundColor:'lightgreen'}} 
                                            disabled={actionLoading}
                                        >
                                            Marcar como Realizada
                                        </button>
                                    )}
                                    {/* Botones para Cancelar Sesión (Mentor) */}
                                    {isCurrentUserTheAssignedMentor && (session.status === 'propuesta' || session.status === 'confirmada') && (
                                        <button 
                                            onClick={() => handleSessionAction(session._id, { status: 'cancelada_mentor' }, "Sesión cancelada.", "¿Cancelar esta sesión?")} 
                                            style={{marginTop: '10px', backgroundColor:'salmon', marginLeft: '5px'}} 
                                            disabled={actionLoading}
                                        >
                                            Cancelar Sesión
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                )}
                 <div style={{textAlign: 'center', marginTop: '20px'}}>
                    <Link to="/mentor-dashboard">
                        <button type="button" style={{backgroundColor: '#7f8c8d'}}>Volver al Panel de Mentor</button>
                    </Link>
                 </div>
            </div> {/* Fin ticket-body */}
        </div> /* Fin ticket-container */
    );
}

export default MentorMentorshipRequestDetailPage;