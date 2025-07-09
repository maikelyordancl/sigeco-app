const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const subeventoController = require('../controllers/subeventoController');

// GET /api/subeventos?id_evento=:id  -> Obtener subeventos de un evento
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
        body('link_adicional').optional({ nullable: true }).isURL().withMessage('El link adicional debe ser una URL válida.'),
        body('sitio_web').optional({ nullable: true }).isURL().withMessage('El sitio web debe ser una URL válida.')
    ],
    subeventoController.createSubevento
);

// PUT /api/subeventos/:id -> Actualizar un subevento por ID
router.put(
    '/:id',
    [
        param('id').isInt({ min: 1 }).withMessage('El ID del subevento en la URL debe ser válido.'),
        // Se añaden las mismas validaciones del body que en el POST
        body('nombre').notEmpty().withMessage('El nombre del subevento es obligatorio.').trim().escape(),
        body('fecha_inicio').isISO8601().toDate().withMessage('La fecha de inicio debe ser una fecha válida.'),
        // ...puedes añadir el resto de validaciones del body aquí si lo deseas
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