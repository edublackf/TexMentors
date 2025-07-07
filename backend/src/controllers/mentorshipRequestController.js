// backend/src/controllers/mentorshipRequestController.js
const mongoose = require('mongoose');
const MentorshipRequest = require('../models/mentorshipRequestModel');
const User = require('../models/userModel');
const HelpType = require('../models/helpTypeModel');

// @desc    Crear una nueva solicitud de mentoría (solo Estudiantes)
// @route   POST /api/mentorship-requests
// @access  Private/Estudiante
exports.createMentorshipRequest = async (req, res) => {
    const { helpTypeId, title, description, studentAvailability, mentorUserId } = req.body;
    const studentUserId = req.user.id;

    if (!helpTypeId || !title || !description) {
        return res.status(400).json({ message: 'Por favor, complete los campos tipo de ayuda, título y descripción.' });
    }

    try {
        if (req.user.rol !== 'estudiante') {
            return res.status(403).json({ message: 'Acceso denegado. Solo los estudiantes pueden crear solicitudes de mentoría.' });
        }
        if (!mongoose.Types.ObjectId.isValid(helpTypeId)) {
            return res.status(400).json({ message: 'ID de tipo de ayuda no válido.' });
        }
        const helpTypeExists = await HelpType.findOne({ _id: helpTypeId, isDeleted: false });
        if (!helpTypeExists) {
            return res.status(404).json({ message: 'Tipo de ayuda no encontrado o no está activo.' });
        }

        let mentorExists = null;
        if (mentorUserId) {
            if (!mongoose.Types.ObjectId.isValid(mentorUserId)) {
                return res.status(400).json({ message: 'ID de mentor proporcionado no válido.' });
            }
            mentorExists = await User.findOne({ _id: mentorUserId, rol: 'mentor', isDeleted: false });
            if (!mentorExists) {
                return res.status(404).json({ message: 'Mentor especificado no encontrado, no es mentor o no está activo.' });
            }
        }

        const mentorshipRequest = await MentorshipRequest.create({
            studentUser: studentUserId,
            mentorUser: mentorUserId || null,
            helpType: helpTypeId,
            title,
            description,
            studentAvailability: studentAvailability || '',
        });

        const populatedRequest = await MentorshipRequest.findById(mentorshipRequest._id);
        res.status(201).json({
            message: 'Solicitud de mentoría creada exitosamente.',
            mentorshipRequest: populatedRequest,
        });

    } catch (error) {
        console.error('Error en createMentorshipRequest:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join('. ') });
        }
        res.status(500).json({ message: 'Error del servidor al crear la solicitud de mentoría.', error: error.message });
    }
};

// @desc    Obtener todas las solicitudes de mentoría (con filtros según rol)
// @route   GET /api/mentorship-requests
// @access  Private (Estudiante, Mentor, Admin)
exports.getAllMentorshipRequests = async (req, res) => {
    try {
        let query = {};
        const userRole = req.user.rol;
        const userId = req.user.id;

        if (userRole === 'estudiante') {
            query.studentUser = userId;
        } else if (userRole === 'mentor') {
            query = {
                $or: [
                    { mentorUser: userId },
                    { status: 'pendiente', mentorUser: null } 
                ]
            };
        } else if (userRole !== 'admin') { // Si no es admin y tampoco estudiante o mentor (aunque ya cubierto)
             return res.status(403).json({ message: 'Rol de usuario no autorizado para esta acción.' });
        }
        // Admin ve todo (query queda vacío)

        const mentorshipRequests = await MentorshipRequest.find(query).sort({ createdAt: -1 });
        res.status(200).json(mentorshipRequests);

    } catch (error) {
        console.error('Error en getAllMentorshipRequests:', error);
        res.status(500).json({ message: 'Error del servidor al obtener las solicitudes de mentoría.', error: error.message });
    }
};

// @desc    Obtener una solicitud de mentoría por su ID
// @route   GET /api/mentorship-requests/:id
// @access  Private (Estudiante propietario, Mentor asignado, Admin)
exports.getMentorshipRequestById = async (req, res) => {
    try {
        const requestId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(requestId)) {
            return res.status(400).json({ message: 'ID de solicitud de mentoría no válido.' });
        }

        const mentorshipRequest = await MentorshipRequest.findById(requestId);
        if (!mentorshipRequest || mentorshipRequest.isDeleted) {
            return res.status(404).json({ message: 'Solicitud de mentoría no encontrada o ha sido eliminada.' });
        }

        const userRole = req.user.rol;
        const userId = req.user.id;
        const studentOwnerId = mentorshipRequest.studentUser._id ? mentorshipRequest.studentUser._id.toString() : mentorshipRequest.studentUser.toString();
        const mentorAssignedId = mentorshipRequest.mentorUser ? (mentorshipRequest.mentorUser._id ? mentorshipRequest.mentorUser._id.toString() : mentorshipRequest.mentorUser.toString()) : null;

        if (userRole === 'admin' || 
            (userRole === 'estudiante' && studentOwnerId === userId) ||
            (userRole === 'mentor' && mentorAssignedId === userId)) {
            res.status(200).json(mentorshipRequest);
        } else {
            return res.status(403).json({ message: 'Acceso denegado. No tienes permiso para ver esta solicitud específica.' });
        }
    } catch (error) {
        console.error('Error en getMentorshipRequestById:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de solicitud de mentoría con formato incorrecto.' });
        }
        res.status(500).json({ message: 'Error del servidor al obtener la solicitud de mentoría.', error: error.message });
    }
};

// @desc    Actualizar una solicitud de mentoría (estado, asignar mentor, etc.)
// @route   PUT /api/mentorship-requests/:id
// @access  Private (Admin, Mentor asignado, Estudiante propietario para ciertas acciones)
exports.updateMentorshipRequest = async (req, res) => {
    const requestId = req.params.id;
    const { status, mentorUser, internalNotes } = req.body; // Campos que se pueden actualizar

    try {
        if (!mongoose.Types.ObjectId.isValid(requestId)) {
            return res.status(400).json({ message: 'ID de solicitud de mentoría no válido.' });
        }

        const mentorshipRequest = await MentorshipRequest.findById(requestId);
        if (!mentorshipRequest || mentorshipRequest.isDeleted) {
            return res.status(404).json({ message: 'Solicitud de mentoría no encontrada o ya eliminada.' });
        }

        const userRole = req.user.rol;
        const userId = req.user.id;
        const studentOwnerId = mentorshipRequest.studentUser._id ? mentorshipRequest.studentUser._id.toString() : mentorshipRequest.studentUser.toString();
        const currentMentorAssignedId = mentorshipRequest.mentorUser ? (mentorshipRequest.mentorUser._id ? mentorshipRequest.mentorUser._id.toString() : mentorshipRequest.mentorUser.toString()) : null;

        let canUpdate = false;
        let updates = {};

        // Lógica de permisos y campos actualizables por ROL
        if (userRole === 'admin') {
            canUpdate = true;
            if (status) updates.status = status; // Admin puede cambiar a cualquier estado (validar enum en el modelo)
            if (mentorUser !== undefined) { // <--- Usar mentorUser
    if (mentorUser === null || mentorUser === "null" || mentorUser === "") { // <--- Usar mentorUser
        updates.mentorUser = null;
    } else {
        if (!mongoose.Types.ObjectId.isValid(mentorUser)) { // <--- Usar mentorUser
            return res.status(400).json({ message: 'ID de nuevo mentor no válido.' });
        }
        const newMentor = await User.findOne({ _id: mentorUser, rol: 'mentor', isDeleted: false }); // <--- Usar mentorUser
        if (!newMentor) {
            return res.status(404).json({ message: 'Nuevo mentor no encontrado, no es mentor o no está activo.' });
        }
        updates.mentorUser = mentorUser; // Esto ya estaba bien, pero la condición de arriba usa la variable correcta
    }
}
            if (internalNotes !== undefined) updates.internalNotes = internalNotes;
        } 
        else if (userRole === 'mentor') {
            const allowedMentorStatusesForAssigned = ['aceptada_mentor', 'rechazada_mentor', 'en_progreso', 'completada', 'cancelada_admin','cancelada_mentor'];
            
            if (currentMentorAssignedId === userId) { // Escenario 1: Mentor ya está asignado a esta solicitud
                canUpdate = true;
                if (status && allowedMentorStatusesForAssigned.includes(status)) {
                    if ((mentorshipRequest.status === 'pendiente' && (status === 'aceptada_mentor' || status === 'rechazada_mentor')) ||
                        (mentorshipRequest.status === 'aceptada_mentor' && (status === 'en_progreso' || status === 'cancelada_mentor')) ||
                        (mentorshipRequest.status === 'en_progreso' && (status === 'completada' || status === 'cancelada_mentor'))) {
                        updates.status = status;
                    } else {
                        return res.status(400).json({ message: `Transición de estado inválida de '${mentorshipRequest.status}' a '${status}' para mentor asignado.` });
                    }
                } else if (status) {
                     return res.status(400).json({ message: `Como mentor asignado, solo puedes cambiar el estado a valores permitidos: ${allowedMentorStatusesForAssigned.join(', ')}.` });
                }
                if (internalNotes !== undefined) updates.internalNotes = internalNotes;

            } else if (!currentMentorAssignedId && mentorshipRequest.status === 'pendiente' && status === 'aceptada_mentor') {
                // Escenario 2: Mentor "toma" una solicitud pendiente sin asignar
                canUpdate = true;
                updates.mentorUser = userId; // ASIGNAR AL MENTOR ACTUAL (el que hace la petición)
                updates.status = 'aceptada_mentor'; // El estado deseado
                if (internalNotes !== undefined) updates.internalNotes = internalNotes; // Puede añadir notas al tomarla
            } else {
                // No es el mentor asignado Y no está "tomando" una pendiente para aceptarla
                 // O está intentando una acción no permitida sobre una solicitud no asignada o con estado incorrecto
                return res.status(403).json({ message: 'No puedes actualizar esta solicitud porque no te ha sido asignada o la acción/estado no es permitida.' });
            }
        }
        else if (userRole === 'estudiante' && studentOwnerId === userId) { // Estudiante propietario
            canUpdate = true;
            // Estudiante solo puede cancelar su solicitud si está pendiente o aceptada (antes de en_progreso)
            const allowedStudentStatuses = ['cancelada_estudiante'];
            if (status && allowedStudentStatuses.includes(status)) {
                if (['pendiente', 'aceptada_mentor'].includes(mentorshipRequest.status)) {
                    updates.status = status;
                } else {
                    return res.status(400).json({ message: `Solo puedes cancelar tu solicitud si está pendiente o aceptada. Estado actual: ${mentorshipRequest.status}` });
                }
            } else if (status) {
                return res.status(400).json({ message: `Como estudiante, solo puedes cambiar el estado a: ${allowedStudentStatuses.join(', ')}.` });
            }
            // Estudiante no puede cambiar mentor ni notas internas
        }

        if (!canUpdate || Object.keys(updates).length === 0) {
            if(canUpdate && Object.keys(updates).length === 0 && (req.body.hasOwnProperty('status') || req.body.hasOwnProperty('mentorUserId') || req.body.hasOwnProperty('internalNotes'))){
                 return res.status(400).json({ message: 'Los datos proporcionados no son válidos o no resultaron en una actualización para tu rol.' });
            }
            return res.status(403).json({ message: 'Acceso denegado o no hay campos válidos para actualizar para tu rol.' });
        }

        // Aplicar las actualizaciones
        Object.assign(mentorshipRequest, updates);
        const updatedRequest = await mentorshipRequest.save();

        // El populate ya debería estar manejado por el middleware pre-save/findOne en el modelo,
        // pero si findByIdAndUpdate se usara, necesitaría .populate() explícito.
        // Con .save(), el documento ya está populado si las referencias lo estaban.
        // Para asegurar la respuesta populada, podemos hacer findById de nuevo.
        const populatedResponse = await MentorshipRequest.findById(updatedRequest._id);

        res.status(200).json({
            message: 'Solicitud de mentoría actualizada exitosamente.',
            mentorshipRequest: populatedResponse
        });

    } catch (error) {
        console.error('Error en updateMentorshipRequest:', error);
        if (error.name === 'ValidationError') { // Errores de validación del modelo (ej. enum de status)
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join('. ') });
        }
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID con formato incorrecto (solicitud o mentor).' });
        }
        res.status(500).json({ message: 'Error del servidor al actualizar la solicitud de mentoría.', error: error.message });
    }
};

exports.deleteMentorshipRequest = async (req, res) => {
    const requestId = req.params.id;

    try {
        if (!mongoose.Types.ObjectId.isValid(requestId)) {
            return res.status(400).json({ message: 'ID de solicitud de mentoría no válido.' });
        }

        const mentorshipRequest = await MentorshipRequest.findById(requestId);

        if (!mentorshipRequest) { // Si no existe, no importa si está marcada como isDeleted o no
            return res.status(404).json({ message: 'Solicitud de mentoría no encontrada.' });
        }
        
        // Si ya está eliminada lógicamente
        if (mentorshipRequest.isDeleted) {
            return res.status(400).json({ message: 'Esta solicitud de mentoría ya ha sido eliminada previamente.' });
        }


        const userRole = req.user.rol;
        const userId = req.user.id;
        const studentOwnerId = mentorshipRequest.studentUser._id ? mentorshipRequest.studentUser._id.toString() : mentorshipRequest.studentUser.toString();

        let canDelete = false;

        if (userRole === 'admin') {
            canDelete = true;
        } else if (userRole === 'estudiante' && studentOwnerId === userId) {
            // Un estudiante solo puede eliminar su propia solicitud si está en estado 'pendiente'
            // o quizás también 'aceptada_mentor' antes de que comience el trabajo.
            // Ajusta estos estados según tus reglas de negocio.
            if (['pendiente', 'aceptada_mentor', 'rechazada_mentor', 'rechazada_admin', 'cancelada_estudiante', 'cancelada_admin'].includes(mentorshipRequest.status)) {
                canDelete = true;
            } else {
                return res.status(403).json({ message: `No puedes eliminar esta solicitud porque su estado actual es '${mentorshipRequest.status}'. Solo se pueden eliminar en estados tempranos o finales.` });
            }
        }

        if (!canDelete) {
            return res.status(403).json({ message: 'Acceso denegado. No tienes permiso para eliminar esta solicitud.' });
        }

        // Realizar la eliminación lógica
        mentorshipRequest.isDeleted = true;
        mentorshipRequest.deletedAt = new Date();
        await mentorshipRequest.save();

        res.status(200).json({ message: 'Solicitud de mentoría eliminada exitosamente.' });

    } catch (error) {
        console.error('Error en deleteMentorshipRequest:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'ID de solicitud de mentoría con formato incorrecto.' });
        }
        res.status(500).json({ message: 'Error del servidor al eliminar la solicitud de mentoría.', error: error.message });
    }
};