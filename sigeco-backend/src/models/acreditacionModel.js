const pool = require('../config/db');
const ContactoModel = require('./contactoModel');      // Ajusta la ruta según tu proyecto
const InscripcionModel = require('./inscripcionModel');
const FormularioModel = require('./formularioModel');


/**
 * Obtiene todos los eventos activos que tienen al menos una sub-campaña activa y acreditable.
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
        WHERE e.estado = 1
          AND c.estado = 'Activa'
          AND c.id_subevento IS NOT NULL
        ORDER BY e.fecha_inicio DESC, c.nombre ASC;
    `;
    const [rows] = await pool.query(query);

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
          AND i.estado_asistencia NOT IN ('Cancelado')
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

    return rows.map(row => ({
        ...row,
        respuestas_personalizadas: row.respuestas_personalizadas ? JSON.parse(row.respuestas_personalizadas) : []
    }));
};

/**
 * Registra un asistente en puerta, incluyendo creación de contacto, inscripción y respuestas personalizadas.
 */
const capitalizarPalabras = (texto) => {
  if (!texto) return '';
  return texto
    .toLowerCase()
    .split(' ')
    .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
    .join(' ');
};

const capitalizarFrase = (texto) => {
  if (!texto) return '';
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
};

exports.registrarEnPuerta = async (
    id_campana,
    id_tipo_entrada = null,
    datosContacto,
    respuestas = [],
    estado_asistencia = 'Confirmado',
    registrado_puerta = 1
) => {
    try {
        // --- Capitalizar campos ---
        if (datosContacto.nombre) datosContacto.nombre = capitalizarPalabras(datosContacto.nombre);
        if (datosContacto.email) datosContacto.email = datosContacto.email.toLowerCase();
        if (datosContacto.empresa) datosContacto.empresa = capitalizarPalabras(datosContacto.empresa);
        if (datosContacto.actividad) datosContacto.actividad = capitalizarPalabras(datosContacto.actividad);
        if (datosContacto.profesion) datosContacto.profesion = capitalizarPalabras(datosContacto.profesion);
        if (datosContacto.comuna) datosContacto.comuna = capitalizarPalabras(datosContacto.comuna);

        // --- 1. Crear o actualizar contacto ---
        let contacto = await ContactoModel.findByEmail(datosContacto.email);

        if (contacto) {
            await ContactoModel.updateById(contacto.id_contacto, datosContacto);
        } else {
            const nuevoContacto = await ContactoModel.create({ ...datosContacto, recibir_mail: true });
            contacto = { id_contacto: nuevoContacto.id_contacto };
        }

        // --- 2. Crear o actualizar inscripción ---
        let inscripcion = await InscripcionModel.findByCampanaAndContacto(id_campana, contacto.id_contacto);

        if (inscripcion) {
            await InscripcionModel.update(inscripcion.id_inscripcion, {
                estado_asistencia,
                registrado_puerta,
                id_tipo_entrada: id_tipo_entrada || inscripcion.id_tipo_entrada,
                estado_pago: inscripcion.estado_pago || 'No Aplica'
            });
        } else {
            inscripcion = await InscripcionModel.create({
                id_campana,
                id_contacto: contacto.id_contacto,
                id_tipo_entrada,
                estado_asistencia,
                registrado_puerta,
                estado_pago: 'No Aplica'
            });
        }

        // --- 3. Guardar respuestas dinámicas ---
        if (respuestas.length > 0) {
            await FormularioModel.saveRespuestas(inscripcion.id_inscripcion, respuestas);
        }

        // --- 4. Retornar datos para frontend ---
        return {
            id_inscripcion: inscripcion.id_inscripcion,
            id_contacto: contacto.id_contacto,
            estado_asistencia,
            registrado_puerta
        };

    } catch (error) {
        console.error("Error en el modelo registrarEnPuerta:", error);
        throw error;
    }
};
