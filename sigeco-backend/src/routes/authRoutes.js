const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// La ruta para el login será POST /api/auth/login
router.post('/login', authController.login);

// Nueva ruta para refrescar el token
router.post('/refresh', authController.refreshToken);

// Nueva ruta para cerrar sesión
router.post('/logout', authController.logout);


module.exports = router;