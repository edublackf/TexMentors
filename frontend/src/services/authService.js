import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth';

const forgotPassword = async (email) => {
    try {
        const response = await axios.post(`${API_URL}/forgot-password`, { email });
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