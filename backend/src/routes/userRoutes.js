// backend/src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { 
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    getMyProfile,
    updateMyProfile
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Aplicar middleware 'protect' a todas las rutas de usuarios (deben estar logueados)
router.use(protect);

router.route('/profile/me')
    .get(getMyProfile)
    .put(updateMyProfile);

router.route('/')
    .get(authorize('admin'), getAllUsers);
    

router.route('/:id')
    .get(authorize('admin'), getUserById)
    .put(authorize('admin'), updateUser)
    .delete(authorize('admin'), deleteUser);

module.exports = router;