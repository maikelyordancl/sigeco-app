const express = require('express');
const router = express.Router();
const { param, body } = require('express-validator');
const acreditacionController = require('../controllers/acreditacionController');
const { verificarToken } = require('../controllers/authController');

// >>> NUEVO <<<
const authorize = require('../middleware/authorize');

// Proteger todas las rutas
router.use(verificarToken);

// GET /api/acreditacion/campanas -> Obtiene eventos con sus campañas acreditables
router.get(
  '/campanas',
  // Solo lectura del módulo "acreditacion"; el middleware precalcula req.allowedEventIds
  authorize('acreditacion', 'read'),
  acreditacionController.getCampanasParaAcreditar
);

// GET /api/acreditacion/campana/:id_campana/asistentes_acreditacion -> SOLO USO ACREDITACION
router.get(
  '/campana/:id_campana/asistentes_acreditacion',
  [param('id_campana').isInt({ gt: 0 }).withMessage('ID de campaña no válido.')],
  // Leer acreditación sobre la campaña; el controller valida que la campaña pertenezca a un evento permitido
  authorize('acreditacion', 'read'),
  acreditacionController.getAsistentesAcreditacion
);

// GET /api/acreditacion/campana/:id_campana/asistentes -> Obtiene los asistentes de una campaña
router.get(
  '/campana/:id_campana/asistentes',
  [param('id_campana').isInt({ gt: 0 }).withMessage('ID de campaña no válido.')],
  // Leer acreditación sobre la campaña
  authorize('acreditacion', 'read'),
  acreditacionController.getAsistentes
);

// Nueva ruta para registrar un asistente en puerta
router.post(
  '/registrar-en-puerta/:id_campana',
  // Modifica acreditación ⇒ necesita 'update' sobre el evento de la campaña
  authorize('acreditacion', 'update'),
  acreditacionController.registrarEnPuerta
);

// PUT /api/acreditacion/inscripcion/:id_inscripcion/estado -> Actualiza el estado de un asistente
router.put(
  '/inscripcion/:id_inscripcion/estado',
  [
    param('id_inscripcion').isInt({ gt: 0 }).withMessage('ID de inscripción no válido.'),
    body('nuevo_estado')
      .isIn(['Asistió', 'Cancelado', 'Confirmado'])
      .withMessage('El nuevo estado no es válido.')
  ],
  // Modifica acreditación ⇒ necesita 'update' sobre el evento de la inscripción
  authorize('acreditacion', 'update'),
  acreditacionController.updateAsistencia
);

module.exports = router;
