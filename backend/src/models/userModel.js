// backend/src/models/userModel.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); 
const crypto = require('crypto');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre es obligatorio.'],
        trim: true
    },
    apellido: {
        type: String,
        required: [true, 'El apellido es obligatorio.'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'El email es obligatorio.'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/.+\@.+\..+/, 'Por favor, introduce un email válido.']
    },
    password: {
        type: String,
        required: [true, 'La contraseña es obligatoria.'],
        minlength: [6, 'La contraseña debe tener al menos 6 caracteres.'],
        select: false // Para que la contraseña no se devuelva por defecto en las consultas
    },
    rol: {
        type: String,
        required: true,
        enum: ['estudiante', 'mentor', 'admin'],
        default: 'estudiante'
    },
    fotoPerfilUrl: {
        type: String,
        default: '' // Puedes poner una URL a una imagen de avatar por defecto aquí
    },
    // Campos para el perfil específico del rol (podrían ir en colecciones separadas y referenciadas)
    // Por simplicidad inicial, podríamos añadir algunos campos comunes aquí o decidir más tarde si se separan
    carrera: { // Aplicable a estudiantes y mentores
        type: String,
        trim: true,
        default: ''
    },
    cicloActual: { // Aplicable a estudiantes y mentores (mentores podrían ser de ciclos superiores o egresados)
        type: String, // Usamos String para flexibilidad (ej: "Egresado", "5to", "VI")
        trim: true,
        default: ''
    },
    especialidades: [{ // Específico para mentores, lista de áreas en las que pueden ayudar
        type: String,
        trim: true
    }],
    intereses: [{ // Específico para estudiantes, lista de intereses o áreas donde necesitan ayuda
        type: String,
        trim: true
    }],
    // Fin campos de perfil específico
    isVerified: { // Para verificación de email (opcional, pero buena práctica)
        type: Boolean,
        default: false
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true 
});


userSchema.pre('save', async function(next) {
   
    if (!this.isModified('password')) {
        return next();
    }
    
    const salt = await bcrypt.genSalt(10);
   
    this.password = await bcrypt.hash(this.password, salt);
    next();
});


userSchema.methods.comparePassword = async function(candidatePassword) {

    return await bcrypt.compare(candidatePassword, this.password);
};



const autoPopulateIsDeleted = function(next) {

    const filter = this.getFilter();
    if (filter && typeof filter.isDeleted === 'undefined') {
        this.where({ isDeleted: false });
    }
    next();
};


userSchema.methods.createPasswordResetToken = function() {

    const resetToken = crypto.randomBytes(32).toString('hex');


    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 mins en ms

    console.log({ resetToken }, this.passwordResetToken);

    return resetToken;
};

userSchema.pre('find', autoPopulateIsDeleted);
userSchema.pre('findOne', autoPopulateIsDeleted);
userSchema.pre('findOneAndUpdate', autoPopulateIsDeleted); 
userSchema.pre('countDocuments', autoPopulateIsDeleted);
userSchema.pre('count', autoPopulateIsDeleted); 





const User = mongoose.model('User', userSchema);

module.exports = User;