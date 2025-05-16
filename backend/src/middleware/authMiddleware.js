// backend/src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/userModel'); // Necesitamos User para verificar si el usuario aún existe

const protect = async (req, res, next) => {
    let token;

    // Los tokens JWT usualmente se envían en la cabecera Authorization con el esquema 'Bearer'
    // Ej: Authorization: Bearer <token>
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // 1. Obtener el token de la cabecera
            token = req.headers.authorization.split(' ')[1]; // "Bearer TOKEN" -> "TOKEN"

            // 2. Verificar el token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // 3. Obtener el usuario del token y añadirlo al objeto req
            // No queremos la contraseña, incluso si está hasheada
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                // Si el usuario asociado al token ya no existe (ej. fue eliminado)
                return res.status(401).json({ message: 'No autorizado, usuario no encontrado.' });
            }
            
            // Si el usuario está marcado como eliminado lógicamente
            if (req.user.isDeleted) {
                return res.status(401).json({ message: 'No autorizado, cuenta de usuario inactiva.' });
            }


            next(); // Pasar al siguiente middleware o al controlador de la ruta
        } catch (error) {
            console.error('Error de autenticación:', error.message);
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ message: 'No autorizado, token inválido.' });
            }
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'No autorizado, token expirado.' });
            }
            res.status(401).json({ message: 'No autorizado, token falló.' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'No autorizado, no se proporcionó token.' });
    }
};

// Middleware para restringir acceso basado en roles (opcional, pero útil)
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.rol)) {
            return res.status(403).json({ message: `Acceso denegado. Se requiere rol: ${roles.join(' o ')}.` });
        }
        next();
    };
};


module.exports = { protect, authorize };