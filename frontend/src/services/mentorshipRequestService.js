import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const REQUESTS_API_URL = `${API_BASE_URL}/api/mentorship-requests`; // Construir la URL completa
const API_URL = `${import.meta.env.VITE_API_BASE_URL}/mentorship-requests`;

// El token JWT ya debería estar siendo adjuntado automáticamente por Axios.

// Crear una nueva solicitud de mentoría (estudiante)
const createRequest = async (requestData) => {
    try {
        const response = await axios.post(REQUESTS_API_URL, requestData);
        return response.data;
    } catch (error) {
        console.error('Error al crear la solicitud de mentoría:', error.response || error.message);
        throw error.response ? error.response.data : new Error('Error de red o del servidor');
    }
};

// Obtener todas las solicitudes (el backend filtra según el rol del usuario logueado)
const getAllRequests = async () => {
    try {
        const response = await axios.get(REQUESTS_API_URL);
        return response.data;
    } catch (error) {
        console.error('Error al obtener las solicitudes de mentoría:', error.response || error.message);
        throw error.response ? error.response.data : new Error('Error de red o del servidor');
    }
};

// Obtener una solicitud por ID (el backend verifica permisos según rol)
const getRequestById = async (requestId) => {
    try {
        const response = await axios.get(`${REQUESTS_API_URL}/${requestId}`);
        return response.data;
    } catch (error) {
        console.error(`Error al obtener la solicitud ${requestId}:`, error.response || error.message);
        throw error.response ? error.response.data : new Error('Error de red o del servidor');
    }
};

// Actualizar una solicitud (estado, etc. - la lógica de permisos está en el backend)
const updateRequest = async (requestId, updateData) => {
    try {
        const response = await axios.put(`${REQUESTS_API_URL}/${requestId}`, updateData);
        return response.data;
    } catch (error) {
        console.error(`Error al actualizar la solicitud ${requestId}:`, error.response || error.message);
        throw error.response ? error.response.data : new Error('Error de red o del servidor');
    }
};

// Eliminar (lógicamente) una solicitud (la lógica de permisos está en el backend)
const deleteRequest = async (requestId) => {
    try {
        const response = await axios.delete(`${REQUESTS_API_URL}/${requestId}`);
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