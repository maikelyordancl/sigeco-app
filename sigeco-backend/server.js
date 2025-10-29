// sigeco-backend/server.js
const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');

dotenv.config();
const app = express();

// -------------------------
// CONFIGURACIÓN DE CORS
// -------------------------
const allowedOrigins = [
  'https://sigeco.mindshot.cl',
  'http://localhost:3000',
  'http://51.75.40.103:3091',
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Origen no permitido por CORS'));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));

// -------------------------
// SERVIR ARCHIVOS ESTÁTICOS
// -------------------------
app.use('/uploads', express.static(path.join(__dirname, 'src/public/uploads')));

// -------------------------
// IMPORTACIÓN DE RUTAS
// -------------------------
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
const permisosRoutes = require('./src/routes/permisosRoutes');
const usuarioRoutes = require('./src/routes/usuarioRoutes');

// -------------------------
// RUTA DE UPLOADS (SE MONTA ANTES DE PARSERS)
// -------------------------
// ⚠️ Esto evita que express.json() intente parsear el FormData
app.use('/api/upload', uploadRoutes);

// -------------------------
// MIDDLEWARES DE PARSING (solo JSON y x-www-form-urlencoded)
// -------------------------
app.use(express.json({
  limit: '100mb',
  type: ['application/json', 'application/*+json'],
}));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// -------------------------
// RESTO DE RUTAS DE LA APLICACIÓN
// -------------------------
app.use('/api/auth', authRoutes);
app.use('/api/eventos', eventoRoutes);
app.use('/api/subeventos', subeventoRoutes);
app.use('/api/contactos', contactoRoutes);
app.use('/api/basedatos', baseDatosRoutes);
app.use('/api/campanas', campanasRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/acreditacion', acreditacionRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/eventos', eventoArchivosRoutes);
app.use('/api/permisos', permisosRoutes);
app.use('/api/usuarios', usuarioRoutes);

// -------------------------
// INICIO DEL SERVIDOR
// -------------------------
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`✅ Servidor corriendo en el puerto ${PORT}`));
