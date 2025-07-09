const pool = require('../config/db');

// Modelo para encontrar y contar contactos con paginación y búsqueda
exports.findAndCountAll = async ({ page = 1, limit = 15, search = '' }) => {
    // --- INICIO DE LA CORRECCIÓN ---
    // Convertimos los parámetros de la URL (que son strings) a números enteros.
    const pageInt = parseInt(page, 10);
    const limitInt = parseInt(limit, 10);
    const offset = (pageInt - 1) * limitInt;
    // --- FIN DE LA CORRECCIÓN ---

    let searchQuery = '';
    const searchParams = [];

    if (search) {
        searchQuery = `
            WHERE nombre LIKE ? OR apellido LIKE ? OR email LIKE ? OR empresa LIKE ?
        `;
        const searchTerm = `%${search}%`;
        // Añadimos el término de búsqueda para cada campo
        searchParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Consulta para obtener el total de registros que coinciden con la búsqueda
    const [totalRows] = await pool.query(`SELECT COUNT(*) as total FROM contactos ${searchQuery}`, searchParams);
    const total = totalRows[0].total;

    // Consulta para obtener los contactos de la página actual
    // Usamos los valores numéricos corregidos para LIMIT y OFFSET
    const finalParams = [...searchParams, limitInt, offset];
    const [contactos] = await pool.query(`SELECT * FROM contactos ${searchQuery} ORDER BY fecha_creado DESC LIMIT ? OFFSET ?`, finalParams);

    return {
        total,
        total_paginas: Math.ceil(total / limitInt),
        contactos
    };
};


// Modelo para crear un nuevo contacto
exports.create = async (contactoData) => {
    const { nombre, apellido, email, telefono, rut, empresa, actividad, profesion, pais, recibir_mail } = contactoData;
    const query = `
        INSERT INTO contactos (nombre, apellido, email, telefono, rut, empresa, actividad, profesion, pais, recibir_mail)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(query, [nombre, apellido, email, telefono, rut, empresa, actividad, profesion, pais, recibir_mail]);
    return { id_contacto: result.insertId, ...contactoData };
};

// Modelo para actualizar un contacto por su ID
exports.updateById = async (id, contactoData) => {
    const { nombre, apellido, email, telefono, rut, empresa, actividad, profesion, pais, recibir_mail } = contactoData;
    const query = `
        UPDATE contactos SET
        nombre = ?, apellido = ?, email = ?, telefono = ?, rut = ?, empresa = ?,
        actividad = ?, profesion = ?, pais = ?, recibir_mail = ?
        WHERE id_contacto = ?
    `;
    const [result] = await pool.query(query, [nombre, apellido, email, telefono, rut, empresa, actividad, profesion, pais, recibir_mail, id]);
    return result;
};

// Modelo para eliminar un contacto por su ID
exports.deleteById = async (id) => {
    // La relación en `contactos_por_base` se borrará automáticamente por ON DELETE CASCADE
    const [result] = await pool.query('DELETE FROM contactos WHERE id_contacto = ?', [id]);
    return result;
};
