import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';


const USERS_API_URL = `${API_BASE_URL}/api/users`;




// Obtener todos los usuarios (requiere token de admin)
const getAllUsers = async (page = 1, limit = 10, search = '', role = '') => {
    try {
        const response = await axios.get(`${USERS_API_URL}?page=${page}&limit=${limit}&search=${search}&role=${role}`);
        // VERIFICAR ESTA LÍNEA
        return response.data; // <-- Debe devolver el objeto completo { users, page, totalPages, ... }
    } catch (error) {
        console.error('Error al obtener todos los usuarios:', error.response || error.message);
        throw error.response ? error.response.data : new Error('Error de red o del servidor');
    }
};

// Obtener un usuario por ID (requiere token de admin)
const getUserById = async (userId) => {
    try {
        const response = await axios.get(`${USERS_API_URL}/${userId}`);
        return response.data;
    } catch (error) {
        console.error(`Error al obtener el usuario ${userId}:`, error.response || error.message);
        throw error.response ? error.response.data : new Error('Error de red o del servidor');
    }
};

// Actualizar un usuario (requiere token de admin)
const updateUser = async (userId, userData) => {
    try {
        const response = await axios.put(`${USERS_API_URL}/${userId}`, userData);
        return response.data;
    } catch (error) {
        console.error(`Error al actualizar el usuario ${userId}:`, error.response || error.message);
        throw error.response ? error.response.data : new Error('Error de red o del servidor');
    }
};

// Eliminar (lógicamente) un usuario (requiere token de admin)
const deleteUser = async (userId) => {
    try {
        const response = await axios.delete(`${USERS_API_URL}/${userId}`);
        return response.data;
    } catch (error) {
        console.error(`Error al eliminar el usuario ${userId}:`, error.response || error.message);
        throw error.response ? error.response.data : new Error('Error de red o del servidor');
    }
};



const userService = {
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
};

export default userService;