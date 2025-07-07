// backend/src/controllers/userController.js
const mongoose = require('mongoose'); 
const User = require('../models/userModel');

// @desc    Obtener todos los usuarios (solo Admin)
// @route   GET /api/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
    try {
        // 1. Obtener y parsear los parámetros de la query de la URL
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const skip = (page - 1) * limit;

        // --- LÓGICA DE FILTROS ---
        const filter = { isDeleted: false }; // Filtro base
        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search, 'i'); // 'i' para case-insensitive
            // Buscar en múltiples campos
            filter.$or = [
                { nombre: searchRegex },
                { apellido: searchRegex },
                { email: searchRegex }
            ];
        }
        if (req.query.role) {
            filter.rol = req.query.role;
        }
        // 2. Ejecutar dos consultas en paralelo usando Promise.all para eficiencia
        const [users, totalUsers] = await Promise.all([
        User.find(filter)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        User.countDocuments(filter)
    ]);

        // 3. Enviar la respuesta con los datos de los usuarios y la información de paginación
        res.status(200).json({
            users,
            page,
            totalPages: Math.ceil(totalUsers / limit),
            totalUsers
        });
        
    } catch (error) {
        // En caso de cualquier error en las consultas, se captura aquí
        console.error('ERROR en getAllUsers (paginación):', error); 
        res.status(500).json({ 
            message: 'Error del servidor al obtener usuarios.', 
            error: error.message 
        });
    }
};


exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (user) {
            res.status(200).json(user);
        } else {

            if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
                 return res.status(400).json({ message: 'ID de usuario no válido.' });
            }
            res.status(404).json({ message: 'Usuario no encontrado.' });
        }
    } catch (error) {
        console.error('Error en getUserById:', error);
        // Si el ID no es un ObjectId válido, findById puede lanzar un error CastError
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de usuario con formato incorrecto.' });
        }
        res.status(500).json({ message: 'Error del servidor al obtener el usuario.', error: error.message });
    }
};

exports.updateUser = async (req, res) => {
    try {
        // Primero, verifica si el ID proporcionado es un ObjectId válido
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'ID de usuario no válido.' });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }
        
        // Si el usuario está marcado como eliminado lógicamente, quizás no quieras permitir actualizaciones
        // o manejarlo de una forma específica. Por ahora, permitiremos actualizarlo.
        // if (user.isDeleted) {
        //     return res.status(400).json({ message: 'No se puede actualizar un usuario eliminado.' });
        // }


        // Campos que un administrador puede actualizar.
        // No permitimos cambiar la contraseña directamente aquí para evitar complejidad,
        // eso podría ser una ruta separada o una lógica más específica.
        const { nombre, apellido, email, rol, carrera, cicloActual, isVerified, fotoPerfilUrl } = req.body;

        // Verificar si el email se está cambiando y si el nuevo email ya existe para OTRO usuario
        if (email && email !== user.email) {
            const existingUserWithEmail = await User.findOne({ email: email });
            if (existingUserWithEmail && existingUserWithEmail._id.toString() !== user._id.toString()) {
                return res.status(400).json({ message: 'El nuevo email ya está en uso por otro usuario.' });
            }
            user.email = email;
        }

        // Actualizar los campos si se proporcionan en el body
        if (nombre !== undefined) user.nombre = nombre;
        if (apellido !== undefined) user.apellido = apellido;
        if (rol !== undefined) user.rol = rol; // Asegurarse de que el rol sea válido según el enum del modelo
        if (carrera !== undefined) user.carrera = carrera;
        if (cicloActual !== undefined) user.cicloActual = cicloActual;
        if (isVerified !== undefined) user.isVerified = isVerified;
        if (fotoPerfilUrl !== undefined) user.fotoPerfilUrl = fotoPerfilUrl;
        // No actualizamos 'isDeleted' ni 'deletedAt' aquí, eso es para la función de delete.

        const updatedUser = await user.save(); // Esto disparará los hooks pre-save si los tuvieras para otros campos

        // Devolvemos el usuario actualizado sin la contraseña
        const userResponse = updatedUser.toObject(); // Convertir a objeto plano para poder eliminar la contraseña
        delete userResponse.password; // Aunque 'select: false' ya lo hace, es buena práctica ser explícito

        res.status(200).json({
            message: 'Usuario actualizado exitosamente.',
            user: userResponse
        });

    } catch (error) {
        console.error('Error en updateUser:', error);
        // Manejar errores de validación de Mongoose
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join('. ') });
        }
        // Manejar errores de CastError si el ID no es ObjectId (aunque ya lo validamos arriba)
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de usuario con formato incorrecto.' });
        }
        res.status(500).json({ message: 'Error del servidor al actualizar el usuario.', error: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'ID de usuario no válido.' });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        // No permitir eliminar (lógicamente) al propio usuario administrador que está haciendo la petición
        // req.user.id es el ID del admin logueado (inyectado por el middleware 'protect')
        if (user._id.toString() === req.user.id.toString()) {
            return res.status(400).json({ message: 'No puedes eliminar tu propia cuenta de administrador.' });
        }
        
        // Verificar si ya está eliminado lógicamente
        if (user.isDeleted) {
            return res.status(400).json({ message: 'El usuario ya ha sido eliminado previamente.' });
        }


        // Realizar la eliminación lógica
        user.isDeleted = true;
        user.deletedAt = new Date();
        await user.save(); // Guardar los cambios

        res.status(200).json({ message: 'Usuario eliminado  exitosamente.' });

    } catch (error) {
        console.error('Error en deleteUser:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de usuario con formato incorrecto.' });
        }
        res.status(500).json({ message: 'Error del servidor al eliminar el usuario.', error: error.message });
    }
};

exports.adminCreateUser = async (req, res) => {
    const { nombre, apellido, email, password, rol, carrera, cicloActual, especialidades, isVerified } = req.body;

    // Validaciones básicas
    if (!nombre || !apellido || !email || !password || !rol) {
        return res.status(400).json({ message: 'Nombre, apellido, email, contraseña y rol son obligatorios.' });
    }
    if (!['estudiante', 'mentor', 'admin'].includes(rol)) {
        return res.status(400).json({ message: 'Rol inválido.' });
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
            password, // Se hashea en el pre-save
            rol,      // El admin SÍ puede especificar el rol
            carrera: carrera || '',
            cicloActual: cicloActual || '',
            especialidades: rol === 'mentor' ? (especialidades || []) : [], // Solo para mentores
            isVerified: isVerified !== undefined ? isVerified : true // Admin puede decidir si verificarlo de inmediato
        });

        // No es necesario generar y devolver un token aquí, solo confirmar creación.
        // Quitamos la contraseña de la respuesta por seguridad.
        const userResponse = user.toObject();
        delete userResponse.password;

        res.status(201).json({
            message: `Usuario ${rol} creado exitosamente por el administrador.`,
            user: userResponse
        });

    } catch (error) {
        console.error('Error en adminCreateUser:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join('. ') });
        }
        res.status(500).json({ message: 'Error del servidor al crear el usuario.', error: error.message });
    }
};

// @desc    Obtener el perfil del usuario logueado
// @route   GET /api/users/profile/me
// @access  Private
exports.getMyProfile = async (req, res) => {
    // req.user es añadido por el middleware 'protect'
    // Buscamos al usuario por el ID del token y devolvemos sus datos
    try {
        const user = await User.findById(req.user.id).select('-password'); // Excluir la contraseña
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error('Error en getMyProfile:', error);
        res.status(500).json({ message: 'Error del servidor al obtener el perfil.', error: error.message });
    }
};

// @desc    Actualizar el perfil del usuario logueado
// @route   PUT /api/users/profile/me
// @access  Private
exports.updateMyProfile = async (req, res) => {
    try {
        // Campos que el usuario puede actualizar por sí mismo.
        // Excluimos explícitamente el 'rol' para que un usuario no pueda auto-promoverse.
        // La contraseña y el email se manejarían por separado para mayor seguridad (ej. pidiendo contraseña actual).
        const { nombre, apellido, carrera, cicloActual, especialidades, intereses, studentAvailability, fotoPerfilUrl } = req.body;
        
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        // Actualizar los campos si se proporcionan en el body
        user.nombre = nombre || user.nombre;
        user.apellido = apellido || user.apellido;
        user.carrera = carrera !== undefined ? carrera : user.carrera;
        user.cicloActual = cicloActual !== undefined ? cicloActual : user.cicloActual;
        user.fotoPerfilUrl = fotoPerfilUrl !== undefined ? fotoPerfilUrl : user.fotoPerfilUrl;

        // Campos específicos de rol
        if (user.rol === 'mentor' && especialidades !== undefined) {
            user.especialidades = especialidades;
        }
        if (user.rol === 'estudiante' && intereses !== undefined) {
            user.intereses = intereses;
        }

        // Si tienes más campos de perfil, puedes añadirlos aquí.
        
        const updatedUser = await user.save();

        // Devolvemos el usuario actualizado sin la contraseña
        const userResponse = updatedUser.toObject();
        delete userResponse.password;

        res.status(200).json({
            message: 'Perfil actualizado exitosamente.',
            user: userResponse
        });

    } catch (error) {
        console.error('Error en updateMyProfile:', error);
        res.status(500).json({ message: 'Error del servidor al actualizar el perfil.', error: error.message });
    }
};