// backend/src/controllers/mentorshipRequestController.js
const mongoose = require('mongoose');
const MentorshipRequest = require('../models/mentorshipRequestModel');
const User = require('../models/userModel'); // Para verificar roles
const HelpType = require('../models/helpTypeModel'); // Para verificar si el tipo de ayuda existe

// @desc    Crear una nueva solicitud de mentoría (solo Estudiantes)
// @route   POST /api/mentorship-requests
// @access  Private/Estudiante
exports.createMentorshipRequest = async (req, res) => {
    const { helpTypeId, title, description, studentAvailability, mentorUserId } = req.body;

    // El ID del estudiante se obtiene del usuario logueado (req.user.id)
    const studentUserId = req.user.id;

    // Validaciones básicas de entrada
    if (!helpTypeId || !title || !description) {
        return res.status(400).json({ message: 'Por favor, complete los campos tipo de ayuda, título y descripción.' });
    }

    try {
        // 1. Verificar que el usuario logueado sea un estudiante
        if (req.user.rol !== 'estudiante') {
            return res.status(403).json({ message: 'Acceso denegado. Solo los estudiantes pueden crear solicitudes de mentoría.' });
        }

        // 2. Verificar que el tipo de ayuda (helpTypeId) exista y esté activo
        if (!mongoose.Types.ObjectId.isValid(helpTypeId)) {
            return res.status(400).json({ message: 'ID de tipo de ayuda no válido.' });
        }
        const helpTypeExists = await HelpType.findOne({ _id: helpTypeId, isDeleted: false });
        if (!helpTypeExists) {
            return res.status(404).json({ message: 'Tipo de ayuda no encontrado o no está activo.' });
        }

        // 3. (Opcional) Verificar si se proporcionó un mentorUserId
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
        
        // 4. (Opcional) Verificar si el estudiante ya tiene una solicitud activa/pendiente para el mismo tipo de ayuda
        // Esto es para evitar duplicados, pero depende de la lógica de negocio que quieran.
        // const existingRequest = await MentorshipRequest.findOne({
        //     studentUser: studentUserId,
        //     helpType: helpTypeId,
        //     status: { $in: ['pendiente', 'aceptada', 'en_progreso'] }, // Estados considerados "activos"
        //     isDeleted: false
        // });
        // if (existingRequest) {
        //     return res.status(400).json({ message: 'Ya tienes una solicitud activa o pendiente para este tipo de ayuda.' });
        // }


        // 5. Crear la solicitud de mentoría
        const mentorshipRequest = await MentorshipRequest.create({
            studentUser: studentUserId,
            mentorUser: mentorUserId || null, // Asignar si se proporcionó, sino null
            helpType: helpTypeId,
            title,
            description,
            studentAvailability: studentAvailability || '',
            // status por defecto es 'pendiente' según el modelo
        });

        // Popular los campos referenciados para la respuesta
        // El middleware pre-find/findOne en el modelo MentorshipRequest ya debería hacer esto,
        // pero si no, o para asegurar, podemos popular explícitamente aquí.
        const populatedRequest = await MentorshipRequest.findById(mentorshipRequest._id)
            // .populate('studentUser', 'nombre apellido email') // Ya se hace en el modelo
            // .populate('mentorUser', 'nombre apellido email')  // Ya se hace en el modelo
            // .populate('helpType', 'name');                   // Ya se hace en el modelo

        res.status(201).json({
            message: 'Solicitud de mentoría creada exitosamente.',
            mentorshipRequest: populatedRequest, // Usar la versión populada
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

exports.getAllMentorshipRequests = async (req, res) => {
    try {
        let query = {}; // Objeto de consulta inicial vacío

        // El middleware 'protect' ya nos da req.user
        const userRole = req.user.rol;
        const userId = req.user.id;

        if (userRole === 'estudiante') {
            // Los estudiantes solo ven sus propias solicitudes
            query.studentUser = userId;
        } else if (userRole === 'mentor') {
            // Los mentores ven las solicitudes asignadas a ellos O las que están pendientes
            // (para que puedan tomar alguna si el sistema lo permite, o para que un admin se las asigne)
            // Esta lógica puede ajustarse según las reglas de negocio.
            // Por ahora, un mentor ve las que tiene asignadas o todas las pendientes.
            query = {
                $or: [
                    { mentorUser: userId },
                    { status: 'pendiente', mentorUser: null } // Pendientes y sin mentor asignado
                ]
            };
            // Podríamos añadir un filtro para que un mentor solo vea pendientes de su área,
            // pero eso requiere que los HelpTypes o las solicitudes tengan un campo de "área"
            // y que el mentor tenga "áreas de especialización". Por ahora, lo mantenemos simple.
        } else if (userRole === 'admin') {
            // Los administradores ven todas las solicitudes (query queda vacío para traer todas)
            // No se necesita modificar 'query'
        } else {
            // Rol no reconocido o no debería acceder a esta ruta general (aunque 'protect' ya lo haría)
            return res.status(403).json({ message: 'Rol de usuario no autorizado para esta acción.' });
        }

        // Siempre filtramos para no mostrar las eliminadas lógicamente,
        // aunque el middleware pre-find del modelo ya debería hacer esto.
        // query.isDeleted = false; // Redundante si el middleware del modelo funciona bien

        // Ejecutar la consulta.
        // El populate ya debería estar manejado por el middleware pre-find en el modelo MentorshipRequest.
        const mentorshipRequests = await MentorshipRequest.find(query)
            .sort({ createdAt: -1 }); // Ordenar por más recientes primero

        res.status(200).json(mentorshipRequests);

    } catch (error) {
        console.error('Error en getAllMentorshipRequests:', error);
        res.status(500).json({ message: 'Error del servidor al obtener las solicitudes de mentoría.', error: error.message });
    }
};
exports.getMentorshipRequestById = async (req, res) => {
    try {
        const requestId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(requestId)) {
            return res.status(400).json({ message: 'ID de solicitud de mentoría no válido.' });
        }

        // El populate ya debería estar manejado por el middleware pre-findOne en el modelo MentorshipRequest.
        const mentorshipRequest = await MentorshipRequest.findById(requestId);

        if (!mentorshipRequest || mentorshipRequest.isDeleted) {
            return res.status(404).json({ message: 'Solicitud de mentoría no encontrada o ha sido eliminada.' });
        }

        // Lógica de autorización: ¿Quién puede ver esta solicitud?
        const userRole = req.user.rol;
        const userId = req.user.id;

        // Convertir ObjectId a string para comparación segura
        const studentOwnerId = mentorshipRequest.studentUser._id ? mentorshipRequest.studentUser._id.toString() : mentorshipRequest.studentUser.toString();
        const mentorAssignedId = mentorshipRequest.mentorUser ? (mentorshipRequest.mentorUser._id ? mentorshipRequest.mentorUser._id.toString() : mentorshipRequest.mentorUser.toString()) : null;


        if (userRole === 'admin' || 
            (userRole === 'estudiante' && studentOwnerId === userId) ||
            (userRole === 'mentor' && mentorAssignedId === userId)) {
            // Admin puede verla.
            // Estudiante propietario puede verla.
            // Mentor asignado puede verla.
            res.status(200).json(mentorshipRequest);
        } else {
            // Si es un mentor no asignado a esta solicitud específica, o un estudiante que no es el dueño.
            // Podríamos permitir que un mentor vea detalles de solicitudes pendientes sin asignar,
            // pero eso se manejaría mejor en la lógica de `getAllMentorshipRequests` con filtros.
            // Aquí, si no cumple las condiciones, es un acceso no autorizado al detalle específico.
            return res.status(403).json({ message: 'Acceso denegado. No tienes permiso para ver esta solicitud específica.' });
        }

    } catch (error) {
        console.error('Error en getMentorshipRequestById:', error);
        if (error.name === 'CastError') { // Aunque ya validamos el ObjectId
            return res.status(400).json({ message: 'ID de solicitud de mentoría con formato incorrecto.' });
        }
        res.status(500).json({ message: 'Error del servidor al obtener la solicitud de mentoría.', error: error.message });
    }
};

// TODO: updateMentorshipRequestStatus, etc.