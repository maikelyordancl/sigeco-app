const pool = require('../config/db'); // Usamos 'pool' para consistencia

const Campana = {
    create: async (campanaData) => {
        const { id_evento, id_subevento = null, nombre, tipo_acceso, requiere_registro = true, estado, url_amigable = null } = campanaData;
        const query = `
            INSERT INTO campanas (id_evento, id_subevento, nombre, tipo_acceso, requiere_registro, estado, url_amigable)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await pool.query(query, [id_evento, id_subevento, nombre, tipo_acceso, requiere_registro, estado, url_amigable]);
        return { id_campana: result.insertId, ...campanaData };
    },

    findByEventoId: async (id_evento) => {
        const query = 'SELECT * FROM campanas WHERE id_evento = ? ORDER BY fecha_creado ASC';
        const [rows] = await pool.query(query, [id_evento]); // Usamos pool.query
        return rows;
    },

    findById: async (id_campana) => {
        const query = 'SELECT * FROM campanas WHERE id_campana = ?';
        const [rows] = await pool.query(query, [id_campana]); // Usamos pool.query
        return rows[0] || null;
    },

    updateById: async (id_campana, campanaData) => {
        const query = 'UPDATE campanas SET ? WHERE id_campana = ?';
        const [result] = await pool.query(query, [campanaData, id_campana]); // Usamos pool.query
        return result;
    },

    deleteById: async (id_campana) => {
        const query = 'DELETE FROM campanas WHERE id_campana = ?';
        const [result] = await pool.query(query, [id_campana]); // Usamos pool.query
        return result;
    }
};

module.exports = Campana;
