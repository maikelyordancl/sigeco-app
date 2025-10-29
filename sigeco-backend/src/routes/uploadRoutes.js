// sigeco-backend/src/routes/uploadRoutes.js
const express = require('express');
const router = express.Router();
const uploadLanding = require('../middleware/uploadLanding');
const { verificarToken } = require('../controllers/authController');

// Proteger con JWT
router.use(verificarToken);

// Ruta de subida con manejo de errores
router.post('/landing-image', (req, res) => {
  uploadLanding.single('image')(req, res, (err) => {
    if (err) {
      const code = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      return res.status(code).json({
        success: false,
        error: err.message || 'Error en la carga del archivo.',
      });
    }

    const ct = req.headers['content-type'] || '';
    if (!ct.includes('multipart/form-data')) {
      return res.status(400).json({
        success: false,
        error: 'Content-Type inválido. Debe ser multipart/form-data con boundary.',
        tip: 'No establezcas Content-Type manualmente en el cliente; deja que el navegador lo ponga.',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No se ha subido ningún archivo.',
        tip: 'El campo debe llamarse exactamente "image" y enviarse como FormData().',
      });
    }

    const imageUrl = `/uploads/landings/${req.file.filename}`;
    return res.status(201).json({ success: true, url: imageUrl });
  });
});

module.exports = router;
