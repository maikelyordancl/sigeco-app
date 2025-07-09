const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const baseDatosController = require('../controllers/baseDatosController');

// GET /api/basedatos -> Obtener todas las bases de datos
router.get('/', baseDatosController.getAllBasesDatos);

// POST /api/basedatos/importar -> Importar contactos a una nueva base
router.post(
    '/importar',
    [
        body('nombre_base').notEmpty().withMessage('El nombre de la base es obligatorio.').trim().escape(),
        body('contactos').isArray({ min: 1 }).withMessage('Debe haber al menos un contacto para importar.'),
        // Validación básica para el primer contacto del array como muestra
        body('contactos.*.nombre').notEmpty().withMessage('El nombre del contacto es obligatorio.'),
        body('contactos.*.email').isEmail().withMessage('El email del contacto no es válido.')
    ],
    baseDatosController.importarContactos
);

// POST /api/basedatos/fusionar -> Fusionar bases existentes
router.post(
    '/fusionar',
    [
        body('nombre').notEmpty().withMessage('El nombre de la nueva base es obligatorio.').trim().escape(),
        body('bases_origen').isArray({ min: 1 }).withMessage('Debes seleccionar al menos una base de datos para fusionar.'),
        body('bases_origen.*').isInt().withMessage('Los IDs de las bases deben ser números.')
    ],
    baseDatosController.fusionarBases
);

// DELETE /api/basedatos/:id -> Eliminar una base de datos
router.delete(
    '/:id',
    [ param('id').isInt({ min: 1 }).withMessage('El ID de la base no es válido.') ],
    baseDatosController.deleteBaseDatos
);

module.exports = router;
