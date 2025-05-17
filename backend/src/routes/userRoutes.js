// backend/src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById, updateUser, deleteUser   } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Aplicar middleware 'protect' a todas las rutas de usuarios (deben estar logueados)
router.use(protect);

// GET todos los usuarios (Solo Admin)
router.get('/', authorize('admin'), getAllUsers);

router.get('/:id', authorize('admin'), getUserById);

router.put('/:id', authorize('admin'), updateUser);

router.delete('/:id', authorize('admin'), deleteUser);

module.exports = router;