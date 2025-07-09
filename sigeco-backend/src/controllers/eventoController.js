const { validationResult } = require('express-validator');
const EventoModel = require('../models/eventoModel');
const CampanaModel = require('../models/campanaModel'); // ---- NUEVO ----

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

        // ---- NUEVO ----
        // Una vez que el evento se ha creado con éxito, creamos su campaña principal asociada.
        // El modelo de evento debe devolver el objeto completo, incluyendo el ID.
        if (nuevoEvento && nuevoEvento.id_evento) {
            const nombreCampana = `Campana General - ${nuevoEvento.nombre}`;
            const campanaData = {
                id_evento: nuevoEvento.id_evento,
                nombre: nombreCampana,
                tipo_acceso: 'De Pago', // Por defecto, como acordamos.
                estado: 'Borrador' // La campaña se crea inactiva por defecto.
            };

            // Idealmente, la creación del evento y su campaña deberían estar en una transacción
            // para asegurar que ambas operaciones se completen o ninguna lo haga.
            // Por ahora, procedemos con la creación directa.
            await CampanaModel.create(campanaData);
        }
        // ---- FIN NUEVO ----

        res.status(201).json({ success: true, data: nuevoEvento });
    } catch (error) {
        console.error(error);
        // Si falla la creación del evento o de la campaña, se captura el error.
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