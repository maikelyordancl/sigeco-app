const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const eventoController = require('../controllers/eventoController');
// --- LÍNEA AÑADIDA ---
const { verificarToken } = require('../controllers/authController');

// --- LÍNEA AÑADIDA ---
// Proteger todas las rutas de este fichero con autenticación
router.use(verificarToken);

// GET /api/eventos -> Obtener todos los eventos
router.get('/', eventoController.getAllEventos);

// POST /api/eventos -> Crear un nuevo evento con validación
router.post(
    '/',
    [
        body('nombre').notEmpty().withMessage('El nombre es obligatorio.').trim().escape(),
        body('fecha_inicio').isISO8601().toDate().withMessage('La fecha de inicio debe ser una fecha válida.'),
        body('fecha_fin').isISO8601().toDate().withMessage('La fecha de fin debe ser una fecha válida.'),
        body('ciudad').notEmpty().withMessage('La ciudad es obligatoria.').trim().escape(),
        body('lugar').notEmpty().withMessage('El lugar es obligatorio.').trim().escape(),
        body('presupuesto_marketing').isFloat({ min: 0 }).withMessage('El presupuesto debe ser un número positivo.').optional({ nullable: true }),
        body('estado').isInt({ min: 1, max: 4 }).withMessage('El estado no es válido.')
    ],
    eventoController.createEvento
);

// PUT /api/eventos?id=:id -> Actualizar un evento con validación
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
        body('estado').isInt({ min: 1, max: 4 }).withMessage('El estado no es válido.')
    ],
    eventoController.updateEvento
);

// DELETE /api/eventos/:id -> Eliminar un evento con validación
router.delete(
    '/:id',
    [
        param('id').isInt({ min: 1 }).withMessage('El ID del evento debe ser un número entero válido.')
    ],
    eventoController.deleteEvento
);

module.exports = router;