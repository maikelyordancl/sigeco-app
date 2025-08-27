// sigeco-backend/src/models/eventoArchivosModel.js
const pool = require('../config/db');

const EventoArchivo = {
    create: async (fileData) => {
        const { id_evento, nombre_original, nombre_guardado, ruta_almacenamiento, tipo_mime } = fileData;
        const query = `
            INSERT INTO evento_archivos (id_evento, nombre_original, nombre_guardado, ruta_almacenamiento, tipo_mime)
            VALUES (?, ?, ?, ?, ?)
        `;
        const [result] = await pool.query(query, [id_evento, nombre_original, nombre_guardado, ruta_almacenamiento, tipo_mime]);
        return { id_archivo: result.insertId, ...fileData };
    },

    findByEventoId: async (id_evento) => {
        const query = 'SELECT id_archivo, nombre_original, fecha_subida, tipo_mime FROM evento_archivos WHERE id_evento = ? ORDER BY fecha_subida DESC';
        const [rows] = await pool.query(query, [id_evento]);
        return rows;
    },

    
    findById: async (id_archivo) => {
        const query = 'SELECT * FROM evento_archivos WHERE id_archivo = ?';
        const [rows] = await pool.query(query, [id_archivo]);
        return rows[0] || null;
    },

    deleteById: async (id_archivo) => {
        const query = 'DELETE FROM evento_archivos WHERE id_archivo = ?';
        const [result] = await pool.query(query, [id_archivo]);
        return result;
    }
};

module.exports = EventoArchivo;