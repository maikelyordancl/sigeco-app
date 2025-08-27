const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors'); 

dotenv.config();
const app = express();

// --- CONFIGURACIÓN DE CORS RECOMENDADA ---
const allowedOrigins = [
    'https://sigeco.mindshot.cl', 
    'http://localhost:3000',      
    'http://51.75.40.103:3091'     
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Origen no permitido por CORS'));
    }
  },
  credentials: true, 
};

app.use(cors(corsOptions));

// Middlewares
app.use(express.json());
// --- LÍNEA AÑADIDA ---
// Añade este middleware para parsear cuerpos de petición URL-encoded
app.use(express.urlencoded({ extended: true }));

// --- Importación de Rutas ---
const authRoutes = require('./src/routes/authRoutes');
const eventoRoutes = require('./src/routes/eventoRoutes');
const subeventoRoutes = require('./src/routes/subeventoRoutes');
const contactoRoutes = require('./src/routes/contactoRoutes');
const baseDatosRoutes = require('./src/routes/baseDatosRoutes');
const campanasRoutes = require('./src/routes/campanasRoutes');
const ticketsRoutes = require('./src/routes/ticketsRoutes');
const publicRoutes = require('./src/routes/publicRoutes');
const acreditacionRoutes = require('./src/routes/acreditacionRoutes');
const uploadRoutes = require('./src/routes/uploadRoutes');
const eventoArchivosRoutes = require('./src/routes/eventoArchivosRoutes');

// --- Registro de Rutas en la Aplicación ---
app.use('/api/auth', authRoutes);
app.use('/api/eventos', eventoRoutes);
app.use('/api/subeventos', subeventoRoutes);
app.use('/api/contactos', contactoRoutes);
app.use('/api/basedatos', baseDatosRoutes);
app.use('/api/campanas', campanasRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/acreditacion', acreditacionRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/eventos', eventoArchivosRoutes);

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));