import api from './api'; // <-- Importa la instancia centralizada de Axios

const forgotPassword = async (email) => {
    try {
        // La URL base (`.../api`) ya está en la instancia. Solo necesitas la parte específica.
        const response = await api.post('/auth/forgot-password', { email });
        return response.data;
    } catch (error) {
        console.error('Error al solicitar reseteo de contraseña:', error.response || error.message);
        throw error.response ? error.response.data : new Error('Error de red o del servidor');
    }
};

// Si tienes más funciones de auth como login o register aquí, también deberían usar `api`.
// Ejemplo:
const login = async (email, password) => {
    try {
        const response = await api.post('/auth/login', { email, password });
        return response.data;
    } catch (error) {
         console.error('Error al iniciar sesión:', error.response || error.message);
        throw error.response ? error.response.data : new Error('Error de red o del servidor');
    }
};


const authService = {
    forgotPassword,
    login, // Exportar si la tienes aquí
};

export default authService;