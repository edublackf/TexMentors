// backend/src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { getAllUsers } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Aplicar middleware 'protect' a todas las rutas de usuarios (deben estar logueados)
router.use(protect);

// GET todos los usuarios (Solo Admin)
router.get('/', authorize('admin'), getAllUsers);

// TODO: Añadir más rutas: /:id (GET, PUT, DELETE)

module.exports = router;