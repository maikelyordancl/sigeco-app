// sigeco-backend/src/routes/eventoArchivosRoutes.js
const express = require('express');
const router = express.Router();
const { verificarToken } = require('../controllers/authController');
const uploadEvento = require('../middleware/uploadEvento');
const eventoArchivosController = require('../controllers/eventoArchivosController');

router.use(verificarToken);

// Subir archivos a un evento
router.post('/:id_evento/archivos', uploadEvento.array('archivos'), eventoArchivosController.uploadArchivos);

// Listar archivos de un evento
router.get('/:id_evento/archivos', eventoArchivosController.getArchivosPorEvento);

// Previsualizar un archivo
router.get('/archivos/:id_archivo/view', eventoArchivosController.visualizarArchivo);

// Descargar un archivo
router.get('/archivos/:id_archivo', eventoArchivosController.descargarArchivo);

// Eliminar un archivo
router.delete('/archivos/:id_archivo', eventoArchivosController.eliminarArchivo);

module.exports = router;