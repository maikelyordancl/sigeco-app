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
        body('nombre_base')
            .notEmpty()
            .withMessage('El nombre de la base es obligatorio.')
            .trim()
            .escape(),

        body('contactos')
            .isArray({ min: 1 })
            .withMessage('Debe haber al menos un contacto para importar.'),

        // Solo validamos el email si se envía, no el nombre
        body('contactos.*.email')
            .optional({ checkFalsy: true })
            .isEmail()
            .withMessage('El email del contacto no es válido.')
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

// --- **NUEVA RUTA PARA ASIGNAR CONTACTOS** ---
router.post(
    '/asignar',
    [
        body('contactIds').isArray({ min: 1 }).withMessage('Se requiere al menos un contacto.'),
        body('baseIds').isArray({ min: 1 }).withMessage('Se requiere al menos una base de datos.'),
        body('contactIds.*').isInt().withMessage('Los IDs de contacto deben ser números.'),
        body('baseIds.*').isInt().withMessage('Los IDs de las bases deben ser números.')
    ],
    baseDatosController.assignContactsToBase
);

// DELETE /api/basedatos/:id -> Eliminar una base de datos
router.delete(
    '/:id',
    [ param('id').isInt({ min: 1 }).withMessage('El ID de la base no es válido.') ],
    baseDatosController.deleteBaseDatos
);

module.exports = router;