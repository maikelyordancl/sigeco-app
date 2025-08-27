// sigeco-new/sigeco-backend/src/middleware/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 1. Definir la ruta de destino para los archivos
const uploadDir = path.join(__dirname, '../../public/uploads/inscripciones');

// 2. Asegurarse de que el directorio de subida exista
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 3. Configurar el almacenamiento de Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Crear un nombre de archivo único para evitar colisiones
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// 4. Crear la instancia de Multer que usaremos como middleware
const upload = multer({ storage: storage });

module.exports = upload;