const { validationResult } = require('express-validator');
const FormularioModel = require('../models/formularioModel');

exports.getFormulario = async (req, res) => {
    const { id_campana } = req.params;
    try {
        const formulario = await FormularioModel.findByCampanaId(id_campana);
        res.json({ success: true, data: formulario });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error del servidor al obtener el formulario.' });
    }
};

exports.updateFormulario = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id_campana } = req.params;
    const { campos } = req.body; // Esperamos un array de objetos de campo

    try {
        const result = await FormularioModel.updateByCampanaId(id_campana, campos);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.crearCampo = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
        const nuevoCampo = await FormularioModel.createCampoPersonalizado(req.body);
        res.status(201).json({ success: true, data: nuevoCampo });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.eliminarCampo = async (req, res) => {
    const { id_campo } = req.params;
    try {
        const result = await FormularioModel.deleteCampoPersonalizado(id_campo);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Campo no encontrado o es un campo de sistema.' });
        }
        res.json({ success: true, message: 'Campo eliminado correctamente.' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error del servidor al eliminar el campo.' });
    }
};

exports.actualizarCampo = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id_campo } = req.params;

    try {
        const campoActualizado = await FormularioModel.updateCampoPersonalizado(id_campo, req.body);
        res.json({ success: true, data: campoActualizado });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.getCamposPorCampana = async (req, res) => {
    try {
        const { id_campana } = req.params;
        const campos = await Formulario.findCamposByCampanaId(id_campana);
        res.json({ campos }); // Devolvemos un objeto con la propiedad 'campos'
    } catch (error) {
        console.error('Error al obtener los campos del formulario por campaña:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};