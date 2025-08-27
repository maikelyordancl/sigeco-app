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
                    'INSERT INTO contactos (nombre, email, telefono, rut, empresa, actividad, profesion, pais, comuna, recibir_mail) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [contacto.nombre, contacto.email, contacto.telefono, contacto.rut, contacto.empresa, contacto.actividad, contacto.profesion, contacto.pais, contacto.comuna, true]
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

// --- **NUEVA FUNCIÓN PARA ASIGNAR CONTACTOS** ---
exports.assignContacts = async (contactIds, baseIds) => {
    if (!contactIds || contactIds.length === 0 || !baseIds || baseIds.length === 0) {
        throw new Error("Se requieren IDs de contactos y bases de datos.");
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        let totalAffectedRows = 0;
        const values = [];
        // Creamos un par [id_contacto, id_base] para cada asignación
        for (const id_base of baseIds) {
            for (const id_contacto of contactIds) {
                values.push([id_contacto, id_base]);
            }
        }

        if (values.length > 0) {
            // Usamos INSERT IGNORE para no fallar si la asignación ya existe
            const query = 'INSERT IGNORE INTO contactos_por_base (id_contacto, id_base) VALUES ?';
            const [result] = await connection.query(query, [values]);
            totalAffectedRows = result.affectedRows;
        }

        await connection.commit();
        return { success: true, message: `${totalAffectedRows} nuevas asociaciones creadas.`, count: totalAffectedRows };
    } catch (error) {
        await connection.rollback();
        console.error("Error en la transacción de asignación de contactos:", error);
        throw new Error('Error en el servidor durante la asignación.');
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