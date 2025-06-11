import axios from 'axios';

//const API_URL = 'http://localhost:5000/api/users'; // URL base para los endpoints de usuarios
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'; // Fallback a localhost
const API_URL = `${API_BASE_URL}/api/users`;
const USERS_API_URL = `${API_BASE_URL}/api/users`;




// El token JWT ya debería estar siendo adjuntado automáticamente por Axios
// gracias a la configuración en AuthContext.

// Obtener todos los usuarios (requiere token de admin)
const getAllUsers = async () => {
    try {
        const response = await axios.get(USERS_API_URL);
        return response.data;
    } catch (error) {
        console.error('Error al obtener todos los usuarios:', error.response || error.message);
        throw error.response ? error.response.data : new Error('Error de red o del servidor');
    }
};

// Obtener un usuario por ID (requiere token de admin)
const getUserById = async (userId) => {
    try {
        const response = await axios.get(`${API_URL}/${userId}`);
        return response.data;
    } catch (error) {
        console.error(`Error al obtener el usuario ${userId}:`, error.response || error.message);
        throw error.response ? error.response.data : new Error('Error de red o del servidor');
    }
};

// Actualizar un usuario (requiere token de admin)
const updateUser = async (userId, userData) => {
    try {
        const response = await axios.put(`${API_URL}/${userId}`, userData);
        return response.data;
    } catch (error) {
        console.error(`Error al actualizar el usuario ${userId}:`, error.response || error.message);
        throw error.response ? error.response.data : new Error('Error de red o del servidor');
    }
};

// Eliminar (lógicamente) un usuario (requiere token de admin)
const deleteUser = async (userId) => {
    try {
        const response = await axios.delete(`${API_URL}/${userId}`);
        return response.data;
    } catch (error) {
        console.error(`Error al eliminar el usuario ${userId}:`, error.response || error.message);
        throw error.response ? error.response.data : new Error('Error de red o del servidor');
    }
};

// Podríamos añadir una función para crear usuarios desde el panel admin si es necesario,
// pero el registro ya lo maneja authService (o directamente el componente de registro).

const userService = {
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
};

export default userService;