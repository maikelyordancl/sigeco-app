const { validationResult } = require('express-validator');
const AcreditacionModel = require('../models/acreditacionModel');

exports.getCampanasParaAcreditar = async (req, res) => {
    try {
        const eventos = await AcreditacionModel.findEventosConCampanasAcreditables();
        res.json({ success: true, data: eventos });
    } catch (error) {
        console.error('Error al obtener campañas para acreditar:', error);
        res.status(500).json({ success: false, error: 'Error del servidor.' });
    }
};

exports.getAsistentesAcreditacion = async (req, res) => {
    const { id_campana } = req.params;
    try {
        const asistentes = await AcreditacionModel.findAcreditacionAsistentesPorCampana(id_campana);
        res.json({ success: true, data: asistentes });
    } catch (error) {
        console.error(`Error al obtener asistentes para la campaña ${id_campana}:`, error);
        res.status(500).json({ success: false, error: 'Error del servidor.' });
    }
};

exports.getAsistentes = async (req, res) => {
    const { id_campana } = req.params;
    try {
        const asistentes = await AcreditacionModel.findAsistentesPorCampana(id_campana);
        res.json({ success: true, data: asistentes });
    } catch (error) {
        console.error(`Error al obtener asistentes para la campaña ${id_campana}:`, error);
        res.status(500).json({ success: false, error: 'Error del servidor.' });
    }
};

exports.updateAsistencia = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id_inscripcion } = req.params;
    const { nuevo_estado } = req.body;

    try {
        const result = await AcreditacionModel.updateEstadoAsistencia(id_inscripcion, nuevo_estado);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Inscripción no encontrada.' });
        }
        res.json({ success: true, message: 'Estado actualizado correctamente.' });
    } catch (error) {
        console.error(`Error al actualizar estado para la inscripción ${id_inscripcion}:`, error);
        res.status(500).json({ success: false, error: 'Error del servidor.' });
    }
};