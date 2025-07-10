const pool = require('../config/db'); // Usamos 'pool' para consistencia

const Campana = {
    create: async (campanaData) => {
        const { id_evento, id_subevento = null, nombre, tipo_acceso, estado, url_amigable = null } = campanaData;
        const query = `
            INSERT INTO campanas (id_evento, id_subevento, nombre, tipo_acceso, estado, url_amigable)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const [result] = await pool.query(query, [id_evento, id_subevento, nombre, tipo_acceso, estado, url_amigable]);
        return { id_campana: result.insertId, ...campanaData };
    },

    findByEventoId: async (id_evento) => {
        const query = `
            SELECT 
                c.*, 
                s.nombre AS subevento_nombre 
            FROM campanas c
            LEFT JOIN subeventos s ON c.id_subevento = s.id_subevento
            WHERE c.id_evento = ? 
            ORDER BY c.id_subevento ASC, c.fecha_creado ASC
        `;
        const [rows] = await pool.query(query, [id_evento]);
        return rows;
    },

    findById: async (id_campana) => {
        const query = 'SELECT * FROM campanas WHERE id_campana = ?';
        const [rows] = await pool.query(query, [id_campana]);
        return rows[0] || null;
    },

    updateById: async (id_campana, campanaData) => {
        const query = 'UPDATE campanas SET ? WHERE id_campana = ?';
        const [result] = await pool.query(query, [campanaData, id_campana]);
        return result;
    },

    deleteById: async (id_campana) => {
        const query = 'DELETE FROM campanas WHERE id_campana = ?';
        const [result] = await pool.query(query, [id_campana]);
        return result;
    },

    findPublicDataBySlug: async (slug) => {
        const campanaQuery = `
            SELECT 
                c.id_campana, 
                c.id_subevento,
                c.nombre, 
                c.estado, 
                c.url_amigable,
                e.nombre AS evento_nombre, 
                e.fecha_inicio, 
                e.fecha_fin, 
                e.ciudad, 
                e.lugar,
                s.nombre AS subevento_nombre,
                s.obligatorio_registro,
                s.obligatorio_pago
            FROM campanas c
            JOIN eventos e ON c.id_evento = e.id_evento
            LEFT JOIN subeventos s ON c.id_subevento = s.id_subevento
            WHERE c.url_amigable = ?;
        `;
        const [campanas] = await pool.query(campanaQuery, [slug]);

        if (campanas.length === 0) {
            return null;
        }

        const campanaData = campanas[0];
        let tickets = [];

        if (campanaData.tipo_acceso === 'De Pago') {
            const ticketsQuery = 'SELECT id_tipo_entrada, nombre, precio, cantidad_total, cantidad_vendida FROM tipos_de_entrada WHERE id_campana = ? ORDER BY precio ASC';
            const [ticketRows] = await pool.query(ticketsQuery, [campanaData.id_campana]);
            tickets = ticketRows;
        }

        return {
            campana: campanaData,
            tickets: tickets
        };
    },

    // --- FUNCIÓN AÑADIDA QUE FALTABA ---
    // Obtiene las reglas de negocio de la campaña a través de su sub-evento.
    findRulesById: async (id_campana) => {
        const query = `
            SELECT 
                s.obligatorio_registro,
                s.obligatorio_pago
            FROM campanas c
            LEFT JOIN subeventos s ON c.id_subevento = s.id_subevento
            WHERE c.id_campana = ?;
        `;
        const [rows] = await pool.query(query, [id_campana]);
        return rows[0] || null;
    }
};

module.exports = Campana;
