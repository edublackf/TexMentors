import api from './api'; // <-- Importa la instancia centralizada de Axios

const API_ENDPOINT = '/mentorship-requests'; // Ruta relativa para esta entidad

const createRequest = async (requestData) => {
    try {
        const response = await api.post(API_ENDPOINT, requestData);
        return response.data;
    } catch (error) {
        console.error('Error al crear la solicitud de mentoría:', error.response || error.message);
        throw error.response ? error.response.data : new Error('Error de red o del servidor');
    }
};

const getAllRequests = async () => {
    try {
        const response = await api.get(API_ENDPOINT);
        return response.data;
    } catch (error) {
        console.error('Error al obtener las solicitudes de mentoría:', error.response || error.message);
        throw error.response ? error.response.data : new Error('Error de red o del servidor');
    }
};

const getRequestById = async (requestId) => {
    try {
        const response = await api.get(`${API_ENDPOINT}/${requestId}`);
        return response.data;
    } catch (error) {
        console.error(`Error al obtener la solicitud ${requestId}:`, error.response || error.message);
        throw error.response ? error.response.data : new Error('Error de red o del servidor');
    }
};

const updateRequest = async (requestId, updateData) => {
    try {
        const response = await api.put(`${API_ENDPOINT}/${requestId}`, updateData);
        return response.data;
    } catch (error) {
        console.error(`Error al actualizar la solicitud ${requestId}:`, error.response || error.message);
        throw error.response ? error.response.data : new Error('Error de red o del servidor');
    }
};

const deleteRequest = async (requestId) => {
    try {
        const response = await api.delete(`${API_ENDPOINT}/${requestId}`);
        return response.data;
    } catch (error) {
        console.error(`Error al eliminar la solicitud ${requestId}:`, error.response || error.message);
        throw error.response ? error.response.data : new Error('Error de red o del servidor');
    }
};

const mentorshipRequestService = {
    createRequest,
    getAllRequests,
    getRequestById,
    updateRequest,
    deleteRequest,
};

export default mentorshipRequestService;