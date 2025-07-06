// backend/src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe, forgotPassword, resetPassword   } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware'); 

// Rutas públicas
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);
router.get('/me', protect, getMe);



module.exports = router;