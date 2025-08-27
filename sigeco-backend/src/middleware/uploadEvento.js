// sigeco-backend/src/middleware/uploadEvento.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 1. Definir la ruta de destino SEGURA para los archivos de eventos
const uploadDir = path.join(__dirname, '../../storage/eventos');

// 2. Asegurarse de que el directorio base exista
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 3. Configurar el almacenamiento de Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Creamos una carpeta específica para cada evento
        const eventoDir = path.join(uploadDir, req.params.id_evento);
        if (!fs.existsSync(eventoDir)) {
            fs.mkdirSync(eventoDir, { recursive: true });
        }
        cb(null, eventoDir);
    },
    filename: function (req, file, cb) {
        // Crear un nombre de archivo único para evitar colisiones
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'evento-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// 4. Crear la instancia de Multer
const uploadEvento = multer({ storage: storage });

module.exports = uploadEvento;