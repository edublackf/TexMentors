const express = require('express');
const router = express.Router();
const {
    createMentorshipSession,
    getSessionsForRequest,
    updateMentorshipSession 
    // Futuras funciones: updateMentorshipSession, deleteMentorshipSession
} = require('../controllers/mentorshipSessionController');
const { protect } = require('../middleware/authMiddleware'); // Todas las acciones de sesión requieren estar logueado

// Aplicar el middleware 'protect' a todas las rutas de sesiones
router.use(protect);

// Ruta para proponer/crear una nueva sesión
// POST /api/sessions
router.post('/', createMentorshipSession);

// Ruta para obtener todas las sesiones de una Solicitud de Mentoría específica
// GET /api/sessions/request/:requestId  (donde :requestId es el ID de la MentorshipRequest)
router.get('/request/:requestId', getSessionsForRequest);


// TODO: Rutas para actualizar una sesión (confirmar, cancelar, etc.)
// Ejemplo: PUT /api/sessions/:sessionId
// router.put('/:sessionId', updateMentorshipSession);
router.put('/:sessionId', updateMentorshipSession);

// TODO: Ruta para eliminar una sesión (si se implementa)
// Ejemplo: DELETE /api/sessions/:sessionId
// router.delete('/:sessionId', deleteMentorshipSession);

module.exports = router;