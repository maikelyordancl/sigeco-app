// sigeco-server/sigeco-backend/src/routes/uploadRoutes.js
const express = require('express');
const router = express.Router();
const uploadLanding = require('../middleware/uploadLanding');
const { verificarToken } = require('../controllers/authController');

// Proteger la ruta con autenticación JWT
router.use(verificarToken);

// POST /api/upload/landing-image
router.post('/landing-image', uploadLanding.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, error: 'No se ha subido ningún archivo.' });
    }

    // Construir la URL pública del archivo
    const imageUrl = `/uploads/landings/${req.file.filename}`;

    res.status(201).json({
        success: true,
        url: imageUrl
    });
});

module.exports = router;