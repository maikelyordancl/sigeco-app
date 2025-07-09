// CORREGIDO: Usamos 'pool' en lugar de 'db'.
const pool = require('../config/db');

const Ticket = {
    create: async (ticketData) => {
        const { id_campaña, nombre, precio, cantidad_total = null } = ticketData;
        const query = `
            INSERT INTO tipos_de_entrada (id_campaña, nombre, precio, cantidad_total)
            VALUES (?, ?, ?, ?)
        `;
        // CORREGIDO: Se usa pool.query() directamente.
        const [result] = await pool.query(query, [id_campaña, nombre, precio, cantidad_total]);
        return { id_tipo_entrada: result.insertId, ...ticketData };
    },

    findByCampanaId: async (id_campana) => {
        // Nota: La columna en la BD se llama 'id_campaña', pero el parámetro es 'id_campana'.
        const query = 'SELECT * FROM tipos_de_entrada WHERE id_campaña = ? ORDER BY precio ASC';
        // CORREGIDO: Se usa pool.query() directamente.
        const [rows] = await pool.query(query, [id_campana]);
        return rows;
    },

    updateById: async (id_tipo_entrada, ticketData) => {
        const query = 'UPDATE tipos_de_entrada SET ? WHERE id_tipo_entrada = ?';
        // CORREGIDO: Se usa pool.query() directamente.
        const [result] = await pool.query(query, [ticketData, id_tipo_entrada]);
        return result;
    },

    deleteById: async (id_tipo_entrada) => {
        const query = 'DELETE FROM tipos_de_entrada WHERE id_tipo_entrada = ?';
        // CORREGIDO: Se usa pool.query() directamente.
        const [result] = await pool.query(query, [id_tipo_entrada]);
        return result;
    }
};

module.exports = Ticket;
