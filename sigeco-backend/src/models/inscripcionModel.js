const pool = require('../config/db');

const Inscripcion = {
    create: async (inscripcionData) => {
        const { id_campana, id_contacto, estado_asistencia, estado_pago } = inscripcionData;
        const query = `
            INSERT INTO inscripciones (id_campana, id_contacto, estado_asistencia, estado_pago)
            VALUES (?, ?, ?, ?)
        `;
        const [result] = await pool.query(query, [id_campana, id_contacto, estado_asistencia, estado_pago]);
        return { id_inscripcion: result.insertId, ...inscripcionData };
    },

    findByCampanaAndContacto: async (id_campana, id_contacto) => {
        const query = 'SELECT * FROM inscripciones WHERE id_campana = ? AND id_contacto = ?';
        const [rows] = await pool.query(query, [id_campana, id_contacto]);
        return rows[0] || null;
    }
};

module.exports = Inscripcion;