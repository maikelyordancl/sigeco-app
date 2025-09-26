const pool = require('../config/db');
const crypto = require('crypto');

/**
 * Obtiene la configuración completa del formulario para una campaña,
 * incluyendo campos de sistema y personalizados, con sus opciones.
 */
exports.findByCampanaId = async (id_campana) => {
    // Primero, obtenemos la configuración guardada para esta campaña
    const configQuery = `
        SELECT
            fc.id_campo,
            fc.nombre_interno,
            fc.etiqueta,
            fc.tipo_campo,
            fc.es_de_sistema,
            fc.es_fijo,
            cfc.es_visible,
            cfc.es_obligatorio,
            cfc.orden
        FROM campana_formulario_config cfc
        JOIN formulario_campos fc ON cfc.id_campo = fc.id_campo
        WHERE cfc.id_campana = ?
        ORDER BY cfc.orden ASC;
    `;
    const [configRows] = await pool.query(configQuery, [id_campana]);

    // Si no hay configuración, creamos una por defecto con los campos de sistema
    if (configRows.length === 0) {
        const [defaultFields] = await pool.query('SELECT * FROM formulario_campos WHERE es_de_sistema = 1 ORDER BY id_campo ASC');
        return defaultFields.map((field, index) => ({
            ...field,
            es_visible: 1, // Por defecto, todos los campos de sistema son visibles
            es_obligatorio: field.es_fijo, // Solo los fijos son obligatorios por defecto
            orden: index
        }));
    }

    // Para cada campo, si es de selección, buscamos sus opciones
    for (const campo of configRows) {
        if (['SELECCION_UNICA', 'CASILLAS', 'DESPLEGABLE'].includes(campo.tipo_campo)) {
            const [opciones] = await pool.query('SELECT id_opcion, etiqueta_opcion FROM campo_opciones WHERE id_campo = ?', [campo.id_campo]);
            campo.opciones = opciones;
        }
    }

    return configRows;
};

/**
 * Guarda la configuración del formulario para una campaña.
 * Utiliza una transacción para asegurar la integridad de los datos.
 */
exports.updateByCampanaId = async (id_campana, campos) => {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        // Borramos la configuración anterior para esta campaña
        await connection.query('DELETE FROM campana_formulario_config WHERE id_campana = ?', [id_campana]);

        // Insertamos la nueva configuración
        for (const campo of campos) {
            await connection.query(
                'INSERT INTO campana_formulario_config (id_campana, id_campo, es_visible, es_obligatorio, orden) VALUES (?, ?, ?, ?, ?)',
                [id_campana, campo.id_campo, campo.es_visible, campo.es_obligatorio, campo.orden]
            );
        }

        await connection.commit();
        return { success: true, message: 'Configuración guardada con éxito.' };
    } catch (error) {
        await connection.rollback();
        console.error("Error en la transacción de guardado de formulario:", error);
        throw new Error('Error al guardar la configuración del formulario.');
    } finally {
        connection.release();
    }
};

/**
 * Guarda las respuestas de un formulario de inscripción.
 */
exports.saveRespuestas = async (id_inscripcion, respuestas) => {
    try {
        console.log('Guardando respuestas para inscripcion:', id_inscripcion);
        console.log('Respuestas recibidas:', respuestas);

        for (const respuesta of respuestas) {
            const { id_campo, valor } = respuesta;

            // Determina cómo persistir:
            // - Arrays/objetos -> JSON.stringify (una sola vez)
            // - Escalares (string/number/bool) -> texto plano (String)
            let valorParaGuardar;
            if (Array.isArray(valor) || (valor !== null && typeof valor === 'object')) {
                valorParaGuardar = JSON.stringify(valor);
            } else if (valor === null || valor === undefined) {
                // No guardamos valores nulos/indefinidos
                continue;
            } else {
                valorParaGuardar = String(valor);
            }

            console.log(`Guardando campo ${id_campo} con valor:`, valorParaGuardar);

            await pool.query(
                `INSERT INTO inscripcion_respuestas (id_inscripcion, id_campo, valor)
                 VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE valor = VALUES(valor)`,
                [id_inscripcion, id_campo, valorParaGuardar]
            );
        }

        console.log('Respuestas guardadas exitosamente.');
    } catch (error) {
        console.error('Error al guardar respuestas del formulario:', error);
        throw new Error('Error al guardar las respuestas.');
    }
};



/**
 * Crea un campo personalizado y sus opciones asociadas.
 * La operación completa se envuelve en una transacción para garantizar la atomicidad.
 *
 * @async
 * @param {object} campoData - Datos del campo a crear.
 * @param {string} campoData.etiqueta - Etiqueta visible del campo.
 * @param {string} campoData.tipo_campo - Tipo de campo ('TEXTO', 'DESPLEGABLE', etc.).
 * @param {Array<{etiqueta_opcion: string}>} [campoData.opciones] - Opciones para campos tipo selector.
 * @returns {Promise<object>} El registro del campo recién creado.
 * @throws {Error} Relanza el error en caso de fallo para que sea manejado por el servicio que lo invoca.
 */
exports.createCampoPersonalizado = async (campoData) => {
    const { etiqueta, tipo_campo, opciones } = campoData;

    // Genera un nombre interno (slug) único y seguro a partir de la etiqueta.
    // Necesario para evitar conflictos y caracteres inválidos en atributos HTML o claves de objeto.
    const cleanEtiqueta = etiqueta
        .toLowerCase()
        .normalize('NFD') // Separa letras de sus tildes 
        .replace(/[\u0300-\u036f]/g, '') // Elimina los tildes y diacríticos
        .replace(/ñ/g, 'n') // Reemplazar la ñ
        .replace(/[^a-z0-9\s]/g, '') // Elimina caracteres no alfanuméricos, sin espacios
        .trim() // Quitar espacios al inicio y fin
        .replace(/\s+/g, '_'); // Reemplazar espacios con guiones bajos

    const truncatedEtiqueta = cleanEtiqueta.substring(0, 60);
    const shortId = crypto.randomBytes(4).toString('hex');
    const nombre_interno = `custom_${truncatedEtiqueta}_${shortId}_${Date.now()}`;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        // Inserta el campo principal.
        const [resultCampo] = await connection.query(
            'INSERT INTO formulario_campos (nombre_interno, etiqueta, tipo_campo, es_de_sistema, es_fijo) VALUES (?, ?, ?, 0, 0)',
            [nombre_interno, etiqueta, tipo_campo]
        );
        const newCampoId = resultCampo.insertId;

        // Inserción masiva de opciones, si existen.
        if (opciones && opciones.length > 0) {
            const opcionesValues = opciones.map(opt => [newCampoId, opt.etiqueta_opcion]);
            await connection.query('INSERT INTO campo_opciones (id_campo, etiqueta_opcion) VALUES ?', [opcionesValues]);
        }
        
        // La operación fue exitosa, confirmar cambios.
        await connection.commit();
        
        // Retornar la entidad recién creada.
        const [newCampo] = await pool.query('SELECT * FROM formulario_campos WHERE id_campo = ?', [newCampoId]);
        return newCampo[0];

    } catch (error) {
        // Rollback ante cualquier error durante la transacción.
        await connection.rollback();
        console.error("Error en transacción createCampoPersonalizado:", error);
        // Propagar el error hacia la capa de servicio/controlador.
        throw new Error('Error al crear el campo personalizado.');
    } finally {
        // Asegurar siempre la liberación de la conexión de vuelta al pool.
        connection.release();
    }
};

/**
 * Elimina un campo de formulario personalizado.
 * Las opciones asociadas se eliminan en cascada por la BBDD.
 */
exports.deleteCampoPersonalizado = async (id_campo) => {
    const [result] = await pool.query('DELETE FROM formulario_campos WHERE id_campo = ? AND es_de_sistema = 0', [id_campo]);
    return result;
};

/**
 * Actualiza un campo de formulario personalizado y sus opciones.
 * Utiliza una transacción para garantizar la atomicidad.
 * @param {number} id_campo - El ID del campo a actualizar.
 * @param {object} campoData - Los nuevos datos para el campo.
 * @returns {object} El objeto del campo actualizado.
 */
exports.updateCampoPersonalizado = async (id_campo, campoData) => {
    const { etiqueta, opciones } = campoData;
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        // 1. Actualizar la etiqueta del campo principal
        await connection.query(
            'UPDATE formulario_campos SET etiqueta = ? WHERE id_campo = ? AND es_de_sistema = 0',
            [etiqueta, id_campo]
        );

        // 2. Borrar las opciones antiguas
        await connection.query('DELETE FROM campo_opciones WHERE id_campo = ?', [id_campo]);

        // 3. Insertar las nuevas opciones si existen
        if (opciones && opciones.length > 0) {
            const opcionesValues = opciones.map(opt => [id_campo, opt.etiqueta_opcion]);
            await connection.query('INSERT INTO campo_opciones (id_campo, etiqueta_opcion) VALUES ?', [opcionesValues]);
        }

        await connection.commit();

        // Devolvemos el campo actualizado con sus nuevas opciones
        const [rows] = await pool.query('SELECT * FROM formulario_campos WHERE id_campo = ?', [id_campo]);
        const campoActualizado = rows[0];

        if (campoActualizado && ['SELECCION_UNICA', 'CASILLAS', 'DESPLEGABLE'].includes(campoActualizado.tipo_campo)) {
            const [opcionesNuevas] = await pool.query('SELECT id_opcion, etiqueta_opcion FROM campo_opciones WHERE id_campo = ?', [id_campo]);
            campoActualizado.opciones = opcionesNuevas;
        }

        return campoActualizado;

    } catch (error) {
        await connection.rollback();
        console.error("Error en la transacción de actualización de campo:", error);
        throw new Error('Error al actualizar el campo personalizado.');
    } finally {
        connection.release();
    }
};

exports.findCamposByCampanaId = async (id_campana) => {
    const query = `
        SELECT 
            fc.id_campo, fc.nombre_interno, fc.etiqueta, 
            fc.es_de_sistema, fc.tipo_campo
        FROM campana_formulario_config cfc
        JOIN formulario_campos fc ON cfc.id_campo = fc.id_campo
        WHERE cfc.id_campana = ?
        ORDER BY cfc.orden;
    `;
    const [campos] = await pool.execute(query, [id_campana]);

    // Bucle para obtener las opciones de los campos tipo 'Select'
    for (const campo of campos) {
        if (['SELECCION_UNICA', 'CASILLAS', 'DESPLEGABLE'].includes(campo.tipo_campo)) {
            const opcionesQuery = 'SELECT id_opcion, etiqueta_opcion FROM campo_opciones WHERE id_campo = ?';
            const [opciones] = await pool.query(opcionesQuery, [campo.id_campo]);
            campo.opciones = opciones;
        } else {
            // Aseguramos que siempre exista la propiedad 'opciones'
            campo.opciones = [];
        }
    }
    
    return campos;

};

/**
 * Obtiene los campos de formulario para una campaña específica,
 * destinado a la generación de plantillas. Es una versión simplificada
 * que no carga las opciones de los campos de selección.
 * @param {number} idCampana - El ID de la campaña.
 * @returns {Promise<Array<object>>} Un arreglo con los campos del formulario.
 */
exports.getCamposByCampanaId = async (idCampana) => {
    const query = `
        SELECT fc.nombre_interno, fc.etiqueta, fc.es_fijo
        FROM campana_formulario_config cfc
        JOIN formulario_campos fc ON cfc.id_campo = fc.id_campo
        WHERE cfc.id_campana = ?
        ORDER BY cfc.orden;
    `;
    const [rows] = await pool.query(query, [idCampana]);
    return rows;
};
