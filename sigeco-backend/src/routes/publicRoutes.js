const express = require('express');
const { param, body } = require('express-validator'); // Añadimos 'body'
const router = express.Router();
const publicController = require('../controllers/publicController');

// GET /api/public/campana/:slug (Existente)
router.get(
    '/campana/:slug',
    [
        param('slug').notEmpty().withMessage('La URL amigable (slug) no puede estar vacía.')
    ],
    publicController.getDatosPublicosCampana
);

// --- RUTA NUEVA ---
// POST /api/public/inscripcion - Para registrar a un nuevo asistente
router.post(
    '/inscripcion',
    [
        // Validamos los datos que llegan del formulario
        body('id_campana').isInt({ gt: 0 }),
        body('nombre').notEmpty().withMessage('El nombre es obligatorio.'),
        body('apellido').notEmpty().withMessage('El apellido es obligatorio.'),
        body('email').isEmail().withMessage('Debe ser un email válido.'),
        body('telefono').notEmpty().withMessage('El teléfono es obligatorio.'),
        body('rut').notEmpty().withMessage('El RUT es obligatorio.'),
        body('pais').notEmpty().withMessage('El país es obligatorio.'),
        // Campos opcionales no necesitan validación estricta aquí
    ],
    publicController.crearInscripcionPublica
);


module.exports = router;