// sigeco-backend/src/controllers/eventoArchivosController.js
const path = require('path');
const fs = require('fs');
const EventoArchivoModel = require('../models/eventoArchivosModel');

exports.uploadArchivos = async (req, res) => {
    const { id_evento } = req.params;

    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: false, error: 'No se subieron archivos.' });
    }

    try {
        const promises = req.files.map(file => {
            const fileData = {
                id_evento,
                nombre_original: file.originalname,
                nombre_guardado: file.filename,
                ruta_almacenamiento: `/eventos/${id_evento}/`,
                tipo_mime: file.mimetype,
            };
            return EventoArchivoModel.create(fileData);
        });

        await Promise.all(promises);
        res.status(201).json({ success: true, message: `${req.files.length} archivo(s) subido(s) con éxito.` });
    } catch (error) {
        console.error('Error al subir archivos:', error);
        res.status(500).json({ success: false, error: 'Error del servidor al guardar los archivos.' });
    }
};

exports.getArchivosPorEvento = async (req, res) => {
    try {
        const archivos = await EventoArchivoModel.findByEventoId(req.params.id_evento);
        res.json({ success: true, data: archivos });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error al obtener los archivos.' });
    }
};

exports.visualizarArchivo = async (req, res) => {
    try {
        const archivo = await EventoArchivoModel.findById(req.params.id_archivo);
        if (!archivo) {
            return res.status(404).json({ success: false, error: 'Archivo no encontrado.' });
        }
        
        const filePath = path.join(__dirname, '../../storage', archivo.ruta_almacenamiento, archivo.nombre_guardado);

        if (fs.existsSync(filePath)) {
            // Establecemos el tipo de contenido y enviamos el archivo para que se muestre en línea
            res.setHeader('Content-Type', archivo.tipo_mime);
            res.sendFile(filePath);
        } else {
            res.status(404).json({ success: false, error: 'El archivo no existe en el servidor.' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error al visualizar el archivo.' });
    }
};

exports.descargarArchivo = async (req, res) => {
    try {
        const archivo = await EventoArchivoModel.findById(req.params.id_archivo);
        if (!archivo) {
            return res.status(404).json({ success: false, error: 'Archivo no encontrado.' });
        }
        
        const filePath = path.join(__dirname, '../../storage', archivo.ruta_almacenamiento, archivo.nombre_guardado);

        if (fs.existsSync(filePath)) {
            res.download(filePath, archivo.nombre_original);
        } else {
            res.status(404).json({ success: false, error: 'El archivo no existe en el servidor.' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error al descargar el archivo.' });
    }
};


exports.eliminarArchivo = async (req, res) => {
    try {
        const archivo = await EventoArchivoModel.findById(req.params.id_archivo);
        if (!archivo) {
            return res.status(404).json({ success: false, error: 'Archivo no encontrado en la base de datos.' });
        }

        const result = await EventoArchivoModel.deleteById(req.params.id_archivo);
        if (result.affectedRows > 0) {
            const filePath = path.join(__dirname, '../../storage', archivo.ruta_almacenamiento, archivo.nombre_guardado);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            res.json({ success: true, message: 'Archivo eliminado con éxito.' });
        } else {
            res.status(404).json({ success: false, error: 'No se pudo eliminar el archivo.' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error del servidor al eliminar el archivo.' });
    }
};