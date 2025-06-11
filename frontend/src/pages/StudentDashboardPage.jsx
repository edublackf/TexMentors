import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // useNavigate para acciones
import mentorshipRequestService from '../services/mentorshipRequestService';
import { toast } from 'react-toastify'; // Para notificaciones

// Helper para clases de estado de solicitud
const getRequestStatusClass = (status) => {
    switch (status) {
        case 'pendiente': return 'status-pending'; // Naranja
        case 'aceptada_mentor':
        case 'confirmada': // (Estado de sesión, pero puede ser relevante para la solicitud)
        case 'en_progreso': return 'status-active'; // Verde
        case 'completada':
        case 'realizada': return 'status-completed'; // Celeste
        case 'rechazada_mentor':
        case 'rechazada_admin':
        case 'cancelada_estudiante':
        case 'cancelada_admin':
        case 'cancelada_mentor': return 'status-rejected'; // Rojo
        default: return '';
    }
};

const formatRequestStatus = (status) => {
    switch (status) {
        case 'pendiente': return 'Pendiente';
        case 'aceptada_mentor': return 'Aceptada por Mentor';
        case 'rechazada_mentor': return 'Rechazada por Mentor';
        case 'rechazada_admin': return 'Rechazada por Admin';
        case 'en_progreso': return 'En Progreso';
        case 'completada': return 'Finalizada';
        case 'cancelada_estudiante': return 'Cancelada por Ti';
        case 'cancelada_admin': return 'Cancelada por Admin';
        case 'cancelada_mentor': return 'Cancelada por Mentor';
        default: return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()); // Capitalizar por defecto
    }
};

function StudentDashboardPage() {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    // const [error, setError] = useState(''); // Usaremos toast

    const fetchStudentRequests = useCallback(async () => {
        try {
            setLoading(true);
            const data = await mentorshipRequestService.getAllRequests();
            setRequests(data);
        } catch (err) {
            toast.error(err.message || 'Error al cargar tus solicitudes de mentoría.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStudentRequests();
    }, [fetchStudentRequests]);

    const handleCancelRequest = async (requestId, requestTitle) => {
        const requestToCancel = requests.find(req => req._id === requestId);
        if (!requestToCancel || !['pendiente', 'aceptada_mentor'].includes(requestToCancel.status)) {
            toast.warn(`No puedes cancelar la solicitud "${requestTitle}" porque su estado es '${requestToCancel?.status || 'desconocido'}'.`);
            return;
        }

        if (window.confirm(`¿Estás seguro de que quieres cancelar tu solicitud "${requestTitle}"?`)) {
            try {
                setLoading(true); 
                const response = await mentorshipRequestService.updateRequest(requestId, { status: 'cancelada_estudiante' });
                toast.success(response.message || 'Solicitud cancelada exitosamente.');
                await fetchStudentRequests(); 
            } catch (err) {
                toast.error(err.message || 'Error al cancelar la solicitud.');
            } finally {
                setLoading(false);
            }
        }
    };
    
    // Navegar a detalles cuando se hace clic en la fila/tarjeta
    const handleRequestClick = (requestId) => {
        navigate(`/student-dashboard/requests/${requestId}`);
    };

    if (loading && requests.length === 0) {
        return <p>Cargando tus solicitudes...</p>;
    }

    return (
        <div>
            <h2>Mis Solicitudes de Mentoría</h2>
            <Link to="/student-dashboard/create-request">
                <button style={{ marginBottom: '20px' }}>Crear Nueva Solicitud</button>
            </Link>
            
            {loading && requests.length > 0 && <p>Actualizando lista...</p>}

            {requests.length === 0 && !loading ? (
                <p>Aún no has creado ninguna solicitud de mentoría.</p>
            ) : (
                <ul className="item-list">
                    {requests.map((req) => (
                        <li 
                            key={req._id} 
                            className="item-list-row" 
                            onClick={() => handleRequestClick(req._id)} // <-- Toda la fila es clickeable
                            style={{ 
                                cursor: 'pointer', // Indicar que es clickeable
                                opacity: req.isDeleted ? 0.6 : 1,
                                borderLeft: `5px solid ${
                                    req.status === 'completada' ? '#3498db'
                                    : req.status.includes('cancelada') || req.status.includes('rechazada') ? '#e74c3c'
                                    : req.status === 'pendiente' ? '#f39c12'
                                    : req.status === 'aceptada_mentor' || req.status === 'en_progreso' ? '#2ecc71'
                                    : '#bdc3c7'
                                }`
                            }}
                            title="Ver detalles de la solicitud"
                        >
                            {/* Columna 1: Título (sin etiqueta "Título:") y Tipo de Ayuda debajo */}
                            <div className="item-field" style={{flexBasis: '40%', flexGrow: 2, display: 'flex', flexDirection: 'column'}}>
                                <span style={{fontSize: '1.1em', fontWeight: 'bold', color: '#2c3e50'}}>{req.title}</span>
                                <span style={{fontSize: '0.9em', color: '#7f8c8d'}}>
                                    Tipo: {req.helpType?.name || 'N/A'}
                                </span>
                            </div>

                            {/* Columna 2: Mentor */}
                            <div className="item-field" style={{flexBasis: '25%'}}>
                                <strong>Mentor:</strong>
                                <span>{req.mentorUser?.nombre || 'Pendiente'} {req.mentorUser?.apellido || ''}</span>
                            </div>

                            {/* Columna 3: Estado */}
                            <div className="item-field" style={{flexBasis: '20%'}}>
                                <strong>Estado:</strong>
                                <span>
                                    <span className={`status-dot ${getRequestStatusClass(req.status)}`}></span>
                                    {formatRequestStatus(req.status)} {/* Usar función para formatear */}
                                </span>
                            </div>
                            
                            {/* Columna 4: Acciones */}
                            <div className="item-field item-actions" style={{flexBasis: '15%', textAlign: 'right'}}>
                                {['pendiente', 'aceptada_mentor'].includes(req.status) && !req.isDeleted && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation(); 
                                            handleCancelRequest(req._id, req.title);
                                        }}
                                        style={{ backgroundColor: 'orange', color: 'white' }}
                                        title="Cancelar esta solicitud"
                                    >
                                        Cancelar
                                    </button>
                                )}
                                {req.isDeleted && <span style={{color: '#e74c3c', fontStyle: 'italic'}}>(Eliminada)</span>}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default StudentDashboardPage;