const pool = require('../config/db');

// Modelo para encontrar y contar contactos con paginación y búsqueda mejorada
exports.findAndCountAll = async ({ page = 1, limit = 15, search = '' }) => {
    const pageInt = parseInt(page, 10);
    const limitInt = parseInt(limit, 10);
    const offset = (pageInt - 1) * limitInt;

    let searchQuery = '';
    const searchParams = [];

    if (search) {
        // Dividimos el término de búsqueda en palabras individuales
        const searchTerms = search.split(' ').filter(term => term); // Filtra para eliminar espacios extra
        if (searchTerms.length > 0) {
            // Creamos una condición 'LIKE' para cada palabra
            const searchConditions = searchTerms.map(() => 
                `CONCAT_WS(' ', nombre, email, empresa, rut) LIKE ?`
            ).join(' AND ');
            
            searchQuery = `WHERE ${searchConditions}`;
            
            // Añadimos cada palabra a los parámetros, envuelta en '%' para la búsqueda parcial
            searchTerms.forEach(term => searchParams.push(`%${term}%`));
        }
    }

    const [totalRows] = await pool.query(`SELECT COUNT(*) as total FROM contactos ${searchQuery}`, searchParams);
    const total = totalRows[0].total;

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
    const { nombre, email, telefono, rut, empresa, actividad, profesion, pais, comuna, recibir_mail } = contactoData;
    const query = `
        INSERT INTO contactos (nombre, email, telefono, rut, empresa, actividad, profesion, pais, comuna, recibir_mail)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(query, [nombre, email, telefono, rut, empresa, actividad, profesion, pais, comuna, recibir_mail]);
    return { id_contacto: result.insertId, ...contactoData };
};

// Modelo para actualizar un contacto por su ID 
exports.updateById = async (id, contactoData) => {
    const fields = Object.keys(contactoData);
    
    const updateFields = fields.filter(field => 
        field !== 'id_contacto' && 
        field !== 'fecha_creado' &&
        contactoData[field] !== undefined
    );

    if (updateFields.length === 0) {
        return { affectedRows: 0, message: "No fields to update" };
    }

    const setClause = updateFields.map(field => `${field} = ?`).join(', ');
    
    const values = updateFields.map(field => {
        const value = contactoData[field];
        if ((field === 'fecha_modificado') && value) {
            return new Date(value).toISOString().slice(0, 19).replace('T', ' ');
        }
        return value;
    });

    const query = `UPDATE contactos SET ${setClause} WHERE id_contacto = ?`;
    
    const [result] = await pool.query(query, [...values, id]);
    return result;
};

// Modelo para eliminar un contacto por su ID
exports.deleteById = async (id) => {
    const [result] = await pool.query('DELETE FROM contactos WHERE id_contacto = ?', [id]);
    return result;
};

// Modelo para encontrar un contacto por su email.
exports.findByEmail = async (email) => {
    const query = 'SELECT * FROM contactos WHERE email = ?';
    const [rows] = await pool.query(query, [email]);
    return rows[0] || null;
};

// Encuentra todos los contactos que no están asignados a ninguna base de datos.
exports.findOrphaned = async () => {
    const query = `
        SELECT c.* FROM contactos c
        LEFT JOIN contactos_por_base cpb ON c.id_contacto = cpb.id_contacto
        WHERE cpb.id_base IS NULL
        ORDER BY c.fecha_creado DESC;
    `;
    const [rows] = await pool.query(query);
    return rows;
};

/**
 * Busca un contacto por email, pero solo si está asociado a una campaña
 * específica a través de su slug (url_amigable).
 */
exports.findByEmailAndCampanaSlug = async (email, slug) => {
    // --- INICIO DE LA CORRECCIÓN ---
    // Consulta corregida para usar solo columnas existentes en la tabla `contactos`:
    // Se eliminó `c.apellido` y se cambió `c.cargo` por `c.profesion`.
    const query = `
        SELECT c.id_contacto, c.nombre, c.email, c.telefono, c.rut, c.empresa, c.actividad, c.profesion, c.pais, c.comuna
        FROM contactos c
        JOIN inscripciones i ON c.id_contacto = i.id_contacto
        JOIN campanas ca ON i.id_campana = ca.id_campana
        WHERE c.email = ? AND ca.url_amigable = ?
        LIMIT 1;
    `;
    // --- FIN DE LA CORRECCIÓN ---
    
    try {
        const [rows] = await pool.query(query, [email, slug]);
        return rows[0] || null; // Devuelve el contacto o null
    } catch (error) {
        console.error("Error en findByEmailAndCampanaSlug:", error);
        throw error;
    }
};