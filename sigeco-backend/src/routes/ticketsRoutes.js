const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const ticketsController = require('../controllers/ticketsController');

// CORREGIDO: Importamos 'verificarToken' desde el controlador de autenticación correcto
// y usamos llaves {} porque el archivo ahora exporta múltiples funciones.
const { verificarToken } = require('../controllers/authController');

// Proteger todas las rutas de tickets
router.use(verificarToken);

// --- Rutas para Tickets ---

// GET /api/tickets/campana/:id_campana - Obtener todos los tickets de una campaña
router.get(
    '/campana/:id_campana',
    [
        param('id_campana').isInt({ gt: 0 }).withMessage('El ID de la campaña debe ser un número válido.')
    ],
    // CORREGIDO: Se ha estandarizado el nombre de la función sin la 'ñ'.
    ticketsController.obtenerTicketsPorCampana
);

// POST /api/tickets/campana/:id_campana - Crear un nuevo ticket para una campaña
router.post(
    '/campana/:id_campana',
    [
        param('id_campana').isInt({ gt: 0 }).withMessage('El ID de la campaña es inválido.'),
        body('nombre').isString().trim().notEmpty().withMessage('El nombre del ticket es obligatorio.'),
        body('precio').isDecimal().withMessage('El precio debe ser un número decimal.'),
        body('cantidad_total').optional({ nullable: true }).isInt({ gt: 0 }).withMessage('La cantidad debe ser un número entero positivo.')
    ],
    ticketsController.crearTicket
);

// PUT /api/tickets/:id_ticket - Actualizar un ticket
router.put(
    '/:id_ticket',
    [
        param('id_ticket').isInt({ gt: 0 }).withMessage('El ID del ticket es inválido.'),
        body('nombre').optional().isString().trim().notEmpty(),
        body('precio').optional().isDecimal(),
        body('cantidad_total').optional({ nullable: true }).isInt({ gt: 0 })
    ],
    ticketsController.actualizarTicket
);

// DELETE /api/tickets/:id_ticket - Eliminar un ticket
router.delete(
    '/:id_ticket',
    [
        param('id_ticket').isInt({ gt: 0 }).withMessage('El ID del ticket es inválido.')
    ],
    ticketsController.eliminarTicket
);

module.exports = router;
