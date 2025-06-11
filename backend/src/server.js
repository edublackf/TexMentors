// backend/src/server.js

// Importar módulos necesarios
require('dotenv').config(); // Carga las variables de entorno desde .env
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const helpTypeRoutes = require('./routes/helpTypeRoutes');
const mentorshipRequestRoutes = require('./routes/mentorshipRequestRoutes');
const mentorshipSessionRoutes = require('./routes/mentorshipSessionRoutes');

// Inicializar la aplicación Express
const app = express();


const allowedOrigins = [
    'http://localhost:5173', // Tu frontend local (Vite)
    'http://localhost:3000', // Tu frontend local (CRA, si aplica)
    // AÑADIRÁS LA URL DE VERCEL AQUÍ CUANDO LA TENGAS
    // Ejemplo: 'https://texmentors-frontend.vercel.app' 
];

const corsOptions = {
    origin: function (origin, callback) {
        // Permitir peticiones sin 'origin' (como Postman, apps móviles, o curl) Y las de la whitelist
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true, // Si usas cookies o cabeceras de autorización que necesiten esto
};
app.use(cors(corsOptions));

// Middlewares
app.use(cors()); // Habilita CORS para todas las rutas
app.use(express.json()); // Para parsear JSON en las peticiones (req.body)
app.use(express.urlencoded({ extended: true })); // Para parsear datos de formularios URL-encoded

// Conexión a MongoDB usando Mongoose
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
.then(() => {
  console.log('Conectado a MongoDB Atlas!'); // Mensaje más específico
})
.catch((err) => {
  console.error('Error al conectar a MongoDB:', err.message);
  // process.exit(1); // Puedes descomentar esto si quieres que la app termine si no conecta
});

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('¡Hola Mundo desde el backend de TexMentors!');
});

// TODO: Aquí irán nuestras rutas para usuarios, mentorías, etc.
// const userRoutes = require('./routes/userRoutes');
// app.use('/api/users', userRoutes);

app.use('/api/auth', authRoutes);

app.use('/api/users', userRoutes);

app.use('/api/helptypes', helpTypeRoutes);

app.use('/api/mentorship-requests', mentorshipRequestRoutes);

app.use('/api/sessions', mentorshipSessionRoutes); 

// Definir el puerto y arrancar el servidor
const PORT = process.env.PORT || 5001; // Usar el puerto de .env o 5001 por defecto
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});