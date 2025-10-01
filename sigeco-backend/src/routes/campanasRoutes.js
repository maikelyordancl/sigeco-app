const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();
const campanasController = require('../controllers/campanasController');
const formularioController = require('../controllers/formularioController'); // Importamos el nuevo controlador
const { verificarToken } = require('../controllers/authController');

// Proteger todas las rutas de campañas con autenticación JWT
router.use(verificarToken);

// --- RUTAS ESPECÍFICAS (DEBEN IR ANTES QUE LAS RUTAS CON PARÁMETROS) ---

// GET /api/campanas/listado-simple - Obtiene un listado simple de campañas para selectores.
router.get('/listado-simple', campanasController.getListadoSimple);

// GET /api/campanas/evento/:id_evento - Obtiene campañas por ID de evento.
router.get(
    '/evento/:id_evento',
    [
        param('id_evento').isInt({ gt: 0 }).withMessage('El ID del evento debe ser un número válido.')
    ],
    campanasController.obtenerCampanasPorEvento
);

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


// --- RUTAS GENERALES Y CON PARÁMETROS ---

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
        body('fecha_personalizada').optional({ nullable: true }).isString().withMessage('La fecha personalizada debe ser un texto.')
    ],
    campanasController.crearSubCampana
);

// GET /api/campanas/:id_campana/plantilla-importacion - Genera la plantilla de Excel para importar.
router.get(
    '/:id_campana/plantilla-importacion',
    [param('id_campana').isInt({ gt: 0 })],
    campanasController.generarPlantillaImportacion
);

// GET /api/campanas/:id_campana/formulario - Rutas de Formulario para una campaña.
router.get(
    '/:id_campana/formulario',
    [param('id_campana').isInt({ gt: 0 })],
    formularioController.getFormulario
);

// PUT /api/campanas/:id_campana/formulario
router.put(
    '/:id_campana/formulario',
    [
        param('id_campana').isInt({ gt: 0 }),
        body('campos').isArray().withMessage('La configuración de campos debe ser un array.')
    ],
    formularioController.updateFormulario
);

// GET /api/campanas/:id_campana/asistentes-v2 - Obtener asistentes con campos dinámicos
router.get(
    '/:id_campana/asistentes-v2',
    [
        param('id_campana').isInt({ gt: 0 }),
        query('page').optional().isInt({ min: 1 }).withMessage('La página debe ser un entero positivo.'),
        query('limit').optional().isInt({ min: 1 }).withMessage('El límite debe ser un entero positivo.'),
        // --- INICIO DE LA MODIFICACIÓN ---
        query('search').optional().isString().trim(),
        query('estado').optional().isString().trim()
        // --- FIN DE LA MODIFICACIÓN ---
    ],
    campanasController.getAsistentesConCampos
);

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

// POST /api/campanas/:id_campana/importar-inscripciones
router.post(
    '/:id_campana/importar-inscripciones',
    [
        param('id_campana').isInt({ gt: 0 }).withMessage('El ID de la campaña no es válido.'),
        body('contactos').isArray({ min: 1 }).withMessage('Se requiere un arreglo de contactos.')
    ],
    campanasController.importarInscripcionesDesdeExcel
);

// PUT /api/campanas/:id_campana/landing - Guarda el JSON de la landing page
router.put(
    '/:id_campana/landing',
    [
        param('id_campana').isInt({ gt: 0 }),
        body('landing_page_json').isJSON().withMessage('El contenido de la landing debe ser un JSON válido.')
    ],
    campanasController.guardarLanding
);

// PUT /api/campanas/:id_campana/template - Actualiza la plantilla de correo
router.put(
    '/:id_campana/template',
    [
        param('id_campana').isInt({ gt: 0 }).withMessage('El ID de la campaña debe ser un número válido.'),
        body('emailSubject').isString().withMessage('El asunto es requerido.'),
        body('emailBody').isString().withMessage('El cuerpo del correo es requerido.')
    ],
    campanasController.updateEmailTemplate
);

// GET /api/campanas/:id_campana - Obtener detalle de campaña (debe ir casi al final)
router.get(
    '/:id_campana',
    [
        param('id_campana').isInt({ gt: 0 }).withMessage('El ID de la campaña debe ser un número válido.')
    ],
    campanasController.obtenerDetalleCampana
);

// PUT /api/campanas/:id_campana - Actualizar campaña
router.put(
    '/:id_campana',
    [
        param('id_campana').isInt({ gt: 0 }).withMessage('El ID de la campaña debe ser un número válido.'),
        body('nombre').optional().isString().trim().notEmpty(),
        body('estado').optional().isIn(['Borrador', 'Activa', 'Pausada', 'Finalizada']),
        body('id_plantilla').optional().isInt({ min: 1, max: 2 }).withMessage('El ID de plantilla no es válido.'),
        body('fecha_personalizada').optional({ nullable: true }).isString().withMessage('La fecha personalizada debe ser un texto.')
    ],
    campanasController.actualizarCampana
);

// DELETE /api/campanas/:id_campana - Eliminar campaña
router.delete(
    '/:id_campana',
    [
        param('id_campana').isInt({ gt: 0 }).withMessage('El ID de la campaña debe ser un número válido.')
    ],
    campanasController.eliminarCampana
);


// --- RUTAS DE ASISTENTES (INSCRIPCIONES) ---

router.put('/asistentes/:id_inscripcion/estado', campanasController.updateAsistenteStatus);
router.put('/asistentes/:id_inscripcion/nota', campanasController.updateAsistenteNota);
router.put('/asistentes/:id_inscripcion/respuestas', campanasController.updateAsistenteRespuestas);
router.put('/asistentes/:id_inscripcion', campanasController.updateAsistenteCompleto);

router.delete(
    '/asistentes/:id_inscripcion',
    [param('id_inscripcion').isInt({ gt: 0 }).withMessage('El ID de la inscripción debe ser un número válido.')],
    campanasController.deleteAsistente
);


module.exports = router;