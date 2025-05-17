// backend/src/routes/mentorshipRequestRoutes.js
const express = require('express');
const router = express.Router();
const {
    createMentorshipRequest, 
    getAllMentorshipRequests,
    getMentorshipRequestById 
    // ... (más funciones se añadirán aquí)
} = require('../controllers/mentorshipRequestController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Todas las rutas de solicitudes de mentoría requieren que el usuario esté logueado
router.use(protect);

// Crear una nueva solicitud de mentoría (Solo Estudiantes)
// Nota: El middleware authorize('estudiante') se podría usar, pero la lógica
// de verificar el rol ya está dentro del controlador createMentorshipRequest.
// Si prefieres, puedes añadir authorize('estudiante') aquí también para mayor claridad.
router.post('/', createMentorshipRequest);

// Obtener todas las solicitudes de mentoría (filtradas por rol)
router.get('/', getAllMentorshipRequests); 
// TODO: Añadir más rutas: GET (para diferentes roles), PUT (para actualizar estado), etc.

router.get('/:id', getMentorshipRequestById); 

module.exports = router;