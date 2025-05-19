// backend/src/routes/mentorshipRequestRoutes.js
// backend/src/routes/mentorshipRequestRoutes.js
const express = require('express');
const router = express.Router();
const {
    createMentorshipRequest,
    getAllMentorshipRequests,
    getMentorshipRequestById,
    updateMentorshipRequest,
    deleteMentorshipRequest // <--- AÑADIR ESTA IMPORTACIÓN
} = require('../controllers/mentorshipRequestController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', createMentorshipRequest);
router.get('/', getAllMentorshipRequests);
router.get('/:id', getMentorshipRequestById);
router.put('/:id', updateMentorshipRequest);

// DELETE /api/mentorship-requests/:id - Eliminar (lógicamente) una solicitud
router.delete('/:id', deleteMentorshipRequest); // <--- AÑADIR ESTA RUTA

module.exports = router;