// sigeco-server/sigeco-backend/src/middleware/uploadLanding.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 1. Definir la nueva ruta de destino para las imágenes de las landings
const uploadDir = path.join(__dirname, '../../public/uploads/landings');

// 2. Asegurarse de que el directorio exista
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 3. Configurar el almacenamiento de Multer para landings
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Crear un nombre de archivo único para evitar colisiones
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'landing-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// 4. Crear la instancia de Multer que usaremos
const uploadLanding = multer({ storage: storage });

module.exports = uploadLanding;