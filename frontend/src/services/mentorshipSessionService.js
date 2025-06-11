import axios from 'axios';

// URL base para los endpoints de sesiones de mentoría
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const SESSIONS_API_URL = `${API_BASE_URL}/api/sessions`; 

// El token JWT se adjunta automáticamente por el interceptor de Axios configurado en AuthContext.

// Crear/Proponer una nueva sesión de mentoría
const createSession = async (sessionData) => {
    // sessionData debe incluir: mentorshipRequestId, proposedDateTimes, locationOrLink (opcional)
    try {
        const response = await axios.post(SESSIONS_API_URL, sessionData);
        return response.data; // Debería ser { message: '...', session: {...} }
    } catch (error) {
        console.error('Error al crear la sesión de mentoría:', error.response || error.message);
        throw error.response ? error.response.data : new Error('Error de red o del servidor al crear sesión');
    }
};

// Obtener todas las sesiones para una Solicitud de Mentoría específica
const getSessionsForRequest = async (mentorshipRequestId) => {
    try {
        // El endpoint es /api/sessions/request/:requestId
        const response = await axios.get(`${SESSIONS_API_URL}/request/${mentorshipRequestId}`);
        return response.data; // Debería ser un array de sesiones
    } catch (error) {
        console.error(`Error al obtener sesiones para la solicitud ${mentorshipRequestId}:`, error.response || error.message);
        throw error.response ? error.response.data : new Error('Error de red o del servidor al obtener sesiones');
    }
};

// Obtener una sesión específica por su ID (si necesitamos un detalle de sesión individual)
const getSessionById = async (sessionId) => {
    try {
        const response = await axios.get(`${SESSIONS_API_URL}/${sessionId}`);
        return response.data;
    } catch (error) {
        console.error(`Error al obtener la sesión ${sessionId}:`, error.response || error.message);
        throw error.response ? error.response.data : new Error('Error de red o del servidor al obtener sesión');
    }
};

// Actualizar una sesión de mentoría (confirmar, cambiar estado, añadir resumen/feedback, etc.)
const updateSession = async (sessionId, updateData) => {
    // updateData podría ser: { status, confirmedDateTime, summaryMentor, feedbackStudent, locationOrLink }
    try {
        const response = await axios.put(`${SESSIONS_API_URL}/${sessionId}`, updateData);
        return response.data; // Debería ser { message: '...', session: {...} }
    } catch (error) {
        console.error(`Error al actualizar la sesión ${sessionId}:`, error.response || error.message);
        throw error.response ? error.response.data : new Error('Error de red o del servidor al actualizar sesión');
    }
};

// Eliminar (lógicamente) una sesión de mentoría (si se implementa esta funcionalidad)
const deleteSession = async (sessionId) => {
    try {
        const response = await axios.delete(`${SESSIONS_API_URL}/${sessionId}`);
        return response.data; // Debería ser { message: '...' }
    } catch (error) {
        console.error(`Error al eliminar la sesión ${sessionId}:`, error.response || error.message);
        throw error.response ? error.response.data : new Error('Error de red o del servidor al eliminar sesión');
    }
};


const mentorshipSessionService = {
    createSession,
    getSessionsForRequest,
    getSessionById, // Añadido por completitud
    updateSession,
    deleteSession,  // Añadido por completitud, aunque no lo usemos aún
};

export default mentorshipSessionService;