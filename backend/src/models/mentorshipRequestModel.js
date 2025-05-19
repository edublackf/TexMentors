// backend/src/models/mentorshipRequestModel.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mentorshipRequestSchema = new Schema({
    studentUser: { // El estudiante que realiza la solicitud
        type: Schema.Types.ObjectId,
        ref: 'User', // Referencia al modelo 'User'
        required: [true, 'El ID del estudiante es obligatorio.']
        // Podríamos añadir una validación para asegurar que el User referenciado tenga rol 'estudiante'
    },
    mentorUser: { // El mentor asignado o solicitado (puede ser opcional al crear la solicitud)
        type: Schema.Types.ObjectId,
        ref: 'User', // Referencia al modelo 'User'
        default: null
        // Podríamos añadir una validación para asegurar que el User referenciado tenga rol 'mentor'
    },
    helpType: { // El tipo de ayuda solicitada
        type: Schema.Types.ObjectId,
        ref: 'HelpType', // Referencia al modelo 'HelpType'
        required: [true, 'El tipo de ayuda es obligatorio.']
    },
    title: {
        type: String,
        required: [true, 'El título de la solicitud es obligatorio.'],
        trim: true,
        maxlength: [150, 'El título no puede exceder los 150 caracteres.']
    },
    description: { // Descripción detallada de la necesidad del estudiante
        type: String,
        required: [true, 'La descripción detallada es obligatoria.'],
        trim: true
    },
    status: {
        type: String,
        required: true,
        enum: ['pendiente',
            'aceptada_mentor', 
            'rechazada_mentor',
            'rechazada_admin',
            'en_progreso',
            'completada',
            'cancelada_estudiante',
            'cancelada_admin'],
        default: 'pendiente'
    },
    studentAvailability: { // Preferencia horaria del estudiante (texto libre o estructura más compleja)
        type: String,
        trim: true,
        default: ''
    },
    // Notas o comentarios internos para administradores o mentores sobre la solicitud
    internalNotes: {
        type: String,
        trim: true,
        default: ''
    },
    // Campos para eliminación lógica
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true // Añade createdAt y updatedAt
});

// Middleware para la eliminación lógica
const autoPopulateIsDeleted = function(next) {
    const filter = this.getFilter();
    if (filter && typeof filter.isDeleted === 'undefined') {
        this.where({ isDeleted: false });
    }
    next();
};

mentorshipRequestSchema.pre('find', autoPopulateIsDeleted);
mentorshipRequestSchema.pre('findOne', autoPopulateIsDeleted);
mentorshipRequestSchema.pre('findOneAndUpdate', autoPopulateIsDeleted);
mentorshipRequestSchema.pre('countDocuments', autoPopulateIsDeleted);
mentorshipRequestSchema.pre('count', autoPopulateIsDeleted);

// Popular campos referenciados automáticamente al hacer 'find' o 'findOne'
// Esto es muy útil para obtener la información completa del estudiante, mentor y tipo de ayuda
// sin tener que hacer múltiples consultas.
const autoPopulateReferences = function(next) {
    this.populate('studentUser', 'nombre apellido email fotoPerfilUrl carrera cicloActual'); // Selecciona campos específicos de User
    this.populate('mentorUser', 'nombre apellido email fotoPerfilUrl especialidades'); // Selecciona campos específicos de User
    this.populate('helpType', 'name description'); // Selecciona campos de HelpType
    next();
};

mentorshipRequestSchema.pre('find', autoPopulateReferences);
mentorshipRequestSchema.pre('findOne', autoPopulateReferences);
// Nota: findOneAndUpdate no dispara 'populate' de esta manera, se debe manejar en la respuesta o con .populate() explícito después.


const MentorshipRequest = mongoose.model('MentorshipRequest', mentorshipRequestSchema);

module.exports = MentorshipRequest;