const { validationResult } = require('express-validator');
// CAMBIO: La variable importada ahora se llama 'Campana' para coincidir con el modelo.
const Campana = require('../models/campanaModel');
const SubeventoModel = require('../models/subeventoModel');

/**
 * Obtiene todas las campanas (principal y de subeventos) de un evento específico.
 */
exports.obtenerCampanasPorEvento = async (req, res) => {
    const { id_evento } = req.params;

    try {
        const campanas = await Campana.findByEventoId(id_evento);
        if (!campanas || campanas.length === 0) {
            return res.status(404).json({ success: false, error: 'No se encontraron campanas para este evento.' });
        }
        res.json({ success: true, data: campanas });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error del servidor al obtener las campanas.' });
    }
};

/**
 * Obtiene los detalles de una única campana.
 */
exports.obtenerDetalleCampana = async (req, res) => {
    const { id_campana } = req.params;

    try {
        const campana = await Campana.findById(id_campana);
        if (!campana) {
            return res.status(404).json({ success: false, error: 'Campana no encontrada.' });
        }
        res.json({ success: true, data: campana });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error del servidor al obtener la campana.' });
    }
};

/**
 * Crea una nueva campana para un subevento (Sub-Campana).
 */
exports.crearSubCampana = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id_evento, id_subevento, nombre, tipo_acceso } = req.body;

    try {
        const subevento = await SubeventoModel.findById(id_subevento);
        if (!subevento || subevento.id_evento !== parseInt(id_evento, 10)) {
            return res.status(404).json({ success: false, error: 'Subevento no encontrado o no pertenece al evento especificado.' });
        }

        const campanaData = {
            id_evento,
            id_subevento,
            nombre: nombre || `Campana - ${subevento.nombre}`,
            tipo_acceso: tipo_acceso || 'De Pago',
            estado: 'Borrador'
        };

        const nuevaCampana = await Campana.create(campanaData);
        res.status(201).json({ success: true, data: nuevaCampana });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error del servidor al crear la sub-campana.' });
    }
};

/**
 * Actualiza los datos de una campana existente.
 */
exports.actualizarCampana = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const { id_campana } = req.params;
    const campanaData = req.body;

    try {
        const result = await Campana.updateById(id_campana, campanaData);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Campana no encontrada.' });
        }
        res.json({ success: true, message: 'Campana actualizada con éxito.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error del servidor al actualizar la campana.' });
    }
};

/**
 * Elimina una campana.
 */
exports.eliminarCampana = async (req, res) => {
    const { id_campana } = req.params;

    try {
        const result = await Campana.deleteById(id_campana);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Campana no encontrada.' });
        }
        res.json({ success: true, message: 'Campana eliminada con éxito.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error del servidor al eliminar la campana.' });
    }
};
