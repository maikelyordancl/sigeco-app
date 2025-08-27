const { validationResult } = require('express-validator');
const BaseDatosModel = require('../models/baseDatosModel');

exports.getAllBasesDatos = async (req, res) => {
    try {
        const bases = await BaseDatosModel.findAllWithCount();
        res.json({ success: true, data: bases });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error del servidor al obtener las bases de datos.' });
    }
};

exports.importarContactos = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { nombre_base, contactos } = req.body;
    try {
        const result = await BaseDatosModel.importar(nombre_base, contactos);
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error del servidor durante la importación.' });
    }
};

exports.fusionarBases = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { nombre, origen, bases_origen } = req.body;
    try {
        const result = await BaseDatosModel.fusionar(nombre, origen, bases_origen);
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error del servidor durante la fusión.' });
    }
};

// --- **NUEVA FUNCIÓN EN EL CONTROLADOR** ---
exports.assignContactsToBase = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { contactIds, baseIds } = req.body;

    try {
        const result = await BaseDatosModel.assignContacts(contactIds, baseIds);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.deleteBaseDatos = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const { id } = req.params;
    try {
        const result = await BaseDatosModel.deleteById(id);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Base de datos no encontrada.' });
        }
        res.json({ success: true, message: 'Base de datos eliminada con éxito.' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error del servidor al eliminar la base de datos.' });
    }
};