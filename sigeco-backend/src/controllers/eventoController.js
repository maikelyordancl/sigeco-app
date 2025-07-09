const { validationResult } = require('express-validator');
const EventoModel = require('../models/eventoModel');

// Obtener todos los eventos
exports.getAllEventos = async (req, res) => {
    try {
        const eventos = await EventoModel.findAll();
        res.json({ success: true, data: eventos });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error del servidor al obtener eventos.' });
    }
};

// Crear un nuevo evento
exports.createEvento = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const nuevoEvento = await EventoModel.create(req.body);
        res.status(201).json({ success: true, data: nuevoEvento });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error del servidor al crear el evento.' });
    }
};

// Actualizar un evento existente
exports.updateEvento = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.query;

    try {
        const result = await EventoModel.updateById(id, req.body);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Evento no encontrado.' });
        }
        res.json({ success: true, message: 'Evento actualizado con éxito.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error del servidor al actualizar el evento.' });
    }
};

// Eliminar un evento
exports.deleteEvento = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const { id } = req.params;

    try {
        const result = await EventoModel.deleteById(id);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Evento no encontrado.' });
        }
        res.json({ success: true, message: 'Evento eliminado con éxito.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error del servidor al eliminar el evento.' });
    }
};