import api from './api'; // <-- Importa la instancia centralizada de Axios

const API_ENDPOINT = '/helptypes'; // Ruta relativa para esta entidad
//const API_ENDPOINT = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const getAllHelpTypes = async () => {
    try {
        const response = await api.get(API_ENDPOINT);
        return response.data;
    } catch (error) {
        console.error('Error al obtener todos los tipos de ayuda:', error.response || error.message);
        throw error.response ? error.response.data : new Error('Error de red o del servidor');
    }
};

const getHelpTypeById = async (helpTypeId) => {
    try {
        const response = await api.get(`${API_ENDPOINT}/${helpTypeId}`);
        return response.data;
    } catch (error) {
        console.error(`Error al obtener el tipo de ayuda ${helpTypeId}:`, error.response || error.message);
        throw error.response ? error.response.data : new Error('Error de red o del servidor');
    }
};

const createHelpType = async (helpTypeData) => {
    try {
        const response = await api.post(API_ENDPOINT, helpTypeData);
        return response.data;
    } catch (error) {
        console.error('Error al crear el tipo de ayuda:', error.response || error.message);
        throw error.response ? error.response.data : new Error('Error de red o del servidor');
    }
};

const updateHelpType = async (helpTypeId, helpTypeData) => {
    try {
        const response = await api.put(`${API_ENDPOINT}/${helpTypeId}`, helpTypeData);
        return response.data;
    } catch (error) {
        console.error(`Error al actualizar el tipo de ayuda ${helpTypeId}:`, error.response || error.message);
        throw error.response ? error.response.data : new Error('Error de red o del servidor');
    }
};

const deleteHelpType = async (helpTypeId) => {
    try {
        const response = await api.delete(`${API_ENDPOINT}/${helpTypeId}`);
        return response.data;
    } catch (error) {
        console.error(`Error al eliminar el tipo de ayuda ${helpTypeId}:`, error.response || error.message);
        throw error.response ? error.response.data : new Error('Error de red o del servidor');
    }
};

const helpTypeService = {
    getAllHelpTypes,
    getHelpTypeById,
    createHelpType,
    updateHelpType,
    deleteHelpType,
};

export default helpTypeService;