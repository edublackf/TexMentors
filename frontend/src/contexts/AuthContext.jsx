import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios'; // Lo usaremos para configurar el interceptor

// URL base de la API, podría estar en un archivo de configuración
//const API_BASE_URL = 'http://localhost:5000/api'; 

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'; 

const AuthContext = createContext(null);

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true); // Para saber si estamos verificando el token inicial
    const [token, setToken] = useState(localStorage.getItem('texmentorUserToken') || null);

    // Configurar Axios para enviar el token en las cabeceras
    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            localStorage.setItem('texmentorUserToken', token); // Asegura que esté en localStorage
        } else {
            delete axios.defaults.headers.common['Authorization'];
            localStorage.removeItem('texmentorUserToken');
        }
    }, [token]);

    // Efecto para cargar el usuario al iniciar la app si hay un token
    useEffect(() => {
        const verifyUserToken = async () => {
            if (token) {
                try {
                    console.log("Verificando token al inicio con URL:", `${API_BASE_URL}/api/auth/me`);
                    const response = await axios.get(`${API_BASE_URL}/api/auth/me`); 
                    console.log("responde personal data", response);
                    setCurrentUser({
                        id: response.data._id,
                        nombre: response.data.nombre,
                        apellido: response.data.apellido,
                        carrera: response.data.carrera,
                        cicloActual: response.data.cicloActual,
                        especialidades: response.data.especialidades || [],
                        email: response.data.email,
                        rol: response.data.rol,
                        fotoPerfilUrl: response.data.fotoPerfilUrl,
                        token: token 
                    });
                } catch (error) {
                    console.error("Token inválido o expirado, limpiando:", error.response || error.message);
                    setToken(null); 
                    setCurrentUser(null);
                }
            }
            setLoading(false);
        };
        verifyUserToken();
    }, [token]);

    const login = async (email, password) => {
        // La lógica de login ya está en LoginForm, pero podría moverse aquí
        // para centralizar. Por ahora, LoginForm actualiza el token y localStorage,
        // lo que disparará el useEffect de este contexto.
        // Opcionalmente, esta función podría llamar al servicio y luego setToken.
        try {
            console.log("Intentando login con URL:", `${API_BASE_URL}/api/auth/login`);
            const response = await axios.post(`${API_BASE_URL}/api/auth/login`, { email, password });
            if (response.data.token) {
                setToken(response.data.token); // Esto actualiza el token en localStorage y el header de axios
                setCurrentUser({ // Guardamos la info del usuario y el token
                    id: response.data._id,
                    nombre: response.data.nombre,
                    email: response.data.email,
                    rol: response.data.rol,
                    fotoPerfilUrl: response.data.fotoPerfilUrl,
                    token: response.data.token
                });
                return response.data; // Devolver datos para la redirección en LoginForm
            }
        } catch (error) {
            console.error("Error de login en AuthContext:", error.response ? error.response.data : error.message);
            throw error; // Re-lanzar para que LoginForm lo maneje
        }
    };

    const logout = () => {
        setCurrentUser(null);
        setToken(null); // Esto limpiará el token de localStorage y de los headers de axios
        // Opcional: llamar a un endpoint de logout en el backend si invalida tokens del lado del servidor
        console.log("Usuario deslogueado");
    };

    const value = {
        currentUser,
        setCurrentUser, // Podría ser útil si actualizamos perfil
        token,
        setToken, // Para que LoginForm pueda setearlo directamente
        login,    // Ofrecer la función de login desde el contexto
        logout,
        loading // Para saber si aún se está verificando el token inicial
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children} 
        </AuthContext.Provider>
    );
};