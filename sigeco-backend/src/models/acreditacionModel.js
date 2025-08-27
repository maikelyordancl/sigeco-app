const pool = require('../config/db');

/**
 * Obtiene todos los eventos activos que tienen al menos una sub-campaña activa y acreditable.
 * Una campaña es acreditable si no es la campaña principal (id_subevento no es nulo).
 */
exports.findEventosConCampanasAcreditables = async () => {
    const query = `
        SELECT 
            e.id_evento,
            e.nombre AS evento_nombre,
            e.fecha_inicio,
            e.fecha_fin,
            c.id_campana,
            c.nombre AS campana_nombre,
            s.nombre AS subevento_nombre
        FROM eventos e
        JOIN campanas c ON e.id_evento = c.id_evento
        JOIN subeventos s ON c.id_subevento = s.id_subevento
        WHERE e.estado = 1 -- Solo eventos 'Activo'
          AND c.estado = 'Activa' -- Solo campañas 'Activa'
          AND c.id_subevento IS NOT NULL
        ORDER BY e.fecha_inicio DESC, c.nombre ASC;
    `;
    const [rows] = await pool.query(query);

    // Agrupar campañas por evento
    const eventos = rows.reduce((acc, row) => {
        let evento = acc.find(e => e.id_evento === row.id_evento);
        if (!evento) {
            evento = {
                id_evento: row.id_evento,
                nombre: row.evento_nombre,
                fecha_inicio: row.fecha_inicio,
                fecha_fin: row.fecha_fin,
                campanas: []
            };
            acc.push(evento);
        }
        evento.campanas.push({
            id_campana: row.id_campana,
            nombre: row.campana_nombre,
            subevento_nombre: row.subevento_nombre
        });
        return acc;
    }, []);

    return eventos;
};


/**
 * Busca todos los asistentes de una campaña específica para el módulo de acreditación.
 */
exports.findAcreditacionAsistentesPorCampana = async (id_campana) => {
    const query = `
        SELECT
            i.id_inscripcion,
            i.estado_asistencia,
            c.nombre,
            c.rut,
            c.email,
            te.nombre AS tipo_entrada
        FROM inscripciones i
        JOIN contactos c ON i.id_contacto = c.id_contacto
        LEFT JOIN tipos_de_entrada te ON i.id_tipo_entrada = te.id_tipo_entrada
        WHERE i.id_campana = ?
          AND i.estado_asistencia NOT IN ('Cancelado') -- Excluimos a los cancelados de la lista de acreditación
        ORDER BY c.nombre;
    `;
    const [rows] = await pool.query(query, [id_campana]);
    return rows;
};

/**
 * Actualiza el estado de asistencia de una inscripción.
 */
exports.updateEstadoAsistencia = async (id_inscripcion, nuevo_estado) => {
    const query = `
        UPDATE inscripciones
        SET estado_asistencia = ?
        WHERE id_inscripcion = ?;
    `;
    const [result] = await pool.query(query, [nuevo_estado, id_inscripcion]);
    return result;
};


/**
 * Busca todos los asistentes de una campaña, incluyendo sus respuestas a campos personalizados.
 */
exports.findAsistentesPorCampana = async (id_campana) => {
    const query = `
        SELECT
            i.id_inscripcion,
            i.estado_asistencia,
            c.nombre,
            c.rut,
            c.email,
            te.nombre AS tipo_entrada,
            (
                SELECT CONCAT('[', GROUP_CONCAT(
                    JSON_OBJECT(
                        'etiqueta', fc.etiqueta,
                        'valor', ir.valor,
                        'tipo_campo', fc.tipo_campo
                    )
                ), ']')
                FROM inscripcion_respuestas ir
                JOIN formulario_campos fc ON ir.id_campo = fc.id_campo
                WHERE ir.id_inscripcion = i.id_inscripcion AND fc.es_de_sistema = 0
            ) AS respuestas_personalizadas
        FROM inscripciones i
        JOIN contactos c ON i.id_contacto = c.id_contacto
        LEFT JOIN tipos_de_entrada te ON i.id_tipo_entrada = te.id_tipo_entrada
        WHERE i.id_campana = ?
          AND i.estado_asistencia NOT IN ('Cancelado')
        GROUP BY i.id_inscripcion
        ORDER BY c.nombre;
    `;
    const [rows] = await pool.query(query, [id_campana]);

    // Parseamos el string JSON de respuestas a un objeto real
    return rows.map(row => ({
        ...row,
        respuestas_personalizadas: row.respuestas_personalizadas ? JSON.parse(row.respuestas_personalizadas) : []
    }));
};