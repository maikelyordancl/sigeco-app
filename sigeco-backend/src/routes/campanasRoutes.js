const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();
const campanasController = require('../controllers/campanasController');
const formularioController = require('../controllers/formularioController'); // Importamos el nuevo controlador
const { verificarToken } = require('../controllers/authController');

// Proteger todas las rutas de campañas con autenticación JWT
router.use(verificarToken);

// --- Rutas de Formulario ---
router.get(
    '/:id_campana/formulario',
    [param('id_campana').isInt({ gt: 0 })],
    formularioController.getFormulario
);

router.put(
    '/:id_campana/formulario',
    [
        param('id_campana').isInt({ gt: 0 }),
        body('campos').isArray().withMessage('La configuración de campos debe ser un array.')
    ],
    formularioController.updateFormulario
);


// POST /api/campanas - Crear una nueva sub-campaña
router.post(
    '/',
    [
        body('id_evento').isInt({ gt: 0 }).withMessage('El ID del evento es obligatorio.'),
        body('id_subevento').isInt({ gt: 0 }).withMessage('El ID del subevento es obligatorio.'),
        body('nombre').optional().isString().trim().notEmpty().withMessage('El nombre no puede estar vacío.'),
        body('url_amigable')
            .isString().trim().notEmpty().withMessage('La URL amigable no puede estar vacía.')
            .matches(/^[A-Za-z0-9-]+$/).withMessage('La URL amigable contiene caracteres no válidos.'),
        // --- NUEVA REGLA DE VALIDACIÓN ---
        body('fecha_personalizada').optional({ nullable: true }).isString().withMessage('La fecha personalizada debe ser un texto.')
    ],
    campanasController.crearSubCampana
);

// GET /api/campanas/evento/:id_evento
router.get(
    '/evento/:id_evento',
    [
        param('id_evento').isInt({ gt: 0 }).withMessage('El ID del evento debe ser un número válido.')
    ],
    campanasController.obtenerCampanasPorEvento
);

// GET /api/campanas/:id_campana
router.get(
    '/:id_campana',
    [
        param('id_campana').isInt({ gt: 0 }).withMessage('El ID de la campaña debe ser un número válido.')
    ],
    campanasController.obtenerDetalleCampana
);

// PUT /api/campanas/:id_campana
router.put(
    '/:id_campana',
    [
        param('id_campana').isInt({ gt: 0 }).withMessage('El ID de la campaña debe ser un número válido.'),
        body('nombre').optional().isString().trim().notEmpty(),
        body('estado').optional().isIn(['Borrador', 'Activa', 'Pausada', 'Finalizada']),
        body('id_plantilla').optional().isInt({ min: 1, max: 2 }).withMessage('El ID de plantilla no es válido.'),
        // --- NUEVA REGLA DE VALIDACIÓN ---
        body('fecha_personalizada').optional({ nullable: true }).isString().withMessage('La fecha personalizada debe ser un texto.')
    ],
    campanasController.actualizarCampana
);

// DELETE /api/campanas/:id_campana
router.delete(
    '/:id_campana',
    [
        param('id_campana').isInt({ gt: 0 }).withMessage('El ID de la campaña debe ser un número válido.')
    ],
    campanasController.eliminarCampana
);


// --- INICIO DE LA NUEVA LÓGICA ---
// POST /api/campanas/:id_campana/convocar - Añade contactos de bases de datos a una campaña
router.post(
    '/:id_campana/convocar',
    [
        param('id_campana').isInt({ gt: 0 }).withMessage('El ID de la campaña no es válido.'),
        body('bases_origen').isArray({ min: 1 }).withMessage('Debes seleccionar al menos una base de datos.'),
        body('bases_origen.*').isInt().withMessage('Los IDs de las bases de datos deben ser números.')
    ],
    campanasController.convocarContactos
);

router.put(
    '/:id_campana/landing',
    [
        param('id_campana').isInt({ gt: 0 }),
        body('landing_page_json').isJSON().withMessage('El contenido de la landing debe ser un JSON válido.')
    ],
    campanasController.guardarLanding
);
// --- FIN DE LA NUEVA LÓGICA ---

// POST /api/campanas/formulario/campos - Crear un nuevo campo personalizado
router.post(
    '/formulario/campos',
    [
        body('etiqueta').notEmpty().withMessage('La etiqueta es obligatoria.'),
        body('tipo_campo').isIn(['TEXTO_CORTO', 'PARRAFO', 'SELECCION_UNICA', 'CASILLAS', 'DESPLEGABLE', 'ARCHIVO']),
        body('opciones').optional().isArray()
    ],
    formularioController.crearCampo
);

// DELETE /api/campanas/formulario/campos/:id_campo - Eliminar un campo personalizado
router.delete(
    '/formulario/campos/:id_campo',
    [param('id_campo').isInt({ gt: 0 })],
    formularioController.eliminarCampo
);

// PUT /api/campanas/formulario/campos/:id_campo - Actualizar un campo personalizado
router.put(
    '/formulario/campos/:id_campo',
    [
        param('id_campo').isInt({ gt: 0 }),
        body('etiqueta').notEmpty().withMessage('La etiqueta es obligatoria.'),
        body('opciones').optional().isArray()
    ],
    formularioController.actualizarCampo
);

// Agrega esta línea en /src/routes/campanasRoutes.js, por ejemplo, después de la ruta para obtener asistentes.
router.get(
    '/:id_campana/asistentes-v2', 
    [
        param('id_campana').isInt({ gt: 0 }),
        query('page').optional().isInt({ min: 1 }).withMessage('La página debe ser un entero positivo.'),
        query('limit').optional().isInt({ min: 1 }).withMessage('El límite debe ser un entero positivo.')
    ],
    campanasController.getAsistentesConCampos
);
router.put('/asistentes/:id_inscripcion/estado', campanasController.updateAsistenteStatus);
router.put('/asistentes/:id_inscripcion/nota', campanasController.updateAsistenteNota);
router.get('/:id_campana/formulario', formularioController.getCamposPorCampana);
router.put('/asistentes/:id_inscripcion/respuestas', campanasController.updateAsistenteRespuestas);

router.put('/asistentes/:id_inscripcion', campanasController.updateAsistenteCompleto);
router.delete(
    '/asistentes/:id_inscripcion',
    [param('id_inscripcion').isInt({ gt: 0 }).withMessage('El ID de la inscripción debe ser un número válido.')],
    campanasController.deleteAsistente
);

// NUEVA RUTA para actualizar la plantilla de correo
router.put(
    '/:id_campana/template',
    [
        param('id_campana').isInt({ gt: 0 }).withMessage('El ID de la campaña debe ser un número válido.'),
        body('emailSubject').isString().withMessage('El asunto es requerido.'),
        body('emailBody').isString().withMessage('El cuerpo del correo es requerido.')
    ],
    campanasController.updateEmailTemplate
);


module.exports = router;