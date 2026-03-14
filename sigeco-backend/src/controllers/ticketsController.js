const { validationResult } = require('express-validator');
const TicketModel = require('../models/ticketModel');
const CampanaModel = require('../models/campanaModel');

/**
 * Obtiene todos los tickets de una campana.
 */
exports.obtenerTicketsPorCampana = async (req, res) => {
    const { id_campana } = req.params;
    try {
        const campana = await CampanaModel.findById(id_campana);

        if (!campana) {
            return res.status(404).json({ success: false, error: 'La campaña especificada no existe.' });
        }

        const sortOrder = TicketModel.normalizeSortOrder(campana.ticket_sort_order);
        const tickets = await TicketModel.findByCampanaId(id_campana, sortOrder);

        res.json({ success: true, data: tickets, sort_order: sortOrder });
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

        if (!campana.obligatorio_pago) {
            return res.status(400).json({ success: false, error: 'No se pueden añadir tickets a una campaña que no requiere pago.' });
        }

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
 * Guarda el criterio de orden de tickets de una campaña.
 */
exports.actualizarOrdenTicketsCampana = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id_campana } = req.params;
    const sortOrder = TicketModel.normalizeSortOrder(req.body.sort_order);

    try {
        const campana = await CampanaModel.findById(id_campana);

        if (!campana) {
            return res.status(404).json({ success: false, error: 'La campaña especificada no existe.' });
        }

        await CampanaModel.updateById(id_campana, { ticket_sort_order: sortOrder });
        const tickets = await TicketModel.findByCampanaId(id_campana, sortOrder);

        res.json({
            success: true,
            message: 'Orden de tickets actualizado con éxito.',
            sort_order: sortOrder,
            data: tickets,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error del servidor al actualizar el orden de los tickets.' });
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