const pool = require('../config/db');

// Modelo para encontrar todas las bases de datos y contar sus contactos
exports.findAllWithCount = async () => {
    const query = `
        SELECT bd.id_base, bd.nombre, bd.origen, bd.fecha_creado, COUNT(cpb.id_contacto) as cantidad_contactos
        FROM bases_de_datos bd
        LEFT JOIN contactos_por_base cpb ON bd.id_base = cpb.id_base
        GROUP BY bd.id_base
        ORDER BY bd.fecha_creado DESC
    `;
    const [rows] = await pool.query(query);
    return rows;
};

// Modelo para importar contactos a una nueva base de datos (Transacción)
exports.importar = async (nombreBase, contactos) => {
    const connection = await pool.getConnection(); // Obtenemos una conexión para la transacción
    await connection.beginTransaction();

    try {
        // 1. Crear la nueva base de datos
        const [resultBase] = await connection.query(
            'INSERT INTO bases_de_datos (nombre, origen) VALUES (?, ?)',
            [nombreBase, 'Importación']
        );
        const newBaseId = resultBase.insertId;

        // 2. Procesar cada contacto
        for (const contacto of contactos) {
            // Buscamos si el contacto ya existe por email
            let [existing] = await connection.query('SELECT id_contacto FROM contactos WHERE email = ?', [contacto.email]);
            let contactoId;

            if (existing.length > 0) {
                contactoId = existing[0].id_contacto;
            } else {
                // Si no existe, lo creamos
                const [resultContacto] = await connection.query(
                    'INSERT INTO contactos (nombre, apellido, email, telefono, rut, empresa, actividad, profesion, pais, recibir_mail) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [contacto.nombre, contacto.apellido, contacto.email, contacto.telefono, contacto.rut, contacto.empresa, contacto.actividad, contacto.profesion, contacto.pais, true]
                );
                contactoId = resultContacto.insertId;
            }

            // 3. Lo asociamos a la nueva base de datos (ignorando duplicados)
            await connection.query(
                'INSERT IGNORE INTO contactos_por_base (id_contacto, id_base) VALUES (?, ?)',
                [contactoId, newBaseId]
            );
        }

        await connection.commit(); // Si todo fue bien, confirmamos los cambios
        return { success: true, id_base: newBaseId };
    } catch (error) {
        await connection.rollback(); // Si algo falla, revertimos todo
        console.error("Error en la transacción de importación:", error);
        throw error; // Lanzamos el error para que el controlador lo capture
    } finally {
        connection.release(); // Liberamos la conexión al pool
    }
};

// Modelo para fusionar bases en una nueva (Transacción)
exports.fusionar = async (nombreBase, origen, idsBasesOrigen) => {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        // 1. Crear la nueva base de datos fusionada
        const [resultBase] = await connection.query(
            'INSERT INTO bases_de_datos (nombre, origen) VALUES (?, ?)',
            [nombreBase, origen || 'Fusión']
        );
        const newBaseId = resultBase.insertId;

        // 2. Obtener todos los IDs de contacto únicos de las bases origen
        const placeholder = idsBasesOrigen.map(() => '?').join(',');
        const [contactos] = await connection.query(
            `SELECT DISTINCT id_contacto FROM contactos_por_base WHERE id_base IN (${placeholder})`,
            idsBasesOrigen
        );

        // 3. Insertar cada contacto único en la nueva base
        for (const contacto of contactos) {
            await connection.query(
                'INSERT INTO contactos_por_base (id_contacto, id_base) VALUES (?, ?)',
                [contacto.id_contacto, newBaseId]
            );
        }

        await connection.commit();
        return { success: true, id_base: newBaseId };
    } catch (error) {
        await connection.rollback();
        console.error("Error en la transacción de fusión:", error);
        throw error;
    } finally {
        connection.release();
    }
};


// Modelo para eliminar una base de datos
exports.deleteById = async (id) => {
    // ON DELETE CASCADE se encarga de las relaciones en `contactos_por_base`
    const [result] = await pool.query('DELETE FROM bases_de_datos WHERE id_base = ?', [id]);
    return result;
};
