// sigeco-backend/src/models/campanaModel.js

/**
 * Modelo para gestionar las operaciones de la base de datos para las campañas.
 * Utiliza un pool de conexiones para interactuar con la base de datos MySQL.
 */
const pool = require('../config/db');
const FormularioModel = require('./formularioModel');

const Campana = {
    create: async (campanaData) => {
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            const {
                id_evento,
                id_subevento = null,
                nombre,
                estado,
                url_amigable = null,
                id_plantilla = 1,
                fecha_personalizada = null,
                email_incluye_qr = false,
                registro_sin_pago_inmediato = false,
            } = campanaData;

            const queryCampana = `
                INSERT INTO campanas (
                    id_evento,
                    id_subevento,
                    nombre,
                    estado,
                    url_amigable,
                    id_plantilla,
                    fecha_personalizada,
                    email_incluye_qr,
                    registro_sin_pago_inmediato
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const [result] = await connection.query(queryCampana, [
                id_evento,
                id_subevento,
                nombre,
                estado,
                url_amigable,
                id_plantilla,
                fecha_personalizada,
                email_incluye_qr,
                registro_sin_pago_inmediato,
            ]);
            const newCampanaId = result.insertId;

            if (id_subevento) {
                const [camposSistema] = await connection.query('SELECT id_campo, nombre_interno FROM formulario_campos WHERE es_de_sistema = 1');
                const camposObligatorios = ['nombre', 'email', 'telefono', 'pais', 'comuna'];

                const configValues = camposSistema.map((campo, index) => {
                    const esObligatorio = camposObligatorios.includes(campo.nombre_interno);
                    return [newCampanaId, campo.id_campo, true, esObligatorio, index + 1];
                });

                if (configValues.length > 0) {
                    const queryConfig = `
                        INSERT INTO campana_formulario_config (id_campana, id_campo, es_visible, es_obligatorio, orden)
                        VALUES ?
                    `;
                    await connection.query(queryConfig, [configValues]);
                }
            }

            await connection.commit();

            return {
                id_campana: newCampanaId,
                ...campanaData,
                email_incluye_qr,
                registro_sin_pago_inmediato,
            };

        } catch (error) {
            await connection.rollback();
            console.error("Error en la transacción de creación de campaña:", error);
            throw error;
        } finally {
            connection.release();
        }
    },

    findByEventoId: async (id_evento) => {
        const query = `
            SELECT 
                c.*, 
                e.nombre AS evento_nombre,
                s.nombre AS subevento_nombre,
                s.obligatorio_pago,
                s.obligatorio_registro,
                COALESCE(stats.invitados, 0) AS invitados,
                COALESCE(stats.registrados, 0) AS registrados,
                COALESCE(stats.confirmados, 0) AS confirmados,
                COALESCE(stats.asistieron, 0) AS asistieron,
                COALESCE(stats.cancelados, 0) AS cancelados,
                COALESCE(stats.pagados, 0) AS pagados,
                COALESCE(stats.total_ingresos, 0) AS total_ingresos
            FROM campanas c
            JOIN eventos e ON c.id_evento = e.id_evento
            LEFT JOIN subeventos s ON c.id_subevento = s.id_subevento
            LEFT JOIN (
                SELECT
                    base.id_campana,
                    COUNT(CASE WHEN base.estado_asistencia = 'Invitado' THEN 1 END) AS invitados,
                    COUNT(CASE WHEN base.estado_asistencia = 'Registrado' THEN 1 END) AS registrados,
                    COUNT(CASE WHEN base.estado_asistencia = 'Confirmado' THEN 1 END) AS confirmados,
                    COUNT(CASE WHEN base.estado_asistencia = 'Asistió' THEN 1 END) AS asistieron,
                    COUNT(CASE WHEN base.estado_asistencia = 'Cancelado' THEN 1 END) AS cancelados,
                    COUNT(CASE WHEN base.estado_pago = 'Pagado' THEN 1 END) AS pagados,
                    SUM(base.total_pagado_actual) AS total_ingresos
                FROM (
                    SELECT
                        i.id_campana,
                        i.estado_asistencia,
                        i.estado_pago,
                        COALESCE(
                            mp.total_pagado_movimientos,
                            i.monto_pagado_manual,
                            pp.total_pagado_pasarela,
                            0
                        ) AS total_pagado_actual
                    FROM inscripciones i
                    LEFT JOIN (
                        SELECT
                            id_inscripcion,
                            SUM(CASE WHEN estado = 'Pagado' THEN monto ELSE 0 END) AS total_pagado_movimientos
                        FROM inscripcion_movimientos_pago
                        GROUP BY id_inscripcion
                    ) mp ON mp.id_inscripcion = i.id_inscripcion
                    LEFT JOIN (
                        SELECT
                            id_inscripcion,
                            SUM(CASE WHEN estado = 'Pagado' THEN monto ELSE 0 END) AS total_pagado_pasarela
                        FROM pagos
                        GROUP BY id_inscripcion
                    ) pp ON pp.id_inscripcion = i.id_inscripcion
                ) base
                GROUP BY base.id_campana
            ) AS stats ON c.id_campana = stats.id_campana
            WHERE c.id_evento = ? 
            ORDER BY c.id_subevento ASC, c.fecha_creado ASC
        `;
        const [rows] = await pool.query(query, [id_evento]);

        if (rows.length === 0) {
            const [eventoRows] = await pool.query('SELECT nombre FROM eventos WHERE id_evento = ?', [id_evento]);
            const eventName = eventoRows.length > 0 ? eventoRows[0].nombre : '';
            return { eventName, campaigns: [] };
        }

        const eventName = rows[0].evento_nombre;
        const campaigns = rows.map(row => {
            const { evento_nombre, ...campaignData } = row;
            return campaignData;
        });

        return { eventName, campaigns };
    },

    findById: async (id_campana) => {
        const query = `
            SELECT c.*, s.obligatorio_pago
            FROM campanas c
            LEFT JOIN subeventos s ON c.id_subevento = s.id_subevento
            WHERE c.id_campana = ?
        `;
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
        const FormularioModel = require('./formularioModel');

        const campanaQuery = `
            SELECT
                c.id_campana, c.id_subevento, c.nombre, c.estado, c.url_amigable,
                c.inscripcion_libre,
                c.registro_sin_pago_inmediato,
                c.landing_page_json,
                c.id_plantilla,
                c.fecha_personalizada,
                c.email_incluye_qr,
                e.nombre AS evento_nombre, e.fecha_inicio, e.fecha_fin, e.ciudad, e.lugar,
                s.nombre AS subevento_nombre, s.obligatorio_registro, s.obligatorio_pago
            FROM campanas c
            JOIN eventos e ON c.id_evento = e.id_evento
            LEFT JOIN subeventos s ON c.id_subevento = s.id_subevento
            WHERE c.url_amigable = ? AND c.estado = 'Activa';
        `;
        const [campanas] = await pool.query(campanaQuery, [slug]);

        if (campanas.length === 0) {
            return null;
        }

        const campanaData = campanas[0];
        let tickets = [];

        campanaData.tipo_acceso = campanaData.obligatorio_pago ? 'De Pago' : 'Gratuito';

        if (campanaData.obligatorio_pago) {
            const ticketsQuery = 'SELECT id_tipo_entrada, nombre, precio, cantidad_total, cantidad_vendida FROM tipos_de_entrada WHERE id_campana = ? ORDER BY precio ASC';
            const [ticketRows] = await pool.query(ticketsQuery, [campanaData.id_campana]);
            tickets = ticketRows;
        }

        const formularioConfig = await FormularioModel.findByCampanaId(campanaData.id_campana);

        return {
            campana: campanaData,
            tickets: tickets,
            formulario: formularioConfig
        };
    },

    findRulesById: async (id_campana) => {
        const query = `
            SELECT 
                s.obligatorio_registro,
                s.obligatorio_pago,
                c.registro_sin_pago_inmediato
            FROM campanas c
            LEFT JOIN subeventos s ON c.id_subevento = s.id_subevento
            WHERE c.id_campana = ?;
        `;
        const [rows] = await pool.query(query, [id_campana]);
        return rows[0] || { obligatorio_registro: true, obligatorio_pago: false };
    },

    updateLanding: async (id_campana, landing_page_json) => {
        const query = 'UPDATE campanas SET landing_page_json = ? WHERE id_campana = ?';
        const [result] = await pool.query(query, [landing_page_json, id_campana]);
        return result;
    },

    findPublicDataById: async (id_campana) => {
        const campanaQuery = `
        SELECT
            c.id_campana, c.id_subevento, c.nombre, c.estado, c.url_amigable,
            c.inscripcion_libre,
            c.registro_sin_pago_inmediato,
            c.landing_page_json,
            c.id_plantilla,
            c.fecha_personalizada,
            c.email_incluye_qr,
            e.nombre AS evento_nombre, e.fecha_inicio, e.fecha_fin, e.ciudad, e.lugar,
            s.nombre AS subevento_nombre, s.obligatorio_registro, s.obligatorio_pago
        FROM campanas c
        JOIN eventos e ON c.id_evento = e.id_evento
        LEFT JOIN subeventos s ON c.id_subevento = s.id_subevento
        WHERE c.id_campana = ? AND c.estado = 'Activa';
    `;
        const [campanas] = await pool.query(campanaQuery, [id_campana]);

        if (campanas.length === 0) return null;

        const campanaData = campanas[0];
        let tickets = [];

        campanaData.tipo_acceso = campanaData.obligatorio_pago ? 'De Pago' : 'Gratuito';

        if (campanaData.obligatorio_pago) {
            const ticketsQuery = `
            SELECT id_tipo_entrada, nombre, precio, cantidad_total, cantidad_vendida
            FROM tipos_de_entrada
            WHERE id_campana = ?
            ORDER BY precio ASC
        `;
            const [ticketRows] = await pool.query(ticketsQuery, [campanaData.id_campana]);
            tickets = ticketRows;
        }

        const formularioConfig = await FormularioModel.findByCampanaId(campanaData.id_campana);

        return {
            campana: campanaData,
            tickets: tickets,
            formulario: formularioConfig
        };
    },

    getListadoSimple: async () => {
        const [rows] = await pool.query(`
            SELECT
                c.id_campana,
                c.nombre,
                c.id_evento,
                e.nombre AS evento_nombre,
                c.id_subevento,
                s.nombre AS subevento_nombre,
                c.fecha_personalizada,
                c.estado
            FROM campanas c
            JOIN eventos e ON e.id_evento = c.id_evento
            LEFT JOIN subeventos s ON s.id_subevento = c.id_subevento
            WHERE c.estado != 'eliminado'
            ORDER BY e.nombre ASC, c.nombre ASC, c.id_campana ASC
        `);
        return rows;
    },
};

module.exports = Campana;