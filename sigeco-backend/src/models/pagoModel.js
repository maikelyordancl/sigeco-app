// sigeco-backend/src/models/pagoModel.js
const pool = require('../config/db');

const Pago = {
    create: async (pagoData) => {
        const { id_inscripcion, monto, orden_compra } = pagoData;
        const query = `INSERT INTO pagos (id_inscripcion, monto, orden_compra, estado) VALUES (?, ?, ?, 'Pendiente')`;
        const [result] = await pool.query(query, [id_inscripcion, monto, orden_compra]);
        return { id_pago: result.insertId, ...pagoData };
    },

    updateById: async (id_pago, dataToUpdate) => {
        const query = 'UPDATE pagos SET ? WHERE id_pago = ?';
        const [result] = await pool.query(query, [dataToUpdate, id_pago]);
        return result;
    },

    findByToken: async (token) => {
        const [rows] = await pool.query('SELECT * FROM pagos WHERE token_flow = ?', [token]);
        return rows[0] || null;
    },
    
    findTicketById: async (id_tipo_entrada) => {
        const [rows] = await pool.query('SELECT * FROM tipos_de_entrada WHERE id_tipo_entrada = ?', [id_tipo_entrada]);
        return rows[0] || null;
    },

    findByTokenWithDetails: async (token) => {
        const query = `
            SELECT 
                p.monto, p.estado, p.orden_compra, p.fecha_actualizado,
                i.id_inscripcion,
                c.nombre as contacto_nombre, c.email,
                te.nombre as ticket_nombre
            FROM pagos p
            JOIN inscripciones i ON p.id_inscripcion = i.id_inscripcion
            JOIN contactos c ON i.id_contacto = c.id_contacto
            JOIN tipos_de_entrada te ON i.id_tipo_entrada = te.id_tipo_entrada
            WHERE p.token_flow = ?
        `;
        const [rows] = await pool.query(query, [token]);
        return rows[0] || null;
    },

    // --- NUEVA FUNCIÓN ---
    // Anula todos los pagos pendientes o fallidos para una inscripción específica
    anularPagosAnteriores: async (id_inscripcion) => {
        const query = "UPDATE pagos SET estado = 'Anulado' WHERE id_inscripcion = ? AND (estado = 'Pendiente' OR estado = 'Fallido')";
        const [result] = await pool.query(query, [id_inscripcion]);
        return result;
    }
};

module.exports = Pago;