/**
 * Modelo para gestionar las operaciones de la base de datos para las campañas.
 * Utiliza un pool de conexiones para interactuar con la base de datos MySQL.
 */
const pool = require('../config/db');
const FormularioModel = require('./formularioModel');
const Campana = {
    /**
     * Crea una nueva campaña en la base de datos.
     * Si la campaña está asociada a un sub-evento (es una sub-campaña),
     * también crea una configuración de formulario por defecto para ella.
     * Utiliza una transacción para asegurar que ambas operaciones (crear campaña y crear config. de formulario)
     * se completen exitosamente o ninguna lo haga.
     * @param {object} campanaData - Datos de la campaña a crear.
     * @returns {object} El objeto de la campaña creada.
     * @throws {Error} Si ocurre un error durante la transacción.
     */
    create: async (campanaData) => {
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            const { id_evento, id_subevento = null, nombre, estado, url_amigable = null, id_plantilla = 1 } = campanaData;

            // 1. Insertar la nueva campaña
            const queryCampana = `
                INSERT INTO campanas (id_evento, id_subevento, nombre, estado, url_amigable, id_plantilla)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            const [result] = await connection.query(queryCampana, [id_evento, id_subevento, nombre, estado, url_amigable, id_plantilla]);
            const newCampanaId = result.insertId;

            // 2. Si es una SUB-CAMPAÑA, asociar los campos de formulario por defecto
            if (id_subevento) {
                // Obtener todos los campos de sistema que se usarán por defecto
                const [camposSistema] = await connection.query('SELECT id_campo, nombre_interno FROM formulario_campos WHERE es_de_sistema = 1');

                // Definir qué campos serán obligatorios por defecto en el formulario
                const camposObligatorios = ['nombre', 'email', 'telefono', 'pais', 'comuna'];

                // Preparar los valores para la inserción masiva en la tabla de configuración
                const configValues = camposSistema.map((campo, index) => {
                    const esObligatorio = camposObligatorios.includes(campo.nombre_interno);
                    // Formato: [id_campana, id_campo, es_visible, es_obligatorio, orden]
                    return [newCampanaId, campo.id_campo, true, esObligatorio, index + 1];
                });

                // Insertar la configuración por defecto para la nueva campaña
                if (configValues.length > 0) {
                    const queryConfig = `
                        INSERT INTO campana_formulario_config (id_campana, id_campo, es_visible, es_obligatorio, orden)
                        VALUES ?
                    `;
                    await connection.query(queryConfig, [configValues]);
                }
            }

            // 3. Si todo fue exitoso, confirmar la transacción
            await connection.commit();

            // Devolver el objeto de la campaña recién creada
            return { id_campana: newCampanaId, ...campanaData };

        } catch (error) {
            // 4. Si algo falla, revertir todos los cambios de la transacción
            await connection.rollback();
            console.error("Error en la transacción de creación de campaña:", error);
            // Re-lanzar el error para que sea manejado por el controlador
            throw error;
        } finally {
            // 5. Liberar la conexión para que pueda ser reutilizada por otros procesos
            connection.release();
        }
    },

    /**
     * Busca todas las campañas asociadas a un evento específico, incluyendo estadísticas y el nombre del evento.
     * @param {number} id_evento - El ID del evento.
     * @returns {Promise<object>} Un objeto que contiene el nombre del evento y un arreglo con las campañas encontradas.
     */
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
                COALESCE(stats.pagados, 0) AS pagados
            FROM campanas c
            JOIN eventos e ON c.id_evento = e.id_evento
            LEFT JOIN subeventos s ON c.id_subevento = s.id_subevento
            LEFT JOIN (
                SELECT
                    id_campana,
                    COUNT(CASE WHEN estado_asistencia = 'Invitado' THEN 1 END) AS invitados,
                    COUNT(CASE WHEN estado_asistencia = 'Registrado' THEN 1 END) AS registrados,
                    COUNT(CASE WHEN estado_asistencia = 'Confirmado' THEN 1 END) AS confirmados,
                    COUNT(CASE WHEN estado_asistencia = 'Asistió' THEN 1 END) AS asistieron,
                    COUNT(CASE WHEN estado_asistencia = 'Cancelado' THEN 1 END) AS cancelados,
                    COUNT(CASE WHEN estado_pago = 'Pagado' THEN 1 END) AS pagados
                FROM inscripciones
                GROUP BY id_campana
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


    /**
     * Busca una campaña específica por su ID.
     * @param {number} id_campana - El ID de la campaña.
     * @returns {object|null} El objeto de la campaña o null si no se encuentra.
     */
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

    /**
     * Actualiza los datos de una campaña específica.
     * @param {number} id_campana - El ID de la campaña a actualizar.
     * @param {object} campanaData - Los nuevos datos para la campaña.
     * @returns {object} El resultado de la operación de actualización.
     */
    updateById: async (id_campana, campanaData) => {
        const query = 'UPDATE campanas SET ? WHERE id_campana = ?';
        const [result] = await pool.query(query, [campanaData, id_campana]);
        return result;
    },

    /**
     * Elimina una campaña de la base de datos.
     * @param {number} id_campana - El ID de la campaña a eliminar.
     * @returns {object} El resultado de la operación de eliminación.
     */
    deleteById: async (id_campana) => {
        const query = 'DELETE FROM campanas WHERE id_campana = ?';
        const [result] = await pool.query(query, [id_campana]);
        return result;
    },

    /**
     * Busca los datos públicos de una campaña utilizando su URL amigable (slug).
     * Esta función está diseñada para ser usada en páginas públicas de registro.
     * @param {string} slug - La URL amigable de la campaña.
     * @returns {object|null} Un objeto con los datos de la campaña, tickets y formulario, o null si no se encuentra.
     */
    findPublicDataBySlug: async (slug) => {
        // Importación local de FormularioModel para evitar dependencias circulares a nivel de módulo.
        // Esto es seguro porque Node.js cachea los módulos después de la primera carga.
        const FormularioModel = require('./formularioModel');

        const campanaQuery = `
            SELECT
                c.id_campana, c.id_subevento, c.nombre, c.estado, c.url_amigable,
                c.inscripcion_libre,
                c.landing_page_json,
                c.id_plantilla, -- <--- AÑADIDO
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

        // Si la campaña requiere pago, obtener los tipos de entrada (tickets)
        if (campanaData.obligatorio_pago) {
            const ticketsQuery = 'SELECT id_tipo_entrada, nombre, precio, cantidad_total, cantidad_vendida FROM tipos_de_entrada WHERE id_campana = ? ORDER BY precio ASC';
            const [ticketRows] = await pool.query(ticketsQuery, [campanaData.id_campana]);
            tickets = ticketRows;
        }

        // Obtener la configuración del formulario de registro para esta campaña
        const formularioConfig = await FormularioModel.findByCampanaId(campanaData.id_campana);

        return {
            campana: campanaData,
            tickets: tickets,
            formulario: formularioConfig
        };
    },

    /**
     * Obtiene las reglas de negocio (registro y pago) de una campaña.
     * @param {number} id_campana - El ID de la campaña.
     * @returns {object|null} Un objeto con las reglas o null si no se encuentra.
     */
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
        return rows[0] || { obligatorio_registro: true, obligatorio_pago: false }; // Fallback para campañas principales
    },

    updateLanding: async (id_campana, landing_page_json) => {
        const query = 'UPDATE campanas SET landing_page_json = ? WHERE id_campana = ?';
        const [result] = await pool.query(query, [landing_page_json, id_campana]);
        return result;
    },
    /**
 * Busca los datos públicos de una campaña por su ID.
 * Similar a findPublicDataBySlug pero usando id_campana.
 */
    findPublicDataById: async (id_campana) => {

        const campanaQuery = `
        SELECT
            c.id_campana, c.id_subevento, c.nombre, c.estado, c.url_amigable,
            c.inscripcion_libre,
            c.landing_page_json,
            c.id_plantilla, -- <--- AÑADIDO
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

};

module.exports = Campana;