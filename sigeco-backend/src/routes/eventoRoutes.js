const express = require('express');
const router = express.Router();
const { param, body } = require('express-validator');
const acreditacionController = require('../controllers/acreditacionController');
const { verificarToken } = require('../controllers/authController');

// ⬇️ NUEVO: coincide con tu patrón de eventos ('../middleware/authorize')
const authorize = require('../middleware/authorize');

// Proteger todas las rutas
router.use(verificarToken);

// GET /api/acreditacion/campanas -> Obtiene eventos con sus campañas acreditables
router.get(
  '/campanas',
  authorize('acreditacion', 'read'),
  acreditacionController.getCampanasParaAcreditar
);

// GET /api/acreditacion/campana/:id_campana/asistentes_acreditacion
router.get(
  '/campana/:id_campana/asistentes_acreditacion',
  [param('id_campana').isInt({ gt: 0 }).withMessage('ID de campaña no válido.')],
  authorize('acreditacion', 'read'), // el controller valida que la campaña pertenezca a un evento permitido
  acreditacionController.getAsistentesAcreditacion
);

// GET /api/acreditacion/campana/:id_campana/asistentes
router.get(
  '/campana/:id_campana/asistentes',
  [param('id_campana').isInt({ gt: 0 }).withMessage('ID de campaña no válido.')],
  authorize('acreditacion', 'read'),
  acreditacionController.getAsistentes
);

// Nueva ruta para registrar un asistente en puerta
router.post(
  '/registrar-en-puerta/:id_campana',
  authorize('acreditacion', 'update'),
  acreditacionController.registrarEnPuerta
);

// PUT /api/acreditacion/inscripcion/:id_inscripcion/estado -> Actualiza el estado de un asistente
router.put(
  '/inscripcion/:id_inscripcion/estado',
  [
    param('id_inscripcion').isInt({ gt: 0 }).withMessage('ID de inscripción no válido.'),
    body('nuevo_estado').isIn(['Asistió', 'Cancelado', 'Confirmado'])
      .withMessage('El nuevo estado no es válido.')
  ],
  authorize('acreditacion', 'update'),
  acreditacionController.updateAsistencia
);

module.exports = router;
