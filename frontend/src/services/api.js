import axios from 'axios';

// 1. Lee la variable de entorno para la URL base de la API.
//    Incluye el prefijo /api aquí.
//    Tiene un fallback a localhost para desarrollo si la variable no está definida.
const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

console.log("Axios está configurado para usar la URL base de API:", VITE_API_BASE_URL);

// 2. Crea una instancia de Axios con la configuración base.
const api = axios.create({
    baseURL: VITE_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    }
});

// 3. Configura un interceptor de peticiones (request interceptor).
//    Esta función se ejecuta ANTES de que cada petición sea enviada.
api.interceptors.request.use(
    (config) => {
        // Obtiene el token del localStorage en cada petición.
        const token = localStorage.getItem('texmentorUserToken');
        if (token) {
            // Si el token existe, lo añade a la cabecera Authorization.
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config; // Devuelve la configuración modificada para que la petición continúe.
    },
    (error) => {
        // Maneja errores en la configuración de la petición.
        return Promise.reject(error);
    }
);

export default api;