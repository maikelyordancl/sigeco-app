const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');

const { verificarToken } = require('../controllers/authController');
const authorize = require('../middleware/authorize');
const permisosController = require('../controllers/permisosController');

// Autenticado siempre
router.use(verificarToken);

// Solo super admin / módulo permisos
router.use(authorize('permisos', 'update'));

/**
 * ROLES
 */
// GET /api/permisos/roles -> Lista roles
router.get('/roles', permisosController.getRoles);

// POST /api/permisos/roles -> Crea rol
router.post(
  '/roles',
  [body('name').trim().isLength({ min: 2 }).withMessage('Nombre de rol inválido.')],
  permisosController.createRole
);

/**
 * USER-ROLES
 */
// POST /api/permisos/user-roles -> Asignar rol a usuario
router.post(
  '/user-roles',
  [
    body('user_id').isInt({ gt: 0 }).withMessage('user_id inválido.'),
    body('role_id').isInt({ gt: 0 }).withMessage('role_id inválido.')
  ],
  permisosController.assignUserRole
);

// DELETE /api/permisos/user-roles -> Quitar rol a usuario
router.delete(
  '/user-roles',
  [
    query('user_id').isInt({ gt: 0 }).withMessage('user_id inválido.'),
    query('role_id').isInt({ gt: 0 }).withMessage('role_id inválido.')
  ],
  permisosController.removeUserRole
);

/**
 * PERMISOS POR EVENTO (scopes)
 */
// GET /api/permisos/event -> Lista permisos por evento de un usuario
router.get(
  '/event',
  [query('user_id').isInt({ gt: 0 }).withMessage('user_id inválido.')],
  permisosController.getUserEventPermissions
);

// POST /api/permisos/event -> Crear/otorgar permiso por evento
router.post(
  '/event',
  [
    body('user_id').isInt({ gt: 0 }).withMessage('user_id inválido.'),
    body('event_id').isInt({ gt: 0 }).withMessage('event_id inválido.'),
    body('module').isString().trim().isLength({ min: 1 }).withMessage('module requerido.'),
    body('can_read').optional().isIn([0, 1]),
    body('can_create').optional().isIn([0, 1]),
    body('can_update').optional().isIn([0, 1]),
    body('can_delete').optional().isIn([0, 1]),
  ],
  permisosController.upsertUserEventPermission
);

// PUT /api/permisos/event -> Actualizar permiso por evento
router.put(
  '/event',
  [
    body('user_id').isInt({ gt: 0 }).withMessage('user_id inválido.'),
    body('event_id').isInt({ gt: 0 }).withMessage('event_id inválido.'),
    body('module').isString().trim().isLength({ min: 1 }).withMessage('module requerido.'),
    body('can_read').optional().isIn([0, 1]),
    body('can_create').optional().isIn([0, 1]),
    body('can_update').optional().isIn([0, 1]),
    body('can_delete').optional().isIn([0, 1]),
  ],
  permisosController.upsertUserEventPermission
);

// DELETE /api/permisos/event -> Eliminar permiso por evento
router.delete(
  '/event',
  [
    query('user_id').isInt({ gt: 0 }).withMessage('user_id inválido.'),
    query('event_id').isInt({ gt: 0 }).withMessage('event_id inválido.'),
    query('module').isString().trim().isLength({ min: 1 }).withMessage('module requerido.')
  ],
  permisosController.deleteUserEventPermission
);

/**
 * RESUMEN por usuario (roles + scopes de eventos)
 */
// GET /api/permisos/user/:user_id -> roles y permisos por evento del usuario
router.get(
  '/user/:user_id',
  [param('user_id').isInt({ gt: 0 }).withMessage('user_id inválido.')],
  permisosController.getUserSummary
);

module.exports = router;
