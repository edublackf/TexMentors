import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const HELPTYPES_API_URL = `${API_BASE_URL}/api/helptypes`;

// Obtener todos los tipos de ayuda (puede ser accedido por cualquier usuario logueado)
const getAllHelpTypes = async () => {
    try {
        const response = await axios.get(HELPTYPES_API_URL);
        return response.data;
    } catch (error) {
        console.error('Error al obtener todos los tipos de ayuda:', error.response || error.message);
        throw error.response ? error.response.data : new Error('Error de red o del servidor');
    }
};

// Obtener un tipo de ayuda por ID (puede ser accedido por cualquier usuario logueado)
const getHelpTypeById = async (helpTypeId) => {
    try {
        const response = await axios.get(`${HELPTYPES_API_URL}/${helpTypeId}`);
        return response.data;
    } catch (error) {
        console.error(`Error al obtener el tipo de ayuda ${helpTypeId}:`, error.response || error.message);
        throw error.response ? error.response.data : new Error('Error de red o del servidor');
    }
};

// Crear un nuevo tipo de ayuda (requiere token de admin)
const createHelpType = async (helpTypeData) => {
    try {
        const response = await axios.post(HELPTYPES_API_URL, helpTypeData);
        return response.data;
    } catch (error) {
        console.error('Error al crear el tipo de ayuda:', error.response || error.message);
        throw error.response ? error.response.data : new Error('Error de red o del servidor');
    }
};

// Actualizar un tipo de ayuda (requiere token de admin)
const updateHelpType = async (helpTypeId, helpTypeData) => {
    try {
        const response = await axios.put(`${HELPTYPES_API_URL}/${helpTypeId}`, helpTypeData);
        return response.data;
    } catch (error) {
        console.error(`Error al actualizar el tipo de ayuda ${helpTypeId}:`, error.response || error.message);
        throw error.response ? error.response.data : new Error('Error de red o del servidor');
    }
};

// Eliminar (lógicamente) un tipo de ayuda (requiere token de admin)
const deleteHelpType = async (helpTypeId) => {
    try {
        const response = await axios.delete(`${HELPTYPES_API_URL}/${helpTypeId}`);
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