// CORREGIDO: Usamos 'pool' en lugar de 'db'.
const pool = require('../config/db');

const DEFAULT_SORT_ORDER = 'nombre_asc';
const ALLOWED_SORT_ORDERS = [
    'nombre_asc',
    'nombre_desc',
    'precio_asc',
    'precio_desc',
    'disponibles_asc',
    'disponibles_desc'
];

const ORDER_BY_BY_SORT = {
    nombre_asc: 'nombre ASC, precio ASC, id_tipo_entrada ASC',
    nombre_desc: 'nombre DESC, precio DESC, id_tipo_entrada DESC',
    precio_asc: 'precio ASC, nombre ASC, id_tipo_entrada ASC',
    precio_desc: 'precio DESC, nombre ASC, id_tipo_entrada ASC',
    disponibles_asc: `
        CASE
            WHEN cantidad_total IS NULL THEN 2147483647
            ELSE (cantidad_total - cantidad_vendida)
        END ASC,
        nombre ASC,
        id_tipo_entrada ASC
    `,
    disponibles_desc: `
        CASE
            WHEN cantidad_total IS NULL THEN 2147483647
            ELSE (cantidad_total - cantidad_vendida)
        END DESC,
        nombre ASC,
        id_tipo_entrada ASC
    `,
};

const normalizeSortOrder = (sortOrder) => {
    if (typeof sortOrder !== 'string') {
        return DEFAULT_SORT_ORDER;
    }

    return ALLOWED_SORT_ORDERS.includes(sortOrder)
        ? sortOrder
        : DEFAULT_SORT_ORDER;
};

const getOrderByClause = (sortOrder) => {
    const normalizedSortOrder = normalizeSortOrder(sortOrder);
    return ORDER_BY_BY_SORT[normalizedSortOrder] || ORDER_BY_BY_SORT[DEFAULT_SORT_ORDER];
};

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
    DEFAULT_SORT_ORDER,
    ALLOWED_SORT_ORDERS,
    normalizeSortOrder,
    getOrderByClause,

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

    findByCampanaId: async (id_campana, sortOrder = DEFAULT_SORT_ORDER) => {
        const orderByClause = getOrderByClause(sortOrder);
        const query = `
            SELECT *
            FROM tipos_de_entrada
            WHERE id_campana = ?
            ORDER BY ${orderByClause}
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