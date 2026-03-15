const pool = require('../config/db');

exports.findByEventId = async (id_evento) => {
    const [rows] = await pool.query('SELECT * FROM subeventos WHERE id_evento = ? ORDER BY fecha_inicio ASC', [id_evento]);
    return rows;
};

exports.findById = async (id_subevento) => {
    const [rows] = await pool.query('SELECT * FROM subeventos WHERE id_subevento = ?', [id_subevento]);
    return rows[0] || null;
};

exports.create = async (subeventoData) => {
    const {
        id_evento,
        nombre,
        fecha_inicio,
        fecha_fin,
        ciudad,
        lugar,
        link_adicional,
        texto_libre,
        nombre_evento_mailing,
        fecha_hora_mailing,
        asunto_mailing,
        remitente_mailing,
        ruta_texto_mailing,
        ruta_imagen_mailing,
        ruta_formulario,
        sitio_web,
        contacto_1_nombre = null,
        contacto_1_email = null,
        contacto_1_telefono = null,
        contacto_2_nombre = null,
        contacto_2_email = null,
        contacto_2_telefono = null,
        obligatorio_registro,
        obligatorio_pago
    } = subeventoData;

    const fechaMailingParaDB = fecha_hora_mailing && fecha_hora_mailing.trim() !== ''
        ? fecha_hora_mailing
        : null;

    const query = `
        INSERT INTO subeventos (
            id_evento, nombre, fecha_inicio, fecha_fin, ciudad, lugar, link_adicional,
            texto_libre, nombre_evento_mailing, fecha_hora_mailing, asunto_mailing,
            remitente_mailing, ruta_texto_mailing, ruta_imagen_mailing, ruta_formulario,
            sitio_web, contacto_1_nombre, contacto_1_email, contacto_1_telefono,
            contacto_2_nombre, contacto_2_email, contacto_2_telefono,
            obligatorio_registro, obligatorio_pago
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(query, [
        id_evento,
        nombre,
        fecha_inicio,
        fecha_fin,
        ciudad,
        lugar,
        link_adicional,
        texto_libre,
        nombre_evento_mailing,
        fechaMailingParaDB,
        asunto_mailing,
        remitente_mailing,
        ruta_texto_mailing,
        ruta_imagen_mailing,
        ruta_formulario,
        sitio_web,
        contacto_1_nombre,
        contacto_1_email,
        contacto_1_telefono,
        contacto_2_nombre,
        contacto_2_email,
        contacto_2_telefono,
        obligatorio_registro,
        obligatorio_pago
    ]);

    return { id_subevento: result.insertId, ...subeventoData };
};

exports.updateById = async (id, subeventoData) => {
    const {
        nombre,
        fecha_inicio,
        fecha_fin,
        ciudad,
        lugar,
        link_adicional,
        texto_libre,
        nombre_evento_mailing,
        fecha_hora_mailing,
        asunto_mailing,
        remitente_mailing,
        ruta_texto_mailing,
        ruta_imagen_mailing,
        ruta_formulario,
        sitio_web,
        contacto_1_nombre = null,
        contacto_1_email = null,
        contacto_1_telefono = null,
        contacto_2_nombre = null,
        contacto_2_email = null,
        contacto_2_telefono = null,
        obligatorio_registro,
        obligatorio_pago
    } = subeventoData;

    const fechaMailingParaDB = fecha_hora_mailing && fecha_hora_mailing.trim() !== ''
        ? fecha_hora_mailing
        : null;

    const query = `
        UPDATE subeventos SET
            nombre = ?, fecha_inicio = ?, fecha_fin = ?, ciudad = ?, lugar = ?,
            link_adicional = ?, texto_libre = ?, nombre_evento_mailing = ?,
            fecha_hora_mailing = ?, asunto_mailing = ?, remitente_mailing = ?,
            ruta_texto_mailing = ?, ruta_imagen_mailing = ?, ruta_formulario = ?,
            sitio_web = ?, contacto_1_nombre = ?, contacto_1_email = ?, contacto_1_telefono = ?,
            contacto_2_nombre = ?, contacto_2_email = ?, contacto_2_telefono = ?,
            obligatorio_registro = ?, obligatorio_pago = ?
        WHERE id_subevento = ?
    `;

    const [result] = await pool.query(query, [
        nombre,
        fecha_inicio,
        fecha_fin,
        ciudad,
        lugar,
        link_adicional,
        texto_libre,
        nombre_evento_mailing,
        fechaMailingParaDB,
        asunto_mailing,
        remitente_mailing,
        ruta_texto_mailing,
        ruta_imagen_mailing,
        ruta_formulario,
        sitio_web,
        contacto_1_nombre,
        contacto_1_email,
        contacto_1_telefono,
        contacto_2_nombre,
        contacto_2_email,
        contacto_2_telefono,
        obligatorio_registro,
        obligatorio_pago,
        id
    ]);

    return result;
};

exports.deleteById = async (id) => {
    const [result] = await pool.query('DELETE FROM subeventos WHERE id_subevento = ?', [id]);
    return result;
};

exports.findSubeventosSinCampana = async (id_evento) => {
    const query = `
        SELECT s.id_subevento, s.nombre
        FROM subeventos s
        LEFT JOIN campanas c ON s.id_subevento = c.id_subevento
        WHERE s.id_evento = ? AND c.id_campana IS NULL
        ORDER BY s.fecha_inicio ASC;
    `;
    const [rows] = await pool.query(query, [id_evento]);
    return rows;
};

exports.getAllSubeventos = async (id_evento) => {
    const query = `
        SELECT s.id_subevento, s.nombre, c.id_campana
        FROM subeventos s
        LEFT JOIN campanas c
            ON s.id_subevento = c.id_subevento
        WHERE s.id_evento = ?
        ORDER BY s.fecha_inicio ASC;`;
    const [rows] = await pool.query(query, [id_evento]);
    return rows;
};
