const pool = require('../config/db');

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
    const connection = await pool.getConnection();
    try {
        for (const respuesta of respuestas) {
            await connection.query(
                'INSERT INTO inscripcion_respuestas (id_inscripcion, id_campo, valor) VALUES (?, ?, ?)',
                [id_inscripcion, respuesta.id_campo, respuesta.valor]
            );
        }
        return { success: true };
    } catch (error) {
        console.error("Error al guardar respuestas del formulario:", error);
        throw new Error('Error al guardar las respuestas.');
    } finally {
        connection.release();
    }
};

/**
 * Crea un nuevo campo de formulario personalizado y sus opciones si aplica.
 * Utiliza una transacción para garantizar la atomicidad.
 */
exports.createCampoPersonalizado = async (campoData) => {
    const { etiqueta, tipo_campo, opciones } = campoData;
    const nombre_interno = `custom_${etiqueta.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        // 1. Insertar el campo principal
        const [resultCampo] = await connection.query(
            'INSERT INTO formulario_campos (nombre_interno, etiqueta, tipo_campo, es_de_sistema, es_fijo) VALUES (?, ?, ?, 0, 0)',
            [nombre_interno, etiqueta, tipo_campo]
        );
        const newCampoId = resultCampo.insertId;

        // 2. Insertar opciones si existen
        if (opciones && opciones.length > 0) {
            const opcionesValues = opciones.map(opt => [newCampoId, opt.etiqueta_opcion]);
            await connection.query('INSERT INTO campo_opciones (id_campo, etiqueta_opcion) VALUES ?', [opcionesValues]);
        }
        
        await connection.commit();
        const [newCampo] = await pool.query('SELECT * FROM formulario_campos WHERE id_campo = ?', [newCampoId]);
        return newCampo[0];

    } catch (error) {
        await connection.rollback();
        console.error("Error en la transacción de creación de campo:", error);
        throw new Error('Error al crear el campo personalizado.');
    } finally {
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
