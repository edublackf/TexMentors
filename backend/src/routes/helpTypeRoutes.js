// backend/src/routes/helpTypeRoutes.js
const express = require('express');
const router = express.Router();
const {
    createHelpType,
    getAllHelpTypes,
    getHelpTypeById,
    updateHelpType,
    deleteHelpType
} = require('../controllers/helpTypeController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Crear nuevo tipo de ayuda (Solo Admin)
router.post('/', protect, authorize('admin'), createHelpType);

// Obtener todos los tipos de ayuda (Para usuarios logueados)
// Podrías quitar 'protect' si quieres que sea una ruta pública
router.get('/', protect, getAllHelpTypes);

// Obtener un tipo de ayuda por ID (Para usuarios logueados)
router.get('/:id', protect, getHelpTypeById);

// Actualizar un tipo de ayuda (Solo Admin)
router.put('/:id', protect, authorize('admin'), updateHelpType);

// Eliminar (lógicamente) un tipo de ayuda (Solo Admin)
router.delete('/:id', protect, authorize('admin'), deleteHelpType);

module.exports = router;