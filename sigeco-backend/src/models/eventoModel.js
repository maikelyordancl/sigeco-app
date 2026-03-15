const pool = require('../config/db');

exports.findAll = async () => {
    const [rows] = await pool.query('SELECT * FROM eventos ORDER BY fecha_creado DESC');
    return rows;
};

exports.create = async (eventoData) => {
    const {
        nombre,
        fecha_inicio,
        fecha_fin,
        ciudad,
        lugar,
        presupuesto_marketing,
        estado,
        link_drive = null,
        contacto_1_nombre = null,
        contacto_1_email = null,
        contacto_1_telefono = null,
        contacto_2_nombre = null,
        contacto_2_email = null,
        contacto_2_telefono = null,
    } = eventoData;

    const query = `
        INSERT INTO eventos (
            nombre, fecha_inicio, fecha_fin, ciudad, lugar, presupuesto_marketing, estado,
            link_drive, contacto_1_nombre, contacto_1_email, contacto_1_telefono,
            contacto_2_nombre, contacto_2_email, contacto_2_telefono
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(query, [
        nombre,
        fecha_inicio,
        fecha_fin,
        ciudad,
        lugar,
        presupuesto_marketing,
        estado,
        link_drive,
        contacto_1_nombre,
        contacto_1_email,
        contacto_1_telefono,
        contacto_2_nombre,
        contacto_2_email,
        contacto_2_telefono,
    ]);

    return { id_evento: result.insertId, ...eventoData };
};

exports.updateById = async (id, eventoData) => {
    const {
        nombre,
        fecha_inicio,
        fecha_fin,
        ciudad,
        lugar,
        presupuesto_marketing,
        estado,
        link_drive = null,
        contacto_1_nombre = null,
        contacto_1_email = null,
        contacto_1_telefono = null,
        contacto_2_nombre = null,
        contacto_2_email = null,
        contacto_2_telefono = null,
    } = eventoData;

    const query = `
        UPDATE eventos SET
            nombre = ?,
            fecha_inicio = ?,
            fecha_fin = ?,
            ciudad = ?,
            lugar = ?,
            presupuesto_marketing = ?,
            estado = ?,
            link_drive = ?,
            contacto_1_nombre = ?,
            contacto_1_email = ?,
            contacto_1_telefono = ?,
            contacto_2_nombre = ?,
            contacto_2_email = ?,
            contacto_2_telefono = ?
        WHERE id_evento = ?
    `;

    const [result] = await pool.query(query, [
        nombre,
        fecha_inicio,
        fecha_fin,
        ciudad,
        lugar,
        presupuesto_marketing,
        estado,
        link_drive,
        contacto_1_nombre,
        contacto_1_email,
        contacto_1_telefono,
        contacto_2_nombre,
        contacto_2_email,
        contacto_2_telefono,
        id,
    ]);

    return result;
};

exports.deleteById = async (id) => {
    const [result] = await pool.query('DELETE FROM eventos WHERE id_evento = ?', [id]);
    return result;
};

exports.findById = async (id) => {
    const [rows] = await pool.query('SELECT * FROM eventos WHERE id_evento = ? LIMIT 1', [id]);
    return rows[0] || null;
};

exports.findByIds = async (ids) => {
    if (!Array.isArray(ids) || ids.length === 0) return [];
    const placeholders = ids.map(() => '?').join(',');
    const [rows] = await pool.query(
        `SELECT * FROM eventos WHERE id_evento IN (${placeholders}) ORDER BY fecha_creado DESC`,
        ids
    );
    return rows;
};
