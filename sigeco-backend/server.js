const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');

// Cargar variables de entorno
dotenv.config();

// Rutas
const authRoutes = require('./src/routes/authRoutes');
const eventoRoutes = require('./src/routes/eventoRoutes');
const subeventoRoutes = require('./src/routes/subeventoRoutes');
const contactoRoutes = require('./src/routes/contactoRoutes');
const baseDatosRoutes = require('./src/routes/baseDatosRoutes');
// CORREGIDO: Las rutas ahora siguen la convención de tu proyecto.
const campanasRoutes = require('./src/routes/campanasRoutes.js');
const ticketsRoutes = require('./src/routes/ticketsRoutes.js');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
// Usar rutas
app.use('/api/auth', authRoutes);
app.use('/api/eventos', eventoRoutes);
app.use('/api/subeventos', subeventoRoutes); 
app.use('/api/contactos', contactoRoutes); 
app.use('/api/basedatos', baseDatosRoutes); 

// --- AÑADIDO: Registrar las nuevas rutas en la aplicación ---
app.use('/api/campanas', campanasRoutes);
app.use('/api/tickets', ticketsRoutes);
// ---------------------------------------------------------

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => console.log(`Servidor corriendo en el puerto ${PORT}`));
