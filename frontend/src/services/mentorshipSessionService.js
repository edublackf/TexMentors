import api from './api'; // <-- Importa la instancia centralizada de Axios

const API_ENDPOINT = '/sessions'; // Ruta relativa para esta entidad
//const VITE_SERVER_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const createSession = async (sessionData) => {
    try {
        const response = await api.post(API_ENDPOINT, sessionData);
        return response.data;
    } catch (error) {
        console.error('Error al crear la sesión de mentoría:', error.response || error.message);
        throw error.response ? error.response.data : new Error('Error de red o del servidor');
    }
};

const getSessionsForRequest = async (mentorshipRequestId) => {
    try {
        const response = await api.get(`${API_ENDPOINT}/request/${mentorshipRequestId}`);
        return response.data;
    } catch (error) {
        console.error(`Error al obtener sesiones para la solicitud ${mentorshipRequestId}:`, error.response || error.message);
        throw error.response ? error.response.data : new Error('Error de red o del servidor');
    }
};

const updateSession = async (sessionId, updateData) => {
    try {
        const response = await api.put(`${API_ENDPOINT}/${sessionId}`, updateData);
        return response.data;
    } catch (error) {
        console.error(`Error al actualizar la sesión ${sessionId}:`, error.response || error.message);
        throw error.response ? error.response.data : new Error('Error de red o del servidor');
    }
};

const mentorshipSessionService = {
    createSession,
    getSessionsForRequest,
    updateSession,
};

export default mentorshipSessionService;