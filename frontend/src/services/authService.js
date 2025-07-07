import api from './api'; // Importa la instancia de Axios configurada

// Login
const login = (email, password) => {
    return api.post('/auth/login', { email, password });
};

// Registro
const register = (userData) => {
    return api.post('/auth/register', userData);
};

// Olvidé mi contraseña
const forgotPassword = (email) => {
    return api.post('/auth/forgot-password', { email });
};

// Resetear contraseña
const resetPassword = (token, password) => {
    // La petición es a /api/auth/reset-password/:token
    // Y el body contiene la nueva contraseña
    return api.put(`/auth/reset-password/${token}`, { password });
};

const authService = {
    login,
    register,
    forgotPassword,
    resetPassword,
};

export default authService;