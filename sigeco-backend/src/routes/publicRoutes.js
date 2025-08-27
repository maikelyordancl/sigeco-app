const express = require('express');
const { param, body } = require('express-validator');
const router = express.Router();
const publicController = require('../controllers/publicController');
const upload = require('../middleware/upload');

// GET /api/public/campana/:slug (Existente)
router.get(
    '/campana/:slug',
    [
        param('slug').notEmpty().withMessage('La URL amigable (slug) no puede estar vacía.')
    ],
    publicController.getDatosPublicosCampana
);

// POST /api/public/verificar-contacto (Existente)
router.post(
    '/verificar-contacto',
    [
        body('email').isEmail().withMessage('Debe proporcionar un email válido.')
    ],
    publicController.verificarContactoPorEmail
);

// --- INICIO DE LA MODIFICACIÓN ---
// POST /api/public/inscripcion
router.post(
    '/inscripcion',
    upload.any(),
    [
        body('id_campana').isInt({ gt: 0 }),
        body('email').isEmail().withMessage('Debe ser un email válido.'),
        // Las demás validaciones son opcionales a nivel de ruta,
        // ya que el formulario dinámico las gestiona.
        body('nombre').optional({ checkFalsy: true }).isString(),
        body('telefono').optional({ checkFalsy: true }).isString(),
        body('pais').optional({ checkFalsy: true }).isString(),
        body('comuna').optional({ checkFalsy: true }).isString()
    ],
    publicController.crearInscripcionPublica
);
// --- FIN DE LA MODIFICACIÓN ---


// GET /api/public/pago/:token (Existente)
router.get('/pago/:token', publicController.getPagoByToken);

// POST /api/public/flow/confirmacion (Existente)
router.post('/flow/confirmacion', publicController.confirmarPagoFlow);

module.exports = router;