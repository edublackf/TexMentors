const mongoose = require('mongoose');
const MentorshipSession = require('../models/mentorshipSessionModel');
const MentorshipRequest = require('../models/mentorshipRequestModel'); // Para verificar la solicitud padre
const User = require('../models/userModel'); // Para verificar roles si es necesario

// @desc    Proponer/Crear una nueva sesión de mentoría
// @route   POST /api/sessions
// @access  Private (Mentor asignado o Estudiante de la solicitud activa)
exports.createMentorshipSession = async (req, res) => {
    const {
        mentorshipRequestId,
        proposedDateTimes, // Array de { startTime, endTime }
        locationOrLink
    } = req.body;

    const proposedById = req.user.id; // Quién está proponiendo (obtenido del token, es un string)

    // Validaciones de entrada
    if (!mentorshipRequestId || !proposedDateTimes || proposedDateTimes.length === 0) {
        return res.status(400).json({ message: 'Se requiere ID de solicitud de mentoría y al menos una fecha/hora propuesta.' });
    }
    for (const dt of proposedDateTimes) {
        if (!dt.startTime || !dt.endTime) {
            return res.status(400).json({ message: 'Cada propuesta de fecha/hora debe tener startTime y endTime.' });
        }
        if (new Date(dt.startTime) >= new Date(dt.endTime)) {
            return res.status(400).json({ message: 'La fecha/hora de inicio debe ser anterior a la fecha/hora de fin.' });
        }
        // Validar que las fechas sean válidas (opcional pero recomendado)
        if (isNaN(new Date(dt.startTime).getTime()) || isNaN(new Date(dt.endTime).getTime())) {
            return res.status(400).json({ message: 'Una o más fechas propuestas no son válidas.' });
        }
    }

    try {
        // 1. Verificar que la MentorshipRequest exista, esté activa y el usuario tenga permiso
        if (!mongoose.Types.ObjectId.isValid(mentorshipRequestId)) {
            return res.status(400).json({ message: 'ID de solicitud de mentoría no válido.' });
        }

        // Popular studentUser y mentorUser para obtener sus _id para la verificación de permisos
        const parentRequest = await MentorshipRequest.findById(mentorshipRequestId)
            .populate('studentUser', '_id nombre') // Solo necesitamos _id y nombre para logs/verificación
            .populate('mentorUser', '_id nombre');  // Solo necesitamos _id y nombre

        if (!parentRequest || parentRequest.isDeleted) {
            return res.status(404).json({ message: 'Solicitud de mentoría asociada no encontrada o eliminada.' });
        }

        // Verificar que el estado de la solicitud permita crear sesiones
        const allowedRequestStatuses = ['aceptada_mentor', 'en_progreso', 'reprogramar_mentor', 'reprogramar_estudiante'];
        if (!allowedRequestStatuses.includes(parentRequest.status)) {
            return res.status(400).json({ message: `No se pueden crear sesiones para una solicitud en estado '${parentRequest.status}'. Debe estar aceptada o en progreso.` });
        }

        // Verificar permisos: solo el mentor asignado o el estudiante de la solicitud pueden proponer
        const studentOwnerId = parentRequest.studentUser?._id?.toString();
        const mentorAssignedId = parentRequest.mentorUser?._id?.toString(); // Será undefined si mentorUser es null

        console.log("--- DEBUG: createMentorshipSession ---");
        console.log("User making request (proposedById):", proposedById, `(type: ${typeof proposedById})`);
        console.log("Role of user making request (req.user.rol):", req.user.rol);
        console.log("Parent Request ID:", parentRequest._id.toString());
        console.log("Parent Request Student User:", parentRequest.studentUser); // Loguear el objeto completo
        console.log("Extracted studentOwnerId:", studentOwnerId, `(type: ${typeof studentOwnerId})`);
        console.log("Parent Request Mentor User:", parentRequest.mentorUser); // Loguear el objeto completo o null
        console.log("Extracted mentorAssignedId:", mentorAssignedId, `(type: ${typeof mentorAssignedId})`);
        console.log("--------------------------------------");


        let hasPermission = false;
        if (req.user.rol === 'estudiante' && studentOwnerId === proposedById) {
            hasPermission = true;
            console.log("DEBUG: Permission check PASSED as student owner.");
        } else if (req.user.rol === 'mentor' && mentorAssignedId === proposedById) {
            hasPermission = true;
            console.log("DEBUG: Permission check PASSED as assigned mentor.");
        }
        // Si quieres que un admin también pueda, descomenta y ajusta:
        // else if (req.user.rol === 'admin') {
        //     hasPermission = true;
        //     console.log("DEBUG: Permission check PASSED as admin.");
        // }


        if (!hasPermission) {
            console.log("DEBUG: Permission check FAILED.");
            return res.status(403).json({ message: 'No tienes permiso para proponer sesiones para esta solicitud.' });
        }

        // 2. Crear la sesión
        const newSession = await MentorshipSession.create({
            mentorshipRequest: parentRequest._id, // Usar el _id del parentRequest encontrado
            mentor: parentRequest.mentorUser ? parentRequest.mentorUser._id : null, // Usar el _id si existe
            student: parentRequest.studentUser._id, // Usar el _id
            proposedBy: proposedById,
            proposedDateTimes,
            locationOrLink: locationOrLink || '',
            status: 'propuesta'
        });
        
        // El modelo MentorshipSession tiene auto-populate, así que findById debería devolverla populada.
        const populatedSession = await MentorshipSession.findById(newSession._id);

        res.status(201).json({
            message: 'Sesión de mentoría propuesta exitosamente.',
            session: populatedSession
        });

    } catch (error) {
        console.error('Error en createMentorshipSession:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join('. ') });
        }
        res.status(500).json({ message: 'Error del servidor al proponer la sesión.', error: error.message });
    }
};
// @desc    Obtener todas las sesiones para una Solicitud de Mentoría específica
// @route   GET /api/sessions/request/:requestId
// @access  Private (Estudiante propietario, Mentor asignado, Admin)
exports.getSessionsForRequest = async (req, res) => {
    const { requestId } = req.params; // ID de la MentorshipRequest

    try {
        // 1. Validar el formato del requestId
        if (!mongoose.Types.ObjectId.isValid(requestId)) {
            return res.status(400).json({ message: 'ID de solicitud de mentoría no válido en la URL.' });
        }
        
        // 2. Buscar la MentorshipRequest padre y popular studentUser y mentorUser solo con sus _id
        // Esto es crucial para la verificación de permisos.
        const parentRequest = await MentorshipRequest.findById(requestId)
            .populate('studentUser', '_id') // Solo necesitamos el _id del estudiante para la comparación
            .populate('mentorUser', '_id');  // Solo necesitamos el _id del mentor (si existe) para la comparación

        // 3. Verificar si la MentorshipRequest existe y no está eliminada
        if (!parentRequest || parentRequest.isDeleted) {
            return res.status(404).json({ message: 'Solicitud de mentoría asociada no encontrada o ha sido eliminada.' });
        }

        // 4. Obtener información del usuario que realiza la petición (del token)
        const userRole = req.user.rol;
        const userId = req.user.id; // Este es un string

        // 5. Extraer de forma segura los IDs del estudiante dueño y del mentor asignado (si existe)
        // y convertirlos a string para una comparación consistente.
        const studentOwnerId = parentRequest.studentUser?._id?.toString();
        const mentorAssignedId = parentRequest.mentorUser?._id?.toString(); // Será undefined si mentorUser es null o no tiene _id

        // --- Logs de Depuración ---
        console.log("--- DEBUG: getSessionsForRequest ---");
        console.log("User making request (userId from token):", userId, `(type: ${typeof userId})`);
        console.log("Role of user making request (userRole from token):", userRole);
        console.log("Parent MentorshipRequest ID being queried:", parentRequest._id.toString());
        
        console.log("Parent Request's Student User (populated):", parentRequest.studentUser); // Loguear el objeto studentUser
        console.log("Extracted studentOwnerId from Parent Request:", studentOwnerId, `(type: ${typeof studentOwnerId})`);
        
        console.log("Parent Request's Mentor User (populated or null):", parentRequest.mentorUser); // Loguear el objeto mentorUser o null
        console.log("Extracted mentorAssignedId from Parent Request:", mentorAssignedId, `(type: ${typeof mentorAssignedId})`); // Puede ser undefined
        console.log("--------------------------------------");
        // --- Fin Logs de Depuración ---

        // 6. Lógica de Permisos
        let hasPermissionToList = false;
        if (userRole === 'admin') {
            hasPermissionToList = true;
            console.log("DEBUG: Permission to list GRANTED as admin.");
        } else if (userRole === 'estudiante' && studentOwnerId === userId) {
            hasPermissionToList = true;
            console.log("DEBUG: Permission to list GRANTED as student owner.");
        } else if (userRole === 'mentor' && mentorAssignedId && mentorAssignedId === userId) { 
            // Importante: mentorAssignedId debe existir (no ser undefined/null) Y coincidir
            hasPermissionToList = true;
            console.log("DEBUG: Permission to list GRANTED as assigned mentor.");
        }

        if (!hasPermissionToList) {
            console.log("DEBUG: Permission to list FAILED for user and request.");
            return res.status(403).json({ message: 'No tienes permiso para ver las sesiones de esta solicitud.' });
        }

        // 7. Si tiene permiso, buscar todas las sesiones (activas) para esa MentorshipRequest
        // El modelo MentorshipSession tiene auto-populate para sus propias referencias.
        const sessions = await MentorshipSession.find({ 
                mentorshipRequest: requestId, 
                // isDeleted: false // Esta condición ya debería ser aplicada por el middleware pre-find del modelo MentorshipSession
            })
            .sort({ createdAt: -1 }); // Ordenar por más recientes primero

        res.status(200).json(sessions);

    } catch (error) {
        console.error('Error en getSessionsForRequest:', error);
        // Manejo específico para CastError si el ID en la URL es malformado y no fue capturado antes
        if (error.name === 'CastError' && error.path === '_id' && error.kind === 'ObjectId') {
             return res.status(400).json({ message: 'ID de solicitud de mentoría con formato incorrecto en la URL.' });
        }
        res.status(500).json({ message: 'Error del servidor al obtener las sesiones.', error: error.message });
    }
};


// @desc    Actualizar una sesión de mentoría (confirmar, estado, resumen, feedback)
// @route   PUT /api/sessions/:sessionId
// @access  Private (Participantes de la sesión o Admin)
exports.updateMentorshipSession = async (req, res) => {
    const { sessionId } = req.params;
    const { status, confirmedDateTime, summaryMentor, feedbackStudent, locationOrLink, proposedDateTimes } = req.body;
    const updaterId = req.user.id;
    const updaterRole = req.user.rol;

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
        return res.status(400).json({ message: 'ID de sesión no válido.' });
    }

    try {
        // Es crucial popular aquí para las verificaciones de permisos y lógica
        const session = await MentorshipSession.findById(sessionId)
            .populate('mentor', '_id')
            .populate('student', '_id')
            .populate('proposedBy', '_id');

        if (!session || session.isDeleted) {
            return res.status(404).json({ message: 'Sesión de mentoría no encontrada o eliminada.' });
        }

        const studentId = session.student?._id?.toString();
        const mentorId = session.mentor?._id?.toString();
        const proposedById = session.proposedBy?._id?.toString();

        let canUpdate = false;
        const updates = {};

        // Lógica de actualización basada en el rol y la acción
        // Acción: Confirmar una sesión propuesta
        if (confirmedDateTime && status === 'confirmada' && session.status === 'propuesta' && updaterId !== proposedById) {
            // Solo puede confirmar quien NO la propuso
            // Validar que confirmedDateTime (objeto {startTime, endTime}) sea una de las proposedDateTimes
            const isValidProposal = session.proposedDateTimes.some(
                pdt => new Date(pdt.startTime).toISOString() === new Date(confirmedDateTime.startTime).toISOString() &&
                       new Date(pdt.endTime).toISOString() === new Date(confirmedDateTime.endTime).toISOString()
            );
            if (!isValidProposal) {
                return res.status(400).json({ message: 'La fecha/hora confirmada no es una de las opciones propuestas válidas.' });
            }
            updates.confirmedDateTime = { 
                startTime: new Date(confirmedDateTime.startTime), 
                endTime: new Date(confirmedDateTime.endTime) 
            };
            updates.status = 'confirmada';
            canUpdate = (updaterRole === 'estudiante' && studentId === updaterId) || (updaterRole === 'mentor' && mentorId === updaterId);
        }

        // Acciones del Mentor
        if (updaterRole === 'mentor' && mentorId === updaterId) {
            if (status) {
                if (status === 'realizada' && ['confirmada', 'en_progreso'].includes(session.status)) {
                    updates.status = 'realizada'; canUpdate = true;
                } else if (status === 'cancelada_mentor' && !['realizada', 'cancelada_estudiante', 'cancelada_mentor', 'cancelada_admin'].includes(session.status)) {
                    updates.status = 'cancelada_mentor'; canUpdate = true;
                } else if (status === 'reprogramar_mentor' && ['confirmada', 'cancelada_estudiante'].includes(session.status)) {
                    if (!proposedDateTimes || proposedDateTimes.length === 0) return res.status(400).json({ message: 'Para reprogramar, se requieren nuevas fechas propuestas.'});
                    updates.status = 'reprogramar_mentor';
                    updates.proposedDateTimes = proposedDateTimes;
                    updates.confirmedDateTime = null; // Resetear confirmación
                    updates.proposedBy = updaterId; // Ahora el mentor propone
                    canUpdate = true;
                }
            }
            if (summaryMentor !== undefined && session.status === 'realizada') { // Solo añadir resumen si está realizada
                updates.summaryMentor = summaryMentor; canUpdate = true;
            }
            if (locationOrLink !== undefined) {
                updates.locationOrLink = locationOrLink; canUpdate = true;
            }
        }

        // Acciones del Estudiante
        if (updaterRole === 'estudiante' && studentId === updaterId) {
            if (status) {
                if (status === 'cancelada_estudiante' && !['realizada', 'cancelada_estudiante', 'cancelada_mentor', 'cancelada_admin'].includes(session.status)) {
                    updates.status = 'cancelada_estudiante'; canUpdate = true;
                } else if (status === 'reprogramar_estudiante' && ['confirmada', 'cancelada_mentor'].includes(session.status)) {
                     if (!proposedDateTimes || proposedDateTimes.length === 0) return res.status(400).json({ message: 'Para reprogramar, se requieren nuevas fechas propuestas.'});
                    updates.status = 'reprogramar_estudiante';
                    updates.proposedDateTimes = proposedDateTimes;
                    updates.confirmedDateTime = null; // Resetear confirmación
                    updates.proposedBy = updaterId; // Ahora el estudiante propone
                    canUpdate = true;
                }
            }
            if (feedbackStudent !== undefined && session.status === 'realizada') { // Solo añadir feedback si está realizada
                updates.feedbackStudent = feedbackStudent; canUpdate = true;
            }
        }
        
        // Acciones del Admin (puede anular/cambiar estados más libremente)
        if (updaterRole === 'admin') {
            if (status) { updates.status = status; canUpdate = true;}
            if (locationOrLink !== undefined) { updates.locationOrLink = locationOrLink; canUpdate = true; }
            // Admin podría también editar proposedDateTimes, confirmedDateTime, etc. si es necesario.
        }


        if (!canUpdate || Object.keys(updates).length === 0) {
            // Si se intentó una acción pero no resultó en cambios válidos para el rol
            if (Object.keys(req.body).length > 0 && Object.keys(updates).length === 0 && !canUpdate) {
                 return res.status(400).json({ message: 'La acción o los datos proporcionados no son válidos para tu rol o el estado actual de la sesión.' });
            }
            return res.status(403).json({ message: 'No tienes permiso para realizar esta acción o no hay cambios válidos para aplicar.' });
        }

        Object.assign(session, updates);
        const updatedSession = await session.save();
        const populatedResponse = await MentorshipSession.findById(updatedSession._id); // Re-populate para la respuesta

        res.status(200).json({
            message: 'Sesión de mentoría actualizada exitosamente.',
            session: populatedResponse
        });

    } catch (error) {
        console.error('Error en updateMentorshipSession:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: messages.join('. ') });
        }
        res.status(500).json({ message: 'Error del servidor al actualizar la sesión.', error: error.message });
    }
};

// TODO: updateMentorshipSession (confirmar, cancelar, reprogramar, marcar como realizada, añadir resumen/feedback)
// TODO: deleteMentorshipSession (si es necesario)