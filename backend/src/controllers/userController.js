// backend/src/controllers/userController.js
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

// TODO: Añadir más funciones: getUserById, updateUser, deleteUser