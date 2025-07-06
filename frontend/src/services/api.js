import axios from 'axios';

// 1. Lee la variable de entorno para la URL del SERVIDOR.
const VITE_SERVER_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

console.log("Servidor base para la API:", VITE_SERVER_URL);

// 2. Crea una instancia de Axios con la URL base de la API COMPLETA.
const api = axios.create({
    baseURL: `${VITE_SERVER_URL}/api`, // Añadimos /api aquí
    headers: {
        'Content-Type': 'application/json',
    }
});

// 3. Interceptor para el token (esto está bien, no cambia)
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('texmentorUserToken');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;