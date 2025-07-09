const pool = require('../config/db');

// Modelo para encontrar todos los subeventos de un evento específico
exports.findByEventId = async (id_evento) => {
    const [rows] = await pool.query('SELECT * FROM subeventos WHERE id_evento = ? ORDER BY fecha_inicio ASC', [id_evento]);
    return rows;
};

// Modelo para crear un nuevo subevento
exports.create = async (subeventoData) => {
    const {
        id_evento, nombre, fecha_inicio, fecha_fin, ciudad, lugar,
        link_adicional, texto_libre, nombre_evento_mailing, fecha_hora_mailing,
        asunto_mailing, remitente_mailing, ruta_texto_mailing, ruta_imagen_mailing,
        ruta_formulario, sitio_web, obligatorio_registro, obligatorio_pago
    } = subeventoData;

    const query = `
        INSERT INTO subeventos (
            id_evento, nombre, fecha_inicio, fecha_fin, ciudad, lugar, link_adicional,
            texto_libre, nombre_evento_mailing, fecha_hora_mailing, asunto_mailing,
            remitente_mailing, ruta_texto_mailing, ruta_imagen_mailing, ruta_formulario,
            sitio_web, obligatorio_registro, obligatorio_pago
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(query, [
        id_evento, nombre, fecha_inicio, fecha_fin, ciudad, lugar, link_adicional,
        texto_libre, nombre_evento_mailing, fecha_hora_mailing, asunto_mailing,
        remitente_mailing, ruta_texto_mailing, ruta_imagen_mailing, ruta_formulario,
        sitio_web, obligatorio_registro, obligatorio_pago
    ]);

    return { id_subevento: result.insertId, ...subeventoData };
};

// Modelo para actualizar un subevento
exports.updateById = async (id, subeventoData) => {
    const {
        nombre, fecha_inicio, fecha_fin, ciudad, lugar, link_adicional,
        texto_libre, nombre_evento_mailing, fecha_hora_mailing, asunto_mailing,
        remitente_mailing, ruta_texto_mailing, ruta_imagen_mailing, ruta_formulario,
        sitio_web, obligatorio_registro, obligatorio_pago
    } = subeventoData;

    const query = `
        UPDATE subeventos SET
            nombre = ?, fecha_inicio = ?, fecha_fin = ?, ciudad = ?, lugar = ?,
            link_adicional = ?, texto_libre = ?, nombre_evento_mailing = ?,
            fecha_hora_mailing = ?, asunto_mailing = ?, remitente_mailing = ?,
            ruta_texto_mailing = ?, ruta_imagen_mailing = ?, ruta_formulario = ?,
            sitio_web = ?, obligatorio_registro = ?, obligatorio_pago = ?
        WHERE id_subevento = ?
    `;

    const [result] = await pool.query(query, [
        nombre, fecha_inicio, fecha_fin, ciudad, lugar, link_adicional,
        texto_libre, nombre_evento_mailing, fecha_hora_mailing, asunto_mailing,
        remitente_mailing, ruta_texto_mailing, ruta_imagen_mailing, ruta_formulario,
        sitio_web, obligatorio_registro, obligatorio_pago, id
    ]);

    return result;
};

// Modelo para eliminar un subevento por su ID
exports.deleteById = async (id) => {
    const [result] = await pool.query('DELETE FROM subeventos WHERE id_subevento = ?', [id]);
    return result;
};