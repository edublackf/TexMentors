// backend/src/controllers/userController.js
const mongoose = require('mongoose'); 
const User = require('../models/userModel');

// @desc    Obtener todos los usuarios (solo Admin)
// @route   GET /api/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
    try {
        // El middleware 'protect' ya verificó que es un usuario logueado.
        // El middleware 'authorize('admin')' (que añadiremos en la ruta) verificará que es admin.
        const users = await User.find({}).select('-password'); // Excluimos la contraseña
        res.status(200).json(users);
    } catch (error) {
        console.error('Error en getAllUsers:', error);
        res.status(500).json({ message: 'Error del servidor al obtener usuarios.', error: error.message });
    }
};

exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (user) {
            res.status(200).json(user);
        } else {
            // Es importante verificar si el ID tiene un formato válido de ObjectId de MongoDB
            // antes de asumir que no se encontró. Mongoose a veces maneja esto, pero
            // una verificación explícita puede ser útil.
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

        res.status(200).json({ message: 'Usuario eliminado (lógicamente) exitosamente.' });

    } catch (error) {
        console.error('Error en deleteUser:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de usuario con formato incorrecto.' });
        }
        res.status(500).json({ message: 'Error del servidor al eliminar el usuario.', error: error.message });
    }
};
