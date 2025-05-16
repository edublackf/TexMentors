// backend/src/models/helpTypeModel.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const helpTypeSchema = new Schema({
    name: {
        type: String,
        required: [true, 'El nombre del tipo de ayuda es obligatorio.'],
        trim: true,
        unique: true // Aseguramos que los nombres de los tipos de ayuda sean únicos
    },
    description: {
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

// Middleware para la eliminación lógica (opcional, pero consistente con UserModel)
const autoPopulateIsDeleted = function(next) {
    const filter = this.getFilter();
    if (filter && typeof filter.isDeleted === 'undefined') {
        this.where({ isDeleted: false });
    }
    next();
};

helpTypeSchema.pre('find', autoPopulateIsDeleted);
helpTypeSchema.pre('findOne', autoPopulateIsDeleted);
helpTypeSchema.pre('findOneAndUpdate', autoPopulateIsDeleted);
helpTypeSchema.pre('countDocuments', autoPopulateIsDeleted);
helpTypeSchema.pre('count', autoPopulateIsDeleted);


const HelpType = mongoose.model('HelpType', helpTypeSchema);

module.exports = HelpType;