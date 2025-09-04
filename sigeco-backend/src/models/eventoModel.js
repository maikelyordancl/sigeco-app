const pool = require('../config/db');

// Modelo para encontrar todos los eventos
exports.findAll = async () => {
    const [rows] = await pool.query('SELECT * FROM eventos ORDER BY fecha_creado DESC');
    return rows;
};

// Modelo para crear un evento
exports.create = async (eventoData) => {
    const { nombre, fecha_inicio, fecha_fin, ciudad, lugar, presupuesto_marketing, estado } = eventoData;
    const query = `
        INSERT INTO eventos (nombre, fecha_inicio, fecha_fin, ciudad, lugar, presupuesto_marketing, estado)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(query, [nombre, fecha_inicio, fecha_fin, ciudad, lugar, presupuesto_marketing, estado]);
    return { id_evento: result.insertId, ...eventoData };
};

// Modelo para actualizar un evento
exports.updateById = async (id, eventoData) => {
    const { nombre, fecha_inicio, fecha_fin, ciudad, lugar, presupuesto_marketing, estado } = eventoData;
    const query = `
        UPDATE eventos SET
        nombre = ?, fecha_inicio = ?, fecha_fin = ?, ciudad = ?, lugar = ?,
        presupuesto_marketing = ?, estado = ?
        WHERE id_evento = ?
    `;
    const [result] = await pool.query(query, [nombre, fecha_inicio, fecha_fin, ciudad, lugar, presupuesto_marketing, estado, id]);
    return result;
};

// Modelo para eliminar un evento
exports.deleteById = async (id) => {
    const [result] = await pool.query('DELETE FROM eventos WHERE id_evento = ?', [id]);
    return result;
};

exports.findById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM eventos WHERE id_evento = ? LIMIT 1', [id]);
  return rows[0] || null;
};