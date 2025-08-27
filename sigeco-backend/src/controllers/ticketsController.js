const { validationResult } = require('express-validator');
const TicketModel = require('../models/ticketModel');
const CampanaModel = require('../models/campanaModel');

/**
 * Obtiene todos los tickets de una campana.
 */
exports.obtenerTicketsPorCampana = async (req, res) => {
    const { id_campana } = req.params;
    try {
        const tickets = await TicketModel.findByCampanaId(id_campana);
        res.json({ success: true, data: tickets });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error del servidor al obtener los tickets.' });
    }
};

/**
 * Crea un nuevo ticket para una campana.
 */
exports.crearTicket = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id_campana } = req.params;
    const { nombre, precio, cantidad_total } = req.body;

    try {
        const campana = await CampanaModel.findById(id_campana);
        if (!campana) {
            return res.status(404).json({ success: false, error: 'La campaña especificada no existe.' });
        }

        // --- INICIO DE LA CORRECCIÓN ---
        // La validación ahora se basa en si el subevento asociado a la campaña
        // tiene 'obligatorio_pago' como verdadero (1).
        if (!campana.obligatorio_pago) {
            return res.status(400).json({ success: false, error: 'No se pueden añadir tickets a una campaña que no requiere pago.' });
        }
        // --- FIN DE LA CORRECCIÓN ---

        const ticketData = { id_campana: id_campana, nombre, precio, cantidad_total };
        const nuevoTicket = await TicketModel.create(ticketData);
        res.status(201).json({ success: true, data: nuevoTicket });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error del servidor al crear el ticket.' });
    }
};

/**
 * Actualiza un ticket existente.
 */
exports.actualizarTicket = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    
    const { id_ticket } = req.params;
    try {
        const result = await TicketModel.updateById(id_ticket, req.body);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Ticket no encontrado.' });
        }
        res.json({ success: true, message: 'Ticket actualizado con éxito.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error del servidor al actualizar el ticket.' });
    }
};

/**
 * Elimina un ticket.
 */
exports.eliminarTicket = async (req, res) => {
    const { id_ticket } = req.params;
    try {
        const result = await TicketModel.deleteById(id_ticket);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Ticket no encontrado.' });
        }
        res.json({ success: true, message: 'Ticket eliminado con éxito.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error del servidor al eliminar el ticket.' });
    }
};