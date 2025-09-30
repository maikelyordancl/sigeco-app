const pool = require('../config/db');

const Inscripcion = {
    create: async (inscripcionData) => {
        const { id_campana, id_contacto, estado_asistencia, estado_pago } = inscripcionData;
        const query = `
            INSERT INTO inscripciones (id_campana, id_contacto, estado_asistencia, estado_pago)
            VALUES (?, ?, ?, ?)
        `;
        const [result] = await pool.query(query, [id_campana, id_contacto, estado_asistencia, estado_pago]);
        return { id_inscripcion: result.insertId, ...inscripcionData };
    },

    findByCampanaAndContacto: async (id_campana, id_contacto) => {
        const query = 'SELECT * FROM inscripciones WHERE id_campana = ? AND id_contacto = ?';
        const [rows] = await pool.query(query, [id_campana, id_contacto]);
        return rows[0] || null;
    },

    update: async (id_inscripcion, dataToUpdate) => {
        const query = 'UPDATE inscripciones SET ? WHERE id_inscripcion = ?';
        const [result] = await pool.query(query, [dataToUpdate, id_inscripcion]);
        return result;
    },

    convocarDesdeBase: async (id_campana, idsBasesOrigen) => {
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            const [campanaRules] = await connection.query(`
                SELECT s.obligatorio_registro 
                FROM campanas c
                JOIN subeventos s ON c.id_subevento = s.id_subevento
                WHERE c.id_campana = ?
            `, [id_campana]);

            if (campanaRules.length === 0) {
                throw new Error('Campaña no encontrada o no está asociada a un sub-evento.');
            }

            const { obligatorio_registro } = campanaRules[0];
            const estadoAsistencia = obligatorio_registro ? 'Registrado' : 'Invitado';

            const placeholder = idsBasesOrigen.map(() => '?').join(',');
            const [contactos] = await connection.query(
                `SELECT DISTINCT id_contacto FROM contactos_por_base WHERE id_base IN (${placeholder})`,
                idsBasesOrigen
            );

            if (contactos.length === 0) {
                await connection.commit();
                return { success: true, message: 'No se encontraron nuevos contactos para convocar.', count: 0 };
            }

            const values = contactos.map(c => [id_campana, c.id_contacto, estadoAsistencia, 'No Aplica']);
            const query = `
                INSERT IGNORE INTO inscripciones (id_campana, id_contacto, estado_asistencia, estado_pago)
                VALUES ?
            `;

            const [result] = await connection.query(query, [values]);

            await connection.commit();

            return {
                success: true,
                message: `${result.affectedRows} de ${contactos.length} contactos han sido convocados exitosamente.`,
                count: result.affectedRows
            };

        } catch (error) {
            await connection.rollback();
            console.error("Error en la transacción de convocatoria:", error);
            throw new Error('Error en el servidor durante la convocatoria.');
        } finally {
            connection.release();
        }
    },

    findWithCustomFieldsByCampanaId: async (id_campana, limit = 100, offset = 0) => {
        // --- INICIO DE LA MODIFICACIÓN ---

        // 1. Consulta para obtener los conteos por estado y el total de inscripciones
        const countQuery = `
            SELECT 
                COUNT(*) AS total,
                SUM(CASE WHEN estado_asistencia = 'Invitado' THEN 1 ELSE 0 END) AS "Invitado",
                SUM(CASE WHEN estado_asistencia = 'Abrio Email' THEN 1 ELSE 0 END) AS "Abrio Email",
                SUM(CASE WHEN estado_asistencia = 'Registrado' THEN 1 ELSE 0 END) AS "Registrado",
                SUM(CASE WHEN estado_asistencia = 'Confirmado' THEN 1 ELSE 0 END) AS "Confirmado",
                SUM(CASE WHEN estado_asistencia = 'Por Confirmar' THEN 1 ELSE 0 END) AS "Por Confirmar",
                SUM(CASE WHEN estado_asistencia = 'Asistió' THEN 1 ELSE 0 END) AS "Asistió",
                SUM(CASE WHEN estado_asistencia = 'No Asiste' THEN 1 ELSE 0 END) AS "No Asiste",
                SUM(CASE WHEN estado_asistencia = 'Cancelado' THEN 1 ELSE 0 END) AS "Cancelado"
            FROM inscripciones 
            WHERE id_campana = ?
        `;

        const [countRows] = await pool.execute(countQuery, [id_campana]);
        const counts = countRows[0];
        const totalInscripciones = counts.total || 0;
        
        // Creamos el objeto de conteos para el frontend
        const statusCounts = {
            "Invitado": parseInt(counts["Invitado"] || 0),
            "Abrio Email": parseInt(counts["Abrio Email"] || 0),
            "Registrado": parseInt(counts["Registrado"] || 0),
            "Confirmado": parseInt(counts["Confirmado"] || 0),
            "Por Confirmar": parseInt(counts["Por Confirmar"] || 0),
            "Asistió": parseInt(counts["Asistió"] || 0),
            "No Asiste": parseInt(counts["No Asiste"] || 0),
            "Cancelado": parseInt(counts["Cancelado"] || 0)
        };
        
        // --- FIN DE LA MODIFICACIÓN ---

        const [campos] = await pool.execute(
            `SELECT fc.id_campo, fc.nombre_interno, fc.etiqueta 
             FROM campana_formulario_config cfc
             JOIN formulario_campos fc ON cfc.id_campo = fc.id_campo
             WHERE cfc.id_campana = ? AND fc.es_de_sistema = 0`,
            [id_campana]
        );

        let customFieldsSelect = '';
        if (campos.length > 0) {
            customFieldsSelect = campos.map(campo =>
                `MAX(CASE WHEN ir.id_campo = ${campo.id_campo} THEN ir.valor END) AS \`${campo.nombre_interno}\``
            ).join(', ');
        }
        
        const query = `
            SELECT 
                ROW_NUMBER() OVER (ORDER BY i.fecha_inscripcion ASC) as '#',
                i.id_inscripcion, i.estado_asistencia, i.estado_pago, i.nota,
                c.id_contacto, c.nombre, c.email, c.telefono, c.rut, c.empresa, c.actividad, c.profesion, c.pais, c.comuna,
                p.id_pago, p.monto, p.estado AS estado_transaccion,
                te.nombre AS tipo_entrada
                ${customFieldsSelect ? `, ${customFieldsSelect}` : ''}
            FROM inscripciones i
            JOIN contactos c ON i.id_contacto = c.id_contacto
            LEFT JOIN inscripcion_respuestas ir ON i.id_inscripcion = ir.id_inscripcion
            LEFT JOIN pagos p ON i.id_inscripcion = p.id_inscripcion
            LEFT JOIN tipos_de_entrada te ON i.id_tipo_entrada = te.id_tipo_entrada
            WHERE i.id_campana = ?
            GROUP BY i.id_inscripcion
            ORDER BY i.fecha_inscripcion ASC
            LIMIT ? OFFSET ?
        `;

        const [rows] = await pool.execute(query, [id_campana, limit, offset]);
        
        // Devolvemos el nuevo objeto con los conteos
        return {
            asistentes: rows,
            totalInscripciones,
            totalPages: Math.ceil(totalInscripciones / limit),
            statusCounts // <-- ¡AQUÍ ESTÁ LA NUEVA DATA!
        };
    },
    updateStatus: async (id_inscripcion, estado_asistencia) => {
        // CORRECCIÓN: Se usa 'pool' en lugar de 'db'
        const [result] = await pool.execute(
            'UPDATE inscripciones SET estado_asistencia = ? WHERE id_inscripcion = ?',
            [estado_asistencia, id_inscripcion]
        );
        return result.affectedRows > 0;
    },

    updateNota: async (id_inscripcion, nota) => {
        // CORRECCIÓN: Se usa 'pool' en lugar de 'db'
        const [result] = await pool.execute(
            'UPDATE inscripciones SET nota = ? WHERE id_inscripcion = ?',
            [nota, id_inscripcion]
        );
        return result.affectedRows > 0;
    },
    // --- FIN DE LAS NUEVAS FUNCIONES CORREGIDAS ---

    updateOrInsertRespuestas: async (id_inscripcion, asistenteData) => {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const { custom_fields, ...contactInfo } = asistenteData;

            // 1. Actualizar datos del contacto
            if (Object.keys(contactInfo).length > 0) {
                const { id_contacto } = (await connection.query('SELECT id_contacto FROM inscripciones WHERE id_inscripcion = ?', [id_inscripcion]))[0][0];
                await connection.query('UPDATE contactos SET ? WHERE id_contacto = ?', [contactInfo, id_contacto]);
            }

            // 2. Actualizar/Insertar respuestas de campos personalizados
            if (custom_fields) {
                for (const field of custom_fields) {
                    // Solo insertar si hay valor definido (no vacío)
                    if (field.valor !== undefined && field.valor !== null && field.valor !== '') {
                        await connection.query(
                            'INSERT INTO inscripcion_respuestas (id_inscripcion, id_campo, valor) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE valor = VALUES(valor)',
                            [id_inscripcion, field.id_campo, field.valor]
                        );
                    }
                }
            }

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            console.error("Error en el modelo al actualizar asistente:", error);
            throw error;
        } finally {
            connection.release();
        }
    },

    updateAsistenteCompleto: async (id_inscripcion, estado_asistencia, nota, respuestas, datosContacto) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // 1. Actualizar estado y nota en la tabla de inscripciones
            await connection.query(
                'UPDATE inscripciones SET estado_asistencia = ?, nota = ? WHERE id_inscripcion = ?',
                [estado_asistencia, nota, id_inscripcion]
            );

            // 2. Actualizar datos base del contacto (si vienen)
            if (Object.keys(datosContacto).length > 0) {
                const { id_contacto } = (await connection.query('SELECT id_contacto FROM inscripciones WHERE id_inscripcion = ?', [id_inscripcion]))[0][0];
                await connection.query('UPDATE contactos SET ? WHERE id_contacto = ?', [datosContacto, id_contacto]);
            }

            // 3. Actualizar/Insertar respuestas de campos personalizados
            if (respuestas && respuestas.length > 0) {
                for (const resp of respuestas) {
                    // Elimina el condicional 'if (resp.valor !== undefined && resp.valor !== null)'
                    const valorAGuardar = resp.valor === '' ? null : resp.valor;

                    await connection.query(
                        'INSERT INTO inscripcion_respuestas (id_inscripcion, id_campo, valor) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE valor = VALUES(valor)',
                        [id_inscripcion, resp.id_campo, valorAGuardar]
                    );
                }
            }

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            console.error("Error en el modelo al actualizar asistente completo:", error);
            throw error;
        } finally {
            connection.release();
        }
    },

    deleteById: async (id_inscripcion) => {
        const [result] = await pool.execute(
            'DELETE FROM inscripciones WHERE id_inscripcion = ?',
            [id_inscripcion]
        );
        return result.affectedRows > 0;
    },

    importarMasivamente: async (id_campana, contactos) => {
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            console.log('--- Iniciando Proceso de Importación Masiva ---');

            const camposQuery = `
                SELECT fc.id_campo, fc.etiqueta, fc.nombre_interno, fc.es_de_sistema
                FROM campana_formulario_config cfc
                JOIN formulario_campos fc ON cfc.id_campo = fc.id_campo
                WHERE cfc.id_campana = ?
            `;
            const [camposDelFormulario] = await connection.query(camposQuery, [id_campana]);

            const mapaEtiquetaAId = camposDelFormulario.reduce((mapa, campo) => {
                mapa[campo.etiqueta.trim().toLowerCase()] = campo.id_campo;
                return mapa;
            }, {});
            
            // Este mapa es para identificar qué campos deben ir a la tabla 'contactos'
            const camposDeSistema = camposDelFormulario
                .filter(c => c.es_de_sistema === 1) // Filtra solo los que son columnas en la tabla 'contactos'
                .reduce((mapa, campo) => {
                    mapa[campo.etiqueta.trim().toLowerCase()] = campo.nombre_interno;
                    return mapa;
                }, {});

            console.log('Mapa de Campos de Sistema (para tabla contactos):', camposDeSistema);
            let totalProcesados = 0;

            for (const [index, fila] of contactos.entries()) {
                console.log(`\n-------------------- Fila ${index + 2} --------------------`);
                console.log('Datos CRUDOS del Excel:', fila); // LOG AÑADIDO

                const emailKey = Object.keys(fila).find(k => k.toLowerCase().trim() === 'email');
                const email = emailKey ? fila[emailKey]?.toLowerCase().trim() : null;

                if (!email || email === '') {
                    throw new Error(`Fila ${index + 2}: La columna de email es obligatoria y está vacía.`);
                }
                
                const datosContacto = {};
                for (const cabecera in fila) {
                    const cabeceraNormalizada = cabecera.trim().toLowerCase();
                    const nombreColumna = camposDeSistema[cabeceraNormalizada];
                    if (nombreColumna && fila[cabecera] !== null && fila[cabecera] !== '') {
                        datosContacto[nombreColumna] = fila[cabecera];
                    }
                }
                datosContacto.email = email;

                console.log('-> Preparando para tabla "contactos":', datosContacto); // LOG MEJORADO

                let [contactosExistentes] = await connection.query('SELECT id_contacto FROM contactos WHERE email = ?', [email]);
                let id_contacto;

                if (contactosExistentes.length > 0) {
                    id_contacto = contactosExistentes[0].id_contacto;
                    const { email, ...datosParaActualizar } = datosContacto;
                    if (Object.keys(datosParaActualizar).length > 0) {
                        await connection.query('UPDATE contactos SET ? WHERE id_contacto = ?', [datosParaActualizar, id_contacto]);
                    }
                } else {
                    const [result] = await connection.query('INSERT INTO contactos SET ?', datosContacto);
                    id_contacto = result.insertId;
                }

                const [resultInscripcion] = await connection.query(
                    'INSERT IGNORE INTO inscripciones (id_campana, id_contacto, estado_asistencia) VALUES (?, ?, ?)',
                    [id_campana, id_contacto, 'Registrado']
                );
                
                let id_inscripcion;
                if (resultInscripcion.insertId > 0) {
                    id_inscripcion = resultInscripcion.insertId;
                } else {
                    const [inscripcionExistente] = await connection.query(
                        'SELECT id_inscripcion FROM inscripciones WHERE id_campana = ? AND id_contacto = ?',
                        [id_campana, id_contacto]
                    );
                    if (!inscripcionExistente.length) {
                         throw new Error(`Fila ${index + 2}: No se pudo crear ni encontrar la inscripción para ${email}.`);
                    }
                    id_inscripcion = inscripcionExistente[0].id_inscripcion;
                }
                
                const respuestasParaInsertar = [];
                for (const cabecera in fila) {
                    const cabeceraNormalizada = cabecera.trim().toLowerCase();
                    const id_campo = mapaEtiquetaAId[cabeceraNormalizada];
                    const valor = fila[cabecera];

                    if (id_campo && valor !== null && valor !== '') {
                        respuestasParaInsertar.push([id_inscripcion, id_campo, String(valor)]);
                    }
                }
                
                console.log('-> Preparando para tabla "inscripcion_respuestas":', respuestasParaInsertar); // LOG AÑADIDO

                if (respuestasParaInsertar.length > 0) {
                    const queryRespuestas = `
                        INSERT INTO inscripcion_respuestas (id_inscripcion, id_campo, valor) VALUES ?
                        ON DUPLICATE KEY UPDATE valor = VALUES(valor)
                    `;
                    await connection.query(queryRespuestas, [respuestasParaInsertar]);
                }
                
                totalProcesados++;
            }

            await connection.commit();
            console.log('--- Proceso de Importación Masiva Finalizado con Éxito ---');
            return { totalProcesados };

        } catch (error) {
            await connection.rollback();
            console.error("--- ERROR GRAVE: Se revirtió la transacción de importación masiva ---");
            console.error(error);
            throw error;
        } finally {
            connection.release();
        }
    }

};

module.exports = Inscripcion;