const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// La ruta para el login será POST /api/auth
router.post('/', authController.login);

module.exports = router;
