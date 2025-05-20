import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// rolesPermitidos es un array opcional de roles, ej: ['admin', 'mentor']
const ProtectedRoute = ({ children, rolesPermitidos }) => {
    const { currentUser, loading } = useAuth();

    if (loading) {
        return <div>Cargando autenticación...</div>; // O un spinner
    }

    if (!currentUser) {
        // Usuario no logueado, redirigir a la página de login
        return <Navigate to="/login" replace />;
    }

    if (rolesPermitidos && rolesPermitidos.length > 0) {
        if (!rolesPermitidos.includes(currentUser.rol)) {
            // Usuario logueado pero no tiene el rol permitido, redirigir a una página de "No Autorizado" o a Home
            // Por ahora, redirigimos a Home como ejemplo.
            console.warn(`Acceso denegado para rol: ${currentUser.rol}. Roles permitidos: ${rolesPermitidos.join(', ')}`);
            return <Navigate to="/" replace />; // O a una página específica de "Acceso Denegado"
        }
    }

    // Si se pasa 'children', se renderiza 'children'.
    // Si no, se usa <Outlet /> para renderizar rutas anidadas (típico en layouts).
    return children ? children : <Outlet />;
};

export default ProtectedRoute;