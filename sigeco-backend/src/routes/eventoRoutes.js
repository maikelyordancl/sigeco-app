const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const eventoController = require('../controllers/eventoController');
// --- LÍNEA EXISTENTE ---
const { verificarToken } = require('../controllers/authController');

// --- NUEVO ---
const authorize = require('../middleware/authorize');

// --- EXISTENTE ---
// Proteger todas las rutas de este fichero con autenticación
router.use(verificarToken);

// GET /api/eventos -> Obtener todos los eventos
router.get(
  '/',
  // --- NUEVO: lectura del módulo 'eventos' (filtra dentro del controller)
  authorize('eventos', 'read'),
  eventoController.getAllEventos
);

router.get(
  '/:id',
  [
    param('id').isInt({ min: 1 }).withMessage('El ID del evento debe ser un número entero válido.')
  ],
  // --- NUEVO: lectura sobre un evento específico
  authorize('eventos', 'read'),
  eventoController.getEventoById
);

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
  // --- NUEVO: crear evento
  authorize('eventos', 'create'),
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
  // --- NUEVO: actualizar evento (authorize detecta ?id=... por req.query)
  authorize('eventos', 'update'),
  eventoController.updateEvento
);

// DELETE /api/eventos/:id -> Eliminar un evento con validación
router.delete(
  '/:id',
  [
    param('id').isInt({ min: 1 }).withMessage('El ID del evento debe ser un número entero válido.')
  ],
  // --- NUEVO: eliminar evento
  authorize('eventos', 'delete'),
  eventoController.deleteEvento
);

module.exports = router;
