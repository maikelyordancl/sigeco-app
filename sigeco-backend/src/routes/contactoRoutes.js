const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const contactoController = require('../controllers/contactoController');
const { validarRut } = require('../utils/validationUtils');

// GET /api/contactos -> Obtener todos los contactos con paginación y búsqueda
router.get(
    '/',
    [
        query('page').optional().isInt({ min: 1 }).withMessage('La página debe ser un número positivo.'),
        query('limit').optional().isInt({ min: 1 }).withMessage('El límite debe ser un número positivo.'),
        query('search').optional().trim().escape()
    ],
    contactoController.getAllContactos
);

// GET /api/contactos/sin-base -> Obtener contactos sin base de datos
router.get('/sin-base', contactoController.getOrphanedContactos);

// Reglas de validación reutilizables para el cuerpo de la petición
const contactoValidationRules = [
    body('nombre').optional({ checkFalsy: true }).isString().withMessage('El nombre debe ser texto.').trim().escape(),
    body('email').isEmail().withMessage('Debe ser un email válido.').normalizeEmail(),
    body('telefono').notEmpty().withMessage('El teléfono es obligatorio.').matches(/^[0-9+\s()-]+$/).withMessage('El formato del teléfono no es válido.'),
    body('rut')
        .optional({ checkFalsy: true })
        .custom(value => {
            if (value && !validarRut(value)) {
                throw new Error('El RUT ingresado no es válido. Recuerde sin puntos y con guion.');
            }
            return true;
        }),
    body('pais').notEmpty().withMessage('El país es obligatorio.').trim().escape(),
    body('comuna').optional({ checkFalsy: true }).trim().escape(),
    body('recibir_mail').isBoolean().withMessage('El campo recibir_mail debe ser booleano.'),
    body('empresa').optional({ checkFalsy: true }).trim().escape(),
    body('actividad').optional({ checkFalsy: true }).trim().escape(),
    body('profesion').optional({ checkFalsy: true }).trim().escape()
];

// POST /api/contactos -> Crear un nuevo contacto
router.post('/', contactoValidationRules, contactoController.createContacto);

// PUT /api/contactos/:id -> Actualizar un contacto por ID
router.put(
    '/:id',
    [
        param('id').isInt({ min: 1 }).withMessage('El ID de contacto no es válido.'),
        ...contactoValidationRules // Reutilizamos las mismas reglas de validación
    ],
    contactoController.updateContacto
);

// DELETE /api/contactos/:id -> Eliminar un contacto por ID
router.delete(
    '/:id',
    [ param('id').isInt({ min: 1 }).withMessage('El ID de contacto no es válido.') ],
    contactoController.deleteContacto
);

router.get('/email/:email', contactoController.getContactoByEmail);

module.exports = router;