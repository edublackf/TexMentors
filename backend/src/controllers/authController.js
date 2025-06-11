// backend/src/controllers/authController.js
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // Ya lo tenemos, pero para confirmar

// Función para generar el token JWT
const generateToken = (id, rol) => {
    return jwt.sign({ id, rol }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '1d', // Usar variable de entorno o default
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
    // Puedes añadir más validaciones para carrera, cicloActual si son obligatorios para estudiantes

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
            isVerified: false // Podrías implementar verificación de email más adelante
        });

        if (user) {
            const token = generateToken(user._id, user.rol); // generateToken ya lo tenemos
            res.status(201).json({
                _id: user._id,
                nombre: user.nombre,
                apellido: user.apellido,
                email: user.email,
                rol: user.rol,
                // No enviar el token directamente en el registro público es una opción
                // Podrías solo enviar un mensaje de éxito y que luego hagan login.
                // O enviar el token para auto-loguearlos. Por ahora, lo mantenemos.
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
    // El middleware de autenticación (que crearemos luego) añadirá req.user
    // Aquí asumimos que req.user ya está disponible
    try {
        // Buscamos al usuario por el ID que el middleware de autenticación puso en req.user.id
        // No necesitamos .select('+password') porque no estamos lidiando con la contraseña aquí.
        const user = await User.findById(req.user.id).select('-password'); // Excluimos explícitamente por si acaso

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        res.status(200).json({
            _id: user._id,
            nombre: user.nombre,
            apellido: user.apellido,
            email: user.email,
            rol: user.rol,
            fotoPerfilUrl: user.fotoPerfilUrl,
            carrera: user.carrera,
            cicloActual: user.cicloActual,
        });
    } catch (error) {
        console.error('Error en getMe:', error);
        res.status(500).json({ message: 'Error del servidor al obtener el perfil.', error: error.message });
    }
};