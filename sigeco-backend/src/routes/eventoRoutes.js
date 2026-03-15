const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const eventoController = require('../controllers/eventoController');
const { verificarToken } = require('../controllers/authController');
const authorize = require('../middleware/authorize');

router.use(verificarToken);

const optionalEventFields = [
  body('link_drive').optional({ checkFalsy: true }).isURL().withMessage('El link drive debe ser una URL válida.'),
  body('contacto_1_nombre').optional({ nullable: true }).isString().trim(),
  body('contacto_1_email').optional({ checkFalsy: true }).isEmail().withMessage('El correo del contacto 1 no es válido.').normalizeEmail(),
  body('contacto_1_telefono').optional({ nullable: true }).isString().trim(),
  body('contacto_2_nombre').optional({ nullable: true }).isString().trim(),
  body('contacto_2_email').optional({ checkFalsy: true }).isEmail().withMessage('El correo del contacto 2 no es válido.').normalizeEmail(),
  body('contacto_2_telefono').optional({ nullable: true }).isString().trim(),
];

router.get(
  '/',
  authorize('eventos', 'read'),
  eventoController.getAllEventos
);

router.get(
  '/:id',
  [param('id').isInt({ min: 1 }).withMessage('El ID del evento debe ser un número entero válido.')],
  authorize('eventos', 'read'),
  eventoController.getEventoById
);

router.post(
  '/',
  [
    body('nombre').notEmpty().withMessage('El nombre es obligatorio.').trim().escape(),
    body('fecha_inicio').isISO8601().toDate().withMessage('La fecha de inicio debe ser una fecha válida.'),
    body('fecha_fin').isISO8601().toDate().withMessage('La fecha de fin debe ser una fecha válida.'),
    body('ciudad').notEmpty().withMessage('La ciudad es obligatoria.').trim().escape(),
    body('lugar').notEmpty().withMessage('El lugar es obligatorio.').trim().escape(),
    body('presupuesto_marketing').isFloat({ min: 0 }).withMessage('El presupuesto debe ser un número positivo.').optional({ nullable: true }),
    body('estado').isInt({ min: 1, max: 4 }).withMessage('El estado no es válido.'),
    ...optionalEventFields,
  ],
  authorize('eventos', 'create'),
  eventoController.createEvento
);

router.put(
  '/',
  [
    query('id').isInt({ min: 1 }).withMessage('El ID del evento debe ser un número entero válido.'),
    body('nombre').notEmpty().withMessage('El nombre es obligatorio.').trim().escape(),
    body('fecha_inicio').isISO8601().toDate().withMessage('La fecha de inicio debe ser una fecha válida.'),
    body('fecha_fin').isISO8601().toDate().withMessage('La fecha de fin debe ser una fecha válida.'),
    body('ciudad').notEmpty().withMessage('La ciudad es obligatoria.').trim().escape(),
    body('lugar').notEmpty().withMessage('El lugar es obligatorio.').trim().escape(),
    body('presupuesto_marketing').isFloat({ min: 0 }).withMessage('El presupuesto debe ser un número positivo.').optional({ nullable: true }),
    body('estado').isInt({ min: 1, max: 4 }).withMessage('El estado no es válido.'),
    ...optionalEventFields,
  ],
  authorize('eventos', 'update'),
  eventoController.updateEvento
);

router.delete(
  '/:id',
  [param('id').isInt({ min: 1 }).withMessage('El ID del evento debe ser un número entero válido.')],
  authorize('eventos', 'delete'),
  eventoController.deleteEvento
);

module.exports = router;
