// backend/src/controllers/authController.js
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); 

const sendEmail = require('../utils/email');
const crypto = require('crypto');

// Función para generar el token JWT
const generateToken = (id, rol) => {
    return jwt.sign({ id, rol }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '1d', 
    });
};

// @desc    Registrar un nuevo usuario
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
    // Solo se toman estos campos del body para el auto-registro de estudiantes
    const { nombre, apellido, email, password, carrera, cicloActual } = req.body;

    // Validaciones básicas de campos requeridos para estudiantes
    if (!nombre || !apellido || !email || !password) {
        return res.status(400).json({ message: 'Nombre, apellido, email y contraseña son obligatorios.' });
    }
   

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'El email ya está registrado.' });
        }

        const user = await User.create({
            nombre,
            apellido,
            email,
            password, // Se hashea en el pre-save del modelo
            rol: 'estudiante', // <--- FORZAR SIEMPRE A 'estudiante'
            carrera: carrera || '', // Hacer opcional o validar
            cicloActual: cicloActual || '', // Hacer opcional o validar
            isVerified: false 
        });

        if (user) {
            const token = generateToken(user._id, user.rol); 
            res.status(201).json({
                _id: user._id,
                nombre: user.nombre,
                apellido: user.apellido,
                email: user.email,
                rol: user.rol,
                token: token, 
                message: 'Usuario estudiante registrado exitosamente. Por favor, inicie sesión.'
            });
        } else {
            res.status(400).json({ message: 'Datos de usuario inválidos.' });
        }
    } catch (error) {
        console.error('Error en registerUser (estudiante):', error);
        res.status(500).json({ message: 'Error del servidor al registrar el usuario.', error: error.message });
    }
};

// @desc    Autenticar (login) un usuario
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Por favor, ingrese email y contraseña.' });
    }

    try {
        // 1. Buscar al usuario por email.
        // Es CRUCIAL usar .select('+password') porque en el modelo pusimos `select: false` para la contraseña.
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ message: 'Credenciales inválidas (email no encontrado).' });
        }

        // 2. Comparar la contraseña ingresada con la almacenada (hasheada)
        // user.comparePassword es el método que definimos en userModel.js
        const isMatch = await user.comparePassword(password);

        if (user && isMatch) {
            // 3. Generar token y enviar respuesta
            const token = generateToken(user._id, user.rol);
            res.status(200).json({
                _id: user._id,
                nombre: user.nombre,
                apellido: user.apellido,
                email: user.email,
                rol: user.rol,
                fotoPerfilUrl: user.fotoPerfilUrl,
                carrera: user.carrera,
                cicloActual: user.cicloActual,
                token: token,
                message: 'Inicio de sesión exitoso.'
            });
        } else {
            // Si user existe pero isMatch es false, o si user no existe (ya cubierto arriba pero por si acaso)
            res.status(401).json({ message: 'Credenciales inválidas (contraseña incorrecta).' });
        }
    } catch (error) {
        console.error('Error en loginUser:', error);
        res.status(500).json({ message: 'Error del servidor al iniciar sesión.', error: error.message });
    }
};

// @desc    Obtener el perfil del usuario actualmente logueado (ejemplo de ruta protegida)
// @route   GET /api/auth/me
// @access  Private (requiere token)
// (Necesitaremos un middleware de autenticación para proteger esta ruta)
exports.getMe = async (req, res) => {

    try {

        const user = await User.findById(req.user.id).select('-password'); // Excluimos explícitamente por si acaso

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }
        console.log('Usuario encontrado desde backend:', user);
        res.status(200).json({
            _id: user._id,
            nombre: user.nombre,
            apellido: user.apellido,
            email: user.email,
            rol: user.rol,
            fotoPerfilUrl: user.fotoPerfilUrl,
            carrera: user.carrera,
            cicloActual: user.cicloActual,
            especialidades: user.especialidades || [],
        });
    } catch (error) {
        console.error('Error en getMe:', error);
        res.status(500).json({ message: 'Error del servidor al obtener el perfil.', error: error.message });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        // 1) Obtener usuario basado en el email enviado
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
 
            return res.status(200).json({ message: 'Si un usuario con ese email existe, se le enviará un enlace para resetear la contraseña.' });
        }

        // 2) Generar el token de reseteo aleatorio (usando el método del modelo)
        const resetToken = user.createPasswordResetToken();
        await user.save({ validateBeforeSave: false }); // Guardar el usuario con el token hasheado y la expiración. Desactivar validaciones para no tener problemas con otros campos required.

        // 3) Enviar el token de vuelta al email del usuario
        const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
        // Para desarrollo, si el frontend corre en otro puerto (ej. 5173):
        const frontendURL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

        // Log para depuración
console.log('CONSTRUYENDO URL DE RESETEO:', frontendURL);

        const message = `¿Olvidaste tu contraseña? Envía una petición PUT con tu nueva contraseña a esta URL: ${frontendURL}.\nSi no olvidaste tu contraseña, por favor ignora este email.`;
        const htmlMessage = `<p>¿Olvidaste tu contraseña? Haz clic <a href="${frontendURL}">aquí</a> para establecer una nueva.</p><p>El enlace es válido por 10 minutos.</p><p>Si no olvidaste tu contraseña, por favor ignora este email.</p>`;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Tu token para resetear la contraseña (válido por 10 min)',
                message: message,
                html: htmlMessage,
            });

            res.status(200).json({
                message: 'Token enviado al correo electrónico!'
            });
        } catch (emailError) {
            // Si el email falla, debemos limpiar el token de la DB para evitar que el usuario quede en un estado inconsistente.
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save({ validateBeforeSave: false });
            
            return res.status(500).json({ message: 'Hubo un error enviando el email. Por favor, inténtelo de nuevo más tarde.' });
        }

    } catch (error) {
        console.error('ERROR EN FORGOT PASSWORD:', error);
        res.status(500).json({ message: 'Ocurrió un error en servidor.' });
    }
};

// @desc    Resetear contraseña
// @route   PUT /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res) => {
    try {
        // 1) Obtener el token (sin hashear) del parámetro de la URL
        const resetToken = req.params.token;
        // 2) Hashear el token para poder buscarlo en la DB
        const hashedToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        // 3) Buscar al usuario por el token hasheado y verificar que no ha expirado
        const user = await User.findOne({ 
            passwordResetToken: hashedToken, 
            passwordResetExpires: { $gt: Date.now() } // $gt (greater than)
        });
        
        // 4) Si el token es inválido o ha expirado, enviar error
        if (!user) {
            return res.status(400).json({ message: 'El token es inválido o ha expirado.' });
        }

        // 5) Si el token es válido, actualizar la contraseña
        user.password = req.body.password; // El middleware pre-save de userModel se encargará de hashearla
        user.passwordResetToken = undefined; // Limpiar el token
        user.passwordResetExpires = undefined; // Limpiar la expiración
        
        await user.save(); // Guardar el usuario con la nueva contraseña

        // 6) (Opcional) Loguear al usuario automáticamente y enviarle un nuevo token JWT
        // Por simplicidad, por ahora solo confirmamos el reseteo.
        
        res.status(200).json({ message: 'Contraseña actualizada exitosamente.' });

    } catch (error) {
        console.error('ERROR EN RESET PASSWORD:', error);
        res.status(500).json({ message: 'Ocurrió un error en el servidor.' });
    }
};