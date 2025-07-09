const { validationResult } = require('express-validator');
const SubeventoModel = require('../models/subeventoModel');

// Obtener subeventos por id_evento
exports.getSubeventosByEvento = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id_evento } = req.query;

    try {
        const subeventos = await SubeventoModel.findByEventId(id_evento);
        res.json({ success: true, data: subeventos });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error del servidor al obtener los subeventos.' });
    }
};

// Crear un nuevo subevento
exports.createSubevento = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const nuevoSubevento = await SubeventoModel.create(req.body);
        res.status(201).json({ success: true, data: nuevoSubevento });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error del servidor al crear el subevento.' });
    }
};

// Actualizar un subevento
exports.updateSubevento = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;

    try {
        const result = await SubeventoModel.updateById(id, req.body);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Subevento no encontrado.' });
        }
        res.json({ success: true, message: 'Subevento actualizado con éxito.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error del servidor al actualizar el subevento.' });
    }
};

// Eliminar un subevento
exports.deleteSubevento = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const { id } = req.params;

    try {
        const result = await SubeventoModel.deleteById(id);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Subevento no encontrado.' });
        }
        res.json({ success: true, message: 'Subevento eliminado con éxito.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error del servidor al eliminar el subevento.' });
    }
};