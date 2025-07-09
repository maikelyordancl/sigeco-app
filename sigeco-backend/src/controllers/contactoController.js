const { validationResult } = require('express-validator');
const ContactoModel = require('../models/contactoModel');

// Obtener todos los contactos
exports.getAllContactos = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    try {
        const { page, limit, search } = req.query;
        const data = await ContactoModel.findAndCountAll({ page, limit, search });
        res.json({ success: true, data });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error del servidor al obtener contactos.' });
    }
};

// Crear un nuevo contacto
exports.createContacto = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const nuevoContacto = await ContactoModel.create(req.body);
        res.status(201).json({ success: true, data: nuevoContacto });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error del servidor al crear el contacto.' });
    }
};

// Actualizar un contacto
exports.updateContacto = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id } = req.params;

    try {
        const result = await ContactoModel.updateById(id, req.body);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Contacto no encontrado.' });
        }
        res.json({ success: true, message: 'Contacto actualizado con éxito.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error del servidor al actualizar el contacto.' });
    }
};

// Eliminar un contacto
exports.deleteContacto = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const { id } = req.params;

    try {
        const result = await ContactoModel.deleteById(id);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Contacto no encontrado.' });
        }
        res.json({ success: true, message: 'Contacto eliminado con éxito.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error del servidor al eliminar el contacto.' });
    }
};
