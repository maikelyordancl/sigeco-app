// sigeco-backend/src/middleware/uploadLanding.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Carpeta donde server.js sirve estáticos: /uploads -> src/public/uploads
// Guardamos dentro de esa raíz:
const uploadDir = path.join(__dirname, '../../public/uploads/landings');

// Asegurar que exista
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Almacenamiento en disco
const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadDir);
  },
  filename: function (_req, file, cb) {
    const base = 'landing';
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname || '').toLowerCase();
    cb(null, `${base}-${unique}${ext || ''}`);
  },
});

// Filtro de tipos permitidos (ajusta si quieres más)
const ALLOWED_MIME = new Set([
  'image/webp',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/avif',
]);

const fileFilter = (_req, file, cb) => {
  if (!file || !file.mimetype) {
    return cb(new Error('Archivo inválido o vacío'));
  }
  if (!ALLOWED_MIME.has(file.mimetype)) {
    return cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`));
  }
  cb(null, true);
};

// Límite de tamaño (ajusta si subes más grandes)
const limits = {
  fileSize: 10 * 1024 * 1024, // 10 MB
};

const uploadLanding = multer({ storage, fileFilter, limits });

module.exports = uploadLanding;
