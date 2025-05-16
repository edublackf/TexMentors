// backend/src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware'); // Crearemos este middleware pronto

// Rutas públicas
router.post('/register', registerUser);
router.post('/login', loginUser);

// Ruta protegida (ejemplo)
// Cuando una solicitud llegue a GET /api/auth/me, primero pasará por el middleware 'protect'
// y si el token es válido y el usuario es autenticado, entonces se ejecutará 'getMe'.
router.get('/me', protect, getMe);

module.exports = router;