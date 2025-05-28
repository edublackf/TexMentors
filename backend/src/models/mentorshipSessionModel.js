const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mentorshipSessionSchema = new Schema({
    mentorshipRequest: { // La solicitud de mentoría a la que pertenece esta sesión
        type: Schema.Types.ObjectId,
        ref: 'MentorshipRequest',
        required: [true, 'La solicitud de mentoría es obligatoria.']
    },
    mentor: { // El mentor de la sesión (redundante si ya está en MentorshipRequest, pero útil para queries directas)
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'El mentor es obligatorio.']
    },
    student: { // El estudiante de la sesión (redundante, pero útil)
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'El estudiante es obligatorio.']
    },
    proposedBy: { // Quién propuso la sesión (mentor o estudiante)
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    proposedDateTimes: [{ // El que propone puede dar varias opciones de fecha/hora
        startTime: { type: Date, required: true },
        endTime: { type: Date, required: true }
    }],
    confirmedDateTime: { // Una vez que la otra parte confirma una de las opciones
        startTime: { type: Date },
        endTime: { type: Date }
    },
    status: {
        type: String,
        required: true,
        enum: [
            'propuesta',        // Sesión propuesta, esperando confirmación
            'confirmada',       // Ambas partes acordaron fecha/hora
            'realizada',        // Sesión llevada a cabo
            'cancelada_mentor',
            'cancelada_estudiante',
            'reprogramar_mentor', // Mentor solicita reprogramar
            'reprogramar_estudiante' // Estudiante solicita reprogramar
        ],
        default: 'propuesta'
    },
    locationOrLink: { // Enlace de la reunión virtual o lugar físico
        type: String,
        trim: true
    },
    summaryMentor: { // Resumen o notas del mentor después de la sesión
        type: String,
        trim: true
    },
    feedbackStudent: { // Feedback del estudiante después de la sesión
        type: String,
        trim: true
    },
    // Campos para eliminación lógica (si se necesita eliminar sesiones individualmente)
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true // createdAt y updatedAt
});

// Middleware para la eliminación lógica (si se aplica)
const autoPopulateIsDeleted = function(next) {
    const filter = this.getFilter();
    if (filter && typeof filter.isDeleted === 'undefined') { // Solo si isDeleted no está ya en el filtro
        this.where({ isDeleted: false });
    }
    next();
};

mentorshipSessionSchema.pre('find', autoPopulateIsDeleted);
mentorshipSessionSchema.pre('findOne', autoPopulateIsDeleted);
// findOneAndUpdate y countDocuments si también se necesitan filtrar.

// Auto-populate para referencias al buscar
const autoPopulateReferences = function(next) {
    this.populate('mentorshipRequest', 'title status'); // Solo algunos campos de la solicitud
    this.populate('mentor', 'nombre apellido email');
    this.populate('student', 'nombre apellido email');
    this.populate('proposedBy', 'nombre apellido rol');
    next();
};

mentorshipSessionSchema.pre('find', autoPopulateReferences);
mentorshipSessionSchema.pre('findOne', autoPopulateReferences);


const MentorshipSession = mongoose.model('MentorshipSession', mentorshipSessionSchema);

module.exports = MentorshipSession;