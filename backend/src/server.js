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
const PORT = process.env.PORT || 5000; 
app.listen(PORT, '0.0.0.0', () => { 
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});