const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

// Cargar variables de entorno
dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// --- Importación de Rutas ---
const authRoutes = require('./src/routes/authRoutes');
const eventoRoutes = require('./src/routes/eventoRoutes');
const subeventoRoutes = require('./src/routes/subeventoRoutes');
const contactoRoutes = require('./src/routes/contactoRoutes');
const baseDatosRoutes = require('./src/routes/baseDatosRoutes');
const campanasRoutes = require('./src/routes/campanasRoutes');
const ticketsRoutes = require('./src/routes/ticketsRoutes');
const publicRoutes = require('./src/routes/publicRoutes');


// --- Registro de Rutas en la Aplicación ---

// Rutas de la API que requieren autenticación
app.use('/api/auth', authRoutes);
app.use('/api/eventos', eventoRoutes);
app.use('/api/subeventos', subeventoRoutes);
app.use('/api/contactos', contactoRoutes);
app.use('/api/basedatos', baseDatosRoutes);
app.use('/api/campanas', campanasRoutes);
app.use('/api/tickets', ticketsRoutes);

// Rutas Públicas (no requieren token)
// Se deben registrar después de las rutas de la API para evitar conflictos si hay rutas con nombres similares.
app.use('/api/public', publicRoutes);


const PORT = process.env.PORT || 8000;

app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
