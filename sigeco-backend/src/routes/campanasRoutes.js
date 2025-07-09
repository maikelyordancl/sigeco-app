const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const campanasController = require('../controllers/campanasController');

// CORREGIDO: Importamos 'verificarToken' desde el controlador de autenticación correcto
// y usamos llaves {} porque el archivo ahora exporta múltiples funciones.
const { verificarToken } = require('../controllers/authController');

// Proteger todas las rutas de campañas con autenticación JWT
router.use(verificarToken);

// --- El resto de tus rutas (sin cambios) ---

// POST /api/campanas - Crear una nueva sub-campaña
router.post(
    '/',
    [
        body('id_evento').isInt({ gt: 0 }).withMessage('El ID del evento es obligatorio.'),
        body('id_subevento').isInt({ gt: 0 }).withMessage('El ID del subevento es obligatorio.'),
        body('nombre').optional().isString().trim().notEmpty().withMessage('El nombre no puede estar vacío.'),
        body('tipo_acceso').isIn(['Gratuito', 'De Pago']).withMessage("El tipo de acceso debe ser 'Gratuito' o 'De Pago'.")
    ],
    campanasController.crearSubCampana
);

// GET /api/campanas/evento/:id_evento
router.get(
    '/evento/:id_evento',
    [
        param('id_evento').isInt({ gt: 0 }).withMessage('El ID del evento debe ser un número válido.')
    ],
    campanasController.obtenerCampanasPorEvento
);

// GET /api/campanas/:id_campana
router.get(
    '/:id_campana',
    [
        param('id_campana').isInt({ gt: 0 }).withMessage('El ID de la campaña debe ser un número válido.')
    ],
    campanasController.obtenerDetalleCampana
);

// PUT /api/campanas/:id_campana
router.put(
    '/:id_campana',
    [
        param('id_campana').isInt({ gt: 0 }).withMessage('El ID de la campaña debe ser un número válido.'),
        body('nombre').optional().isString().trim().notEmpty(),
        body('estado').optional().isIn(['Borrador', 'Activa', 'Pausada', 'Finalizada'])
    ],
    campanasController.actualizarCampana
);

// DELETE /api/campanas/:id_campana
router.delete(
    '/:id_campana',
    [
        param('id_campana').isInt({ gt: 0 }).withMessage('El ID de la campaña debe ser un número válido.')
    ],
    campanasController.eliminarCampana
);

module.exports = router;
