// backend/src/models/userModel.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Usaremos bcryptjs que es más fácil de instalar en algunos entornos
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
    timestamps: true // Añade createdAt y updatedAt
});

// Middleware: Hashear la contraseña ANTES de guardar (si ha sido modificada)
userSchema.pre('save', async function(next) {
    // Solo hashear la contraseña si ha sido modificada (o es nueva)
    if (!this.isModified('password')) {
        return next();
    }
    // Generar un "salt"
    const salt = await bcrypt.genSalt(10);
    // Hashear la contraseña con el salt
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Método para comparar la contraseña ingresada con la hasheada en la DB
userSchema.methods.comparePassword = async function(candidatePassword) {
    // 'this.password' no estaría disponible aquí si 'select: false' no se anula explícitamente
    // al hacer la query del usuario. Por eso, en el login, se debe pedir explícitamente.
    return await bcrypt.compare(candidatePassword, this.password);
};


// Middleware para la eliminación lógica: no mostrar documentos eliminados en las búsquedas find*
// Esto es útil para que por defecto las consultas no traigan los "eliminados"
// Se puede sobreescribir si explícitamente se quiere buscar también entre los eliminados.
const autoPopulateIsDeleted = function(next) {
    // Solo aplicar si la query no tiene explícitamente una condición para isDeleted
    // Esto permite buscar los borrados si es necesario, ej: this.find({ isDeleted: true })
    const filter = this.getFilter();
    if (filter && typeof filter.isDeleted === 'undefined') {
        this.where({ isDeleted: false });
    }
    next();
};

userSchema.pre('find', autoPopulateIsDeleted);
userSchema.pre('findOne', autoPopulateIsDeleted);
userSchema.pre('findOneAndUpdate', autoPopulateIsDeleted); // Asegúrate de que esto no interfiera con "eliminar" lógicamente
userSchema.pre('countDocuments', autoPopulateIsDeleted);
userSchema.pre('count', autoPopulateIsDeleted); // Para versiones más antiguas de Mongoose


// Si usas findOneAndUpdate para "eliminar" (set isDeleted: true),
// el middleware pre('findOneAndUpdate') podría impedir que encuentres el doc para actualizarlo.
// Una estrategia para el soft delete es tener un método en el modelo o manejarlo en el servicio/controlador.
// Por ejemplo, para actualizar isDeleted a true, la query no debería ser filtrada por isDeleted:false.

// Creación del modelo
const User = mongoose.model('User', userSchema);

module.exports = User;