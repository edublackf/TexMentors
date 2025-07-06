import api from './api'; // <-- Importa la instancia centralizada de Axios

// Obtener todos los usuarios con paginación
const getAllUsers = async (page = 1, limit = 10, search = '', role = '') => {
    try {
        // El endpoint ahora es relativo a la baseURL de la instancia `api`
        const response = await api.get(`/users?page=${page}&limit=${limit}&search=${search}&role=${role}`);
        return response.data;
    } catch (error) {
        console.error('Error al obtener todos los usuarios:', error.response || error.message);
        throw error.response ? error.response.data : new Error('Error de red o del servidor');
    }
};

// Obtener un usuario por ID
const getUserById = async (userId) => {
    try {
        const response = await api.get(`/users/${userId}`);
        return response.data;
    } catch (error) {
        console.error(`Error al obtener el usuario ${userId}:`, error.response || error.message);
        throw error.response ? error.response.data : new Error('Error de red o del servidor');
    }
};

// Actualizar un usuario
const updateUser = async (userId, userData) => {
    try {
        const response = await api.put(`/users/${userId}`, userData);
        return response.data;
    } catch (error) {
        console.error(`Error al actualizar el usuario ${userId}:`, error.response || error.message);
        throw error.response ? error.response.data : new Error('Error de red o del servidor');
    }
};

// Eliminar (lógicamente) un usuario
const deleteUser = async (userId) => {
    try {
        const response = await api.delete(`/users/${userId}`);
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