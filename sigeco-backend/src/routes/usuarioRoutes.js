const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');

const { verificarToken } = require('../controllers/authController');
const authorize = require('../middleware/authorize');
const usuarioController = require('../controllers/usuarioController');

router.use(verificarToken);
router.use(authorize('permisos', 'update'));

router.get('/', usuarioController.getUsuarios);

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

router.put(
  '/:id',
  [
    param('id').isInt({ gt: 0 }).withMessage('ID de usuario inválido.'),
    body('nombre').trim().isLength({ min: 2 }).withMessage('Nombre inválido.'),
    body('email').isEmail().withMessage('Email inválido.').normalizeEmail()
  ],
  usuarioController.updateUsuario
);

router.put(
  '/:id/password',
  [
    param('id').isInt({ gt: 0 }).withMessage('ID de usuario inválido.'),
    body('password').isLength({ min: 6 }).withMessage('Password mínimo 6 caracteres.')
  ],
  usuarioController.updatePassword
);

router.delete(
  '/:id',
  [param('id').isInt({ gt: 0 }).withMessage('ID de usuario inválido.')],
  usuarioController.deleteUsuario
);

module.exports = router;
