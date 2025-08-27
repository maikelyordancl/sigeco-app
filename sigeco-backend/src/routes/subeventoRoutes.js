const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const subeventoController = require('../controllers/subeventoController');
const { verificarToken } = require('../controllers/authController');

// Proteger todas las rutas con autenticación
router.use(verificarToken);

// --- AÑADIDO: Ruta para obtener subeventos sin campaña ---
// GET /api/subeventos/evento/:id_evento/sin-campana
router.get(
    '/evento/:id_evento/sin-campana',
    [
        param('id_evento').isInt({ gt: 0 }).withMessage('El ID del evento debe ser un número válido.')
    ],
    subeventoController.getSubeventosSinCampana
);

// --- AÑADIDO: Ruta para obtener subeventos sin campaña ---
// GET /api/subeventos/evento/:id_evento/sin-campana
router.get(
    '/evento/:id_evento/campanas',
    [
        param('id_evento').isInt({ gt: 0 }).withMessage('El ID del evento debe ser un número válido.')
    ],
    subeventoController.getSubeventosByEvento
);


// GET /api/subeventos?id_evento=:id  -> Obtener todos los subeventos de un evento
router.get(
    '/',
    [ query('id_evento').isInt({ min: 1 }).withMessage('El ID del evento es obligatorio y debe ser un número.') ],
    subeventoController.getSubeventosByEvento
);

// POST /api/subeventos -> Crear un nuevo subevento
router.post(
    '/',
    [
        body('id_evento').isInt({ min: 1 }).withMessage('El ID del evento asociado es obligatorio.'),
        body('nombre').notEmpty().withMessage('El nombre del subevento es obligatorio.').trim().escape(),
        body('fecha_inicio').isISO8601().toDate().withMessage('La fecha de inicio debe ser una fecha válida.'),
        body('fecha_fin').isISO8601().toDate().withMessage('La fecha de fin debe ser una fecha válida.'),
        body('obligatorio_registro').isBoolean().withMessage('El campo de registro obligatorio debe ser un booleano.'),
        body('obligatorio_pago').isBoolean().withMessage('El campo de pago obligatorio debe ser un booleano.'),
        // Validaciones opcionales
        body('ciudad').optional({ nullable: true }).trim().escape(),
        body('lugar').optional({ nullable: true }).trim().escape(),
        body('link_adicional').optional({ checkFalsy: true }).isURL().withMessage('El link adicional debe ser una URL válida.'),
        body('sitio_web').optional({ checkFalsy: true }).isURL().withMessage('El sitio web debe ser una URL válida.')
    ],
    subeventoController.createSubevento
);

// PUT /api/subeventos/:id -> Actualizar un subevento por ID
router.put(
    '/:id',
    [
        param('id').isInt({ min: 1 }).withMessage('El ID del subevento en la URL debe ser válido.'),
        body('nombre').notEmpty().withMessage('El nombre del subevento es obligatorio.').trim().escape(),
        body('fecha_inicio').isISO8601().toDate().withMessage('La fecha de inicio debe ser una fecha válida.'),
        body('link_adicional').optional({ checkFalsy: true }).isURL().withMessage('El link adicional debe ser una URL válida.'),
        body('sitio_web').optional({ checkFalsy: true }).isURL().withMessage('El sitio web debe ser una URL válida.')
    ],
    subeventoController.updateSubevento
);

// DELETE /api/subeventos/:id -> Eliminar un subevento por ID
router.delete(
    '/:id',
    [ param('id').isInt({ min: 1 }).withMessage('El ID del subevento debe ser un número válido.') ],
    subeventoController.deleteSubevento
);

module.exports = router;
