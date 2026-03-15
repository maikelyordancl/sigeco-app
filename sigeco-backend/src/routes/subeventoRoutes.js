const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const subeventoController = require('../controllers/subeventoController');
const { verificarToken } = require('../controllers/authController');

router.use(verificarToken);

const optionalSubeventoFields = [
    body('ciudad').optional({ nullable: true }).trim().escape(),
    body('lugar').optional({ nullable: true }).trim().escape(),
    body('link_adicional').optional({ checkFalsy: true }).isURL().withMessage('El link adicional debe ser una URL válida.'),
    body('sitio_web').optional({ checkFalsy: true }).isURL().withMessage('El sitio web debe ser una URL válida.'),
    body('contacto_1_nombre').optional({ nullable: true }).isString().trim(),
    body('contacto_1_email').optional({ checkFalsy: true }).isEmail().withMessage('El correo del contacto 1 no es válido.').normalizeEmail(),
    body('contacto_1_telefono').optional({ nullable: true }).isString().trim(),
    body('contacto_2_nombre').optional({ nullable: true }).isString().trim(),
    body('contacto_2_email').optional({ checkFalsy: true }).isEmail().withMessage('El correo del contacto 2 no es válido.').normalizeEmail(),
    body('contacto_2_telefono').optional({ nullable: true }).isString().trim(),
    body('texto_libre').optional({ nullable: true }).isString(),
];

router.get(
    '/evento/:id_evento/sin-campana',
    [param('id_evento').isInt({ gt: 0 }).withMessage('El ID del evento debe ser un número válido.')],
    subeventoController.getSubeventosSinCampana
);

router.get(
    '/evento/:id_evento/campanas',
    [param('id_evento').isInt({ gt: 0 }).withMessage('El ID del evento debe ser un número válido.')],
    subeventoController.getSubeventosByEvento
);

router.get(
    '/',
    [query('id_evento').isInt({ min: 1 }).withMessage('El ID del evento es obligatorio y debe ser un número.')],
    subeventoController.getSubeventosByEvento
);

router.post(
    '/',
    [
        body('id_evento').isInt({ min: 1 }).withMessage('El ID del evento asociado es obligatorio.'),
        body('nombre').notEmpty().withMessage('El nombre del subevento es obligatorio.').trim().escape(),
        body('fecha_inicio').isISO8601().toDate().withMessage('La fecha de inicio debe ser una fecha válida.'),
        body('fecha_fin').isISO8601().toDate().withMessage('La fecha de fin debe ser una fecha válida.'),
        body('obligatorio_registro').isBoolean().withMessage('El campo de registro obligatorio debe ser un booleano.'),
        body('obligatorio_pago').isBoolean().withMessage('El campo de pago obligatorio debe ser un booleano.'),
        ...optionalSubeventoFields,
    ],
    subeventoController.createSubevento
);

router.put(
    '/:id',
    [
        param('id').isInt({ min: 1 }).withMessage('El ID del subevento en la URL debe ser válido.'),
        body('nombre').notEmpty().withMessage('El nombre del subevento es obligatorio.').trim().escape(),
        body('fecha_inicio').isISO8601().toDate().withMessage('La fecha de inicio debe ser una fecha válida.'),
        body('fecha_fin').isISO8601().toDate().withMessage('La fecha de fin debe ser una fecha válida.'),
        body('obligatorio_registro').optional().isBoolean().withMessage('El campo de registro obligatorio debe ser un booleano.'),
        body('obligatorio_pago').optional().isBoolean().withMessage('El campo de pago obligatorio debe ser un booleano.'),
        ...optionalSubeventoFields,
    ],
    subeventoController.updateSubevento
);

router.delete(
    '/:id',
    [param('id').isInt({ min: 1 }).withMessage('El ID del subevento debe ser un número válido.')],
    subeventoController.deleteSubevento
);

module.exports = router;
