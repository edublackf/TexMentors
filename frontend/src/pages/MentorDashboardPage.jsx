import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import mentorshipRequestService from '../services/mentorshipRequestService';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import ConfirmationModal from '../components/ui/ConfirmationModal';

// --- Funciones Helper (puedes moverlas a un archivo utils.js si las usas en múltiples sitios) ---
const formatStatusText = (status, type = 'request') => { /* ... como la definimos antes ... */
    if (!status) return 'Desconocido';
    const requestStatusMap = { /* ... */ };
    const sessionStatusMap = { /* ... */ };
    const roleMap = { /* ... */ };
    let map;
    if (type === 'request') map = requestStatusMap;
    else if (type === 'session') map = sessionStatusMap;
    else if (type === 'rol') map = roleMap;
    else map = {};
    return map[status] || status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const getStatusColorClass = (status) => { /* ... como la definimos antes ... */
    if (!status) return '#7f8c8d';
    if (status.includes('completada') || status.includes('realizada') || status.includes('aceptada')) return '#3498db';
    if (status.includes('cancelada') || status.includes('rechazada')) return '#e74c3c';
    if (status.includes('pendiente') || status.includes('propuesta')) return '#f39c12';
    if (status.includes('progreso') || status.includes('confirmada')) return '#2ecc71';
    if (status.includes('reprogramar')) return '#9b59b6';
    return '#7f8c8d';
};

const getRequestStatusDotClass = (status) => { // Similar a getStatusClass pero para los puntos de color CSS
    if (!status) return 'status-default';
    if (status.includes('completada') || status.includes('realizada') || status.includes('aceptada')) return 'status-completed';
    if (status.includes('cancelada') || status.includes('rechazada')) return 'status-rejected';
    if (status.includes('pendiente') || status.includes('propuesta')) return 'status-pending';
    if (status.includes('progreso') || status.includes('confirmada')) return 'status-active';
    if (status.includes('reprogramar')) return 'status-reprogramar'; // Necesitarías definir .status-reprogramar en CSS
    return 'status-default';
};
// --- Fin Funciones Helper ---


function MentorDashboardPage() {
    const { currentUser } = useAuth();
    const navigate = useNavigate(); // Para navegar a detalles
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

    const fetchMentorRequests = useCallback(async () => {
        if (!currentUser) return;
        try {
            setLoading(true);
            const data = await mentorshipRequestService.getAllRequests(); // Backend filtra para mentor
            setRequests(data);
        } catch (err) {
            toast.error(err.message || 'Error al cargar tus asignaciones de mentoría.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        fetchMentorRequests();
    }, [fetchMentorRequests]);

    const handleUpdateRequestStatus = async (requestId, newStatus, requestTitle) => {
    setModalState({
      isOpen: true,
      title: `Confirmar Acción`,
      message: `¿Estás seguro de que quieres "${newStatus === 'aceptada_mentor' ? 'aceptar' : 'rechazar'}" la solicitud "${requestTitle}"?`,
      onConfirm: async () => {
        setModalState({ isOpen: false }); // Cerrar modal antes de la acción
        try {
            setLoading(true);
            const response = await mentorshipRequestService.updateRequest(requestId, { status: newStatus });
            toast.success(response.message || `Solicitud actualizada.`);
            await fetchMentorRequests();
        } catch (err) {
            toast.error(err.message || `Error al actualizar la solicitud.`);
        } finally {
            setLoading(false);
        }
      }
    });
  };

  const handleCloseModal = () => {
    setModalState({ isOpen: false });
  };
    
    const handleRequestCardClick = (requestId) => {
        navigate(`/mentor-dashboard/requests/${requestId}`);
    };

    if (loading && requests.length === 0) {
        return <p>Cargando asignaciones...</p>;
    }

    // Botones de acción condicionales para el mentor
    const renderActionButtons = (req) => {
        if (!currentUser || req.isDeleted) return null;

        const isAssignedToMe = req.mentorUser?._id === currentUser.id;
        const isPendingAndUnassigned = req.status === 'pendiente' && !req.mentorUser;



        if (isAssignedToMe) {
            if (req.status === 'pendiente') {
                return (
                    <>
                        <button onClick={(e) => { e.stopPropagation(); handleUpdateRequestStatus(req._id, 'aceptada_mentor', req.title)}} style={{backgroundColor: 'lightgreen'}}>Aceptar</button>
                        <button onClick={(e) => { e.stopPropagation(); handleUpdateRequestStatus(req._id, 'rechazada_mentor', req.title)}} style={{backgroundColor: 'salmon', marginLeft: '5px'}}>Rechazar</button>
                    </>
                );
            }
            if (req.status === 'aceptada_mentor') {
                 return (
                    <>
                        <button onClick={(e) => { e.stopPropagation(); handleUpdateRequestStatus(req._id, 'en_progreso', req.title)}} style={{backgroundColor: 'lightblue'}}>Iniciar Progreso</button>
                        <button onClick={(e) => { e.stopPropagation(); handleUpdateRequestStatus(req._id, 'cancelada_mentor', req.title)}} style={{backgroundColor: 'grey', color:'white', marginLeft: '5px'}}>Cancelar</button>
                    </>
                 );
            }
            if (req.status === 'en_progreso') {
                 return (
                    <>
                        <button onClick={(e) => { e.stopPropagation(); handleUpdateRequestStatus(req._id, 'completada', req.title)}} style={{backgroundColor: 'lightgreen'}}>Completar</button>
                        <button onClick={(e) => { e.stopPropagation(); handleUpdateRequestStatus(req._id, 'cancelada_mentor', req.title)}} style={{backgroundColor: 'grey', color:'white', marginLeft: '5px'}}>Cancelar</button>
                    </>
                 );
            }
        } else if (isPendingAndUnassigned && req.status === 'pendiente') { // Mentor puede tomar una pendiente sin asignar
            return (
                <button onClick={(e) => { e.stopPropagation(); handleUpdateRequestStatus(req._id, 'aceptada_mentor', req.title)}} style={{backgroundColor: 'orange', color: 'white'}}>Tomar Solicitud</button>
            );
        }
        return null; // No hay acciones para otros casos en esta vista de lista
    };


    return (
        <div>
            <h2>Panel de Mentor - Mis Mentorías</h2>
            
            {loading && requests.length > 0 && <p>Actualizando lista...</p>}

            {requests.length === 0 && !loading ? (
                <p>No tienes solicitudes de mentoría asignadas o pendientes por tomar en este momento.</p>
            ) : (
                <ul className="item-list">
                    {requests.map((req) => (
                        <li 
                            key={req._id} 
                            className="item-list-row"
                            onClick={() => handleRequestCardClick(req._id)}
                            style={{ 
                                cursor: 'pointer',
                                opacity: req.isDeleted ? 0.6 : 1,
                                borderLeft: `5px solid ${getStatusColorClass(req.status)}`
                            }}
                            title="Ver detalles de la solicitud"
                        >
                            <div className="item-field" style={{flexBasis: '35%', flexGrow: 2}}>
                                <span style={{fontSize: '1.1em', fontWeight: 'bold', color: '#2c3e50'}}>{req.title}</span>
                                <span style={{fontSize: '0.9em', color: '#7f8c8d', display: 'block'}}>
                                    Tipo: {req.helpType?.name || 'N/A'}
                                </span>
                            </div>
                            <div className="item-field" style={{flexBasis: '25%'}}>
                                <strong>Estudiante:</strong>
                                <span>{req.studentUser?.nombre} {req.studentUser?.apellido || ''}</span>
                            </div>
                             <div className="item-field" style={{flexBasis: '20%'}}>
                                <strong>Estado:</strong>
                                <span>
                                    <span className={`status-dot ${getRequestStatusDotClass(req.status)}`}></span>
                                    {formatStatusText(req.status, 'request')}
                                </span>
                            </div>
                            <div className="item-field item-actions" style={{flexBasis: '20%', textAlign: 'right'}}>
                                {renderActionButtons(req)}
                                {req.isDeleted && <span style={{color: '#e74c3c', fontStyle: 'italic'}}>(Eliminada)</span>}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
            <ConfirmationModal
            isOpen={modalState.isOpen}
            onClose={handleCloseModal}
            onConfirm={modalState.onConfirm}
            title={modalState.title}
            message={modalState.message}
        />
        </div>
    );
}

export default MentorDashboardPage;