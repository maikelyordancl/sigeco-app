// sigeco-backend/src/routes/uploadRoutes.js
const express = require('express');
const router = express.Router();
const uploadLanding = require('../middleware/uploadLanding');
const { verificarToken } = require('../controllers/authController');

// Proteger con JWT
router.use(verificarToken);

// Log previo: NO toca el body, solo muestra headers
router.use((req, _res, next) => {
  const ct = req.headers['content-type'];
  console.log('==================== UPLOAD DEBUG ====================');
  console.log('Método:', req.method);
  console.log('URL:', req.originalUrl);
  console.log('Content-Type:', ct);
  console.log('Tiene boundary?:', ct && ct.includes('multipart/form-data') && ct.includes('boundary='));
  console.log('======================================================');
  next();
});

// Ruta de subida con manejo de errores y logs seguros
router.post('/landing-image', (req, res) => {
  uploadLanding.single('image')(req, res, (err) => {
    // Logs a prueba de null/undefined
    const safeKeys = req.body ? Object.keys(req.body) : '(req.body = undefined)';
    console.log('---------- MULTER CALLBACK ----------');
    console.log('Multer error:', err ? `${err.name}: ${err.message}` : 'null');
    console.log('req.file:', req.file ? {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      filename: req.file.filename,
    } : 'undefined');
    console.log('req.body keys:', safeKeys);
    console.log('------------------------------------');

    if (err) {
      const code = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      return res.status(code).json({
        success: false,
        error: err.message || 'Error en la carga del archivo.',
      });
    }

    // Si el Content-Type no es multipart, lo decimos explícito
    const ct = req.headers['content-type'] || '';
    if (!ct.includes('multipart/form-data')) {
      return res.status(400).json({
        success: false,
        error: 'Content-Type inválido. Debe ser multipart/form-data con boundary.',
        tip: 'No establezcas Content-Type manualmente en el cliente; deja que el navegador lo ponga.',
      });
    }

    // Si Multer no encontró archivo
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No se ha subido ningún archivo.',
        tip: 'El campo debe llamarse exactamente "image" y enviarse como FormData().',
      });
    }

    // OK
    const imageUrl = `/uploads/landings/${req.file.filename}`;
    console.log('[UPLOAD][OK] URL pública ->', imageUrl);
    return res.status(201).json({ success: true, url: imageUrl });
  });
});

module.exports = router;
