// CORREGIDO: Usamos 'pool' en lugar de 'db'.
const pool = require('../config/db');

const sanitizeTicketData = (ticketData = {}) => {
    const sanitized = {};

    if (ticketData.nombre !== undefined) {
        sanitized.nombre = String(ticketData.nombre).trim();
    }

    if (ticketData.precio !== undefined) {
        sanitized.precio = Number(ticketData.precio);
    }

    if (ticketData.cantidad_total !== undefined) {
        const cantidad = ticketData.cantidad_total;
        sanitized.cantidad_total =
            cantidad === '' || cantidad === null || Number.isNaN(Number(cantidad))
                ? null
                : Number(cantidad);
    }

    if (ticketData.id_campana !== undefined) {
        sanitized.id_campana = Number(ticketData.id_campana);
    }

    return sanitized;
};

const Ticket = {
    create: async (ticketData) => {
        const sanitizedData = sanitizeTicketData(ticketData);
        const { id_campana, nombre, precio, cantidad_total = null } = sanitizedData;
        const query = `
            INSERT INTO tipos_de_entrada (id_campana, nombre, precio, cantidad_total)
            VALUES (?, ?, ?, ?)
        `;
        const [result] = await pool.query(query, [id_campana, nombre, precio, cantidad_total]);
        return { id_tipo_entrada: result.insertId, ...sanitizedData };
    },

    findByCampanaId: async (id_campana) => {
        const query = `
            SELECT *
            FROM tipos_de_entrada
            WHERE id_campana = ?
            ORDER BY nombre ASC, precio ASC
        `;
        const [rows] = await pool.query(query, [id_campana]);
        return rows;
    },

    updateById: async (id_tipo_entrada, ticketData) => {
        const sanitizedData = sanitizeTicketData(ticketData);
        const fields = Object.keys(sanitizedData);

        if (fields.length === 0) {
            return { affectedRows: 0 };
        }

        const query = 'UPDATE tipos_de_entrada SET ? WHERE id_tipo_entrada = ?';
        const [result] = await pool.query(query, [sanitizedData, id_tipo_entrada]);
        return result;
    },

    deleteById: async (id_tipo_entrada) => {
        const query = 'DELETE FROM tipos_de_entrada WHERE id_tipo_entrada = ?';
        const [result] = await pool.query(query, [id_tipo_entrada]);
        return result;
    }
};

module.exports = Ticket;