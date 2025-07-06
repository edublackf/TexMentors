import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const AUTH_API_URL = `${API_BASE_URL}/api/auth`;


const forgotPassword = async (email) => {
    try {
        // Asegúrate de que estás llamando a la URL correcta y completa
        // Debería ser algo como 'https://texmentors-backend.onrender.com/api/auth/forgot-password'
        console.log("Intentando llamar a:", `${AUTH_API_URL}/forgot-password`); // <-- Añade este log para depurar
        const response = await axios.post(`${AUTH_API_URL}/forgot-password`, { email });
        return response.data;
    } catch (error) {
        console.error('Error al solicitar reseteo de contraseña:', error.response || error.message);
        throw error.response ? error.response.data : new Error('Error de red o del servidor');
    }
};

const authService = {
    forgotPassword

};

export default authService;