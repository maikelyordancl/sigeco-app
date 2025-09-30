const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');

const { verificarToken } = require('../controllers/authController');
const authorize = require('../middleware/authorize');
const usuarioController = require('../controllers/usuarioController');

// Autenticación
router.use(verificarToken);

// Solo SUPER ADMIN (o módulo permisos)
router.use(authorize('permisos', 'update'));

/**
 * GET /api/usuarios
 * Lista todos los usuarios
 */
router.get('/', usuarioController.getUsuarios);

/**
 * POST /api/usuarios
 * Crear usuario
 * body: { nombre, email, password, role_id? }
 */
router.post(
  '/',
  [
    body('nombre').trim().isLength({ min: 2 }).withMessage('Nombre inválido.'),
    body('email').isEmail().withMessage('Email inválido.').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password mínimo 6 caracteres.'),
    body('role_id').optional().isInt({ gt: 0 }).withMessage('role_id inválido.')
  ],
  usuarioController.createUsuario
);

/**
 * PUT /api/usuarios/:id
 * Actualizar datos básicos (no password)
 * body: { nombre, email }
 */
router.put(
  '/:id',
  [
    param('id').isInt({ gt: 0 }).withMessage('ID de usuario inválido.'),
    body('nombre').trim().isLength({ min: 2 }).withMessage('Nombre inválido.'),
    body('email').isEmail().withMessage('Email inválido.').normalizeEmail()
  ],
  usuarioController.updateUsuario
);

/**
 * DELETE /api/usuarios/:id
 * Eliminar usuario
 */
router.delete(
  '/:id',
  [param('id').isInt({ gt: 0 }).withMessage('ID de usuario inválido.')],
  usuarioController.deleteUsuario
);

router.get('/', usuarioController.getAllUsers); 

module.exports = router;
