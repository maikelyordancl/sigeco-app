const pool = require('../config/db');

const Inscripcion = {
    create: async (inscripcionData) => {
    const {
        id_campana,
        id_contacto,
        id_tipo_entrada = null,
        estado_asistencia,
        estado_pago
    } = inscripcionData;

    const query = `
        INSERT INTO inscripciones (
            id_campana,
            id_contacto,
            id_tipo_entrada,
            estado_asistencia,
            estado_pago
        )
        VALUES (?, ?, ?, ?, ?)
    `;

    const [result] = await pool.query(query, [
        id_campana,
        id_contacto,
        id_tipo_entrada,
        estado_asistencia,
        estado_pago
    ]);

    return {
        id_inscripcion: result.insertId,
        ...inscripcionData
    };
},

    findByCampanaAndContacto: async (id_campana, id_contacto) => {
        const query = 'SELECT * FROM inscripciones WHERE id_campana = ? AND id_contacto = ?';
        const [rows] = await pool.query(query, [id_campana, id_contacto]);
        return rows[0] || null;
    },

    findById: async (id_inscripcion) => {
        const query = 'SELECT * FROM inscripciones WHERE id_inscripcion = ? LIMIT 1';
        const [rows] = await pool.query(query, [id_inscripcion]);
        return rows[0] || null;
    },

    update: async (id_inscripcion, dataToUpdate) => {
        const query = 'UPDATE inscripciones SET ? WHERE id_inscripcion = ?';
        const [result] = await pool.query(query, [dataToUpdate, id_inscripcion]);
        return result;
    },

    convocarDesdeBase: async (id_campana, idsBasesOrigen, id_tipo_entrada = null) => {
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            const [campanaRules] = await connection.query(`
                SELECT 
                    COALESCE(s.obligatorio_registro, 0) AS obligatorio_registro,
                    COALESCE(s.obligatorio_pago, 0) AS obligatorio_pago
                FROM campanas c
                JOIN subeventos s ON c.id_subevento = s.id_subevento
                WHERE c.id_campana = ?
            `, [id_campana]);

            if (campanaRules.length === 0) {
                throw new Error('Campaña no encontrada o no está asociada a un sub-evento.');
            }

            const { obligatorio_registro, obligatorio_pago } = campanaRules[0];
            const requierePago = Number(obligatorio_pago) === 1;
            const estadoAsistencia = 'Invitado';
            const estadoPago = requierePago ? 'Pendiente' : 'No Aplica';
            const ticketId = id_tipo_entrada ? Number(id_tipo_entrada) : null;

            if (requierePago && (!Number.isInteger(ticketId) || ticketId <= 0)) {
                throw new Error('Debes seleccionar un tipo de entrada para convocar en una campaña de pago.');
            }

            if (requierePago) {
                const [ticketRows] = await connection.query(
                    `SELECT id_tipo_entrada
                     FROM tipos_de_entrada
                     WHERE id_tipo_entrada = ? AND id_campana = ?
                     LIMIT 1`,
                    [ticketId, id_campana]
                );

                if (ticketRows.length === 0) {
                    throw new Error('El tipo de entrada seleccionado no pertenece a esta campaña.');
                }
            }

            const placeholder = idsBasesOrigen.map(() => '?').join(',');
            const [contactos] = await connection.query(
                `SELECT DISTINCT id_contacto FROM contactos_por_base WHERE id_base IN (${placeholder})`,
                idsBasesOrigen
            );

            if (contactos.length === 0) {
                await connection.commit();
                return { success: true, message: 'No se encontraron nuevos contactos para convocar.', count: 0 };
            }

            const values = contactos.map(c => [
                id_campana,
                c.id_contacto,
                requierePago ? ticketId : null,
                estadoAsistencia,
                estadoPago
            ]);
            const query = `
                INSERT IGNORE INTO inscripciones (
                    id_campana,
                    id_contacto,
                    id_tipo_entrada,
                    estado_asistencia,
                    estado_pago
                )
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
            throw error;
        } finally {
            connection.release();
        }
    },

    findWithCustomFieldsByCampanaId: async (id_campana, limit = 100, offset = 0, searchTerm = null, estadoFiltro = null) => {
    const [campanaRulesRows] = await pool.execute(`
        SELECT
            COALESCE(s.obligatorio_registro, 0) AS obligatorio_registro,
            COALESCE(s.obligatorio_pago, 0) AS obligatorio_pago
        FROM campanas c
        LEFT JOIN subeventos s ON c.id_subevento = s.id_subevento
        WHERE c.id_campana = ?
        LIMIT 1
    `, [id_campana]);

    if (campanaRulesRows.length === 0) {
        throw new Error('Campaña no encontrada.');
    }

    const obligatorioRegistro = Number(campanaRulesRows[0].obligatorio_registro) === 1;
    const obligatorioPago = Number(campanaRulesRows[0].obligatorio_pago) === 1;

    const estadosPermitidos = (obligatorioRegistro || obligatorioPago)
    ? ['Invitado', 'Registrado', 'Confirmado', 'Asistió', 'Cancelado']
    : ['Invitado', 'Registrado', 'Confirmado', 'Asistió', 'Cancelado'];

    const whereConditions = ['i.id_campana = ?'];
    const params = [id_campana];

    whereConditions.push(`i.estado_asistencia IN (${estadosPermitidos.map(() => '?').join(', ')})`);
    params.push(...estadosPermitidos);

    if (estadoFiltro) {
        whereConditions.push('i.estado_asistencia = ?');
        params.push(estadoFiltro);
    }

    if (searchTerm) {
        const searchWords = searchTerm.split(' ').filter(Boolean);
        if (searchWords.length > 0) {
            const searchClauses = searchWords.map(word => {
                const isOnlyDigits = /^[0-9]+$/.test(word);

                const clauses = [
                    'c.nombre LIKE ?',
                    'c.email LIKE ?',
                    'c.empresa LIKE ?',
                    'c.rut LIKE ?'
                ];

                params.push(`%${word}%`, `%${word}%`, `%${word}%`, `%${word}%`);

                if (isOnlyDigits) {
                    clauses.push('i.id_inscripcion = ?');
                    params.push(word);
                }

                return `(${clauses.join(' OR ')})`;
            });

            whereConditions.push(`(${searchClauses.join(' AND ')})`);
        }
    }

    const whereClause = whereConditions.length > 1
        ? `WHERE ${whereConditions.join(' AND ')}`
        : `WHERE ${whereConditions[0]}`;

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
        FROM inscripciones i
        JOIN contactos c ON i.id_contacto = c.id_contacto
        ${whereClause} 
    `;

    const [countRows] = await pool.execute(countQuery, params);
    const counts = countRows[0];
    const totalInscripciones = counts.total || 0;

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

    const dataQuery = `
    SELECT 
        ROW_NUMBER() OVER (ORDER BY i.fecha_inscripcion ASC) as '#',
        i.id_inscripcion,
        i.estado_asistencia,
        i.fecha_acreditacion,
        CASE
          WHEN te.id_tipo_entrada IS NULL OR COALESCE(te.precio, 0) <= 0 THEN 'No Aplica'
          WHEN COALESCE(mp.total_pagado_movimientos, i.monto_pagado_manual, pp.total_pagado_pasarela, 0) >= COALESCE(te.precio, 0) THEN 'Pagado'
          WHEN COALESCE(mp.ultimo_estado_movimiento, pp.ultimo_estado_pasarela, '') = 'Reembolsado'
            AND COALESCE(mp.total_pagado_movimientos, i.monto_pagado_manual, pp.total_pagado_pasarela, 0) <= 0 THEN 'Reembolsado'
          WHEN COALESCE(mp.ultimo_estado_movimiento, pp.ultimo_estado_pasarela, '') IN ('Rechazado', 'Anulado')
            AND COALESCE(mp.total_pagado_movimientos, i.monto_pagado_manual, pp.total_pagado_pasarela, 0) <= 0 THEN 'Rechazado'
          ELSE 'Pendiente'
        END AS estado_pago,
        i.nota,
        i.monto_pagado_manual,
        c.id_contacto,
        c.nombre,
        c.email,
        c.telefono,
        c.rut,
        c.empresa,
        c.actividad,
        c.profesion,
        c.pais,
        c.comuna,
        c.fecha_creado AS fecha_creacion_contacto,
        MAX(p.id_pago) AS id_pago,
        MAX(CASE WHEN p.estado = 'Pagado' THEN p.monto ELSE NULL END) AS monto,
        COALESCE(mp.ultimo_estado_movimiento, pp.ultimo_estado_pasarela) AS estado_transaccion,
        te.nombre AS tipo_entrada,
        COALESCE(
          mp.total_pagado_movimientos,
          i.monto_pagado_manual,
          pp.total_pagado_pasarela,
          0
        ) AS monto_pagado_actual

        ${customFieldsSelect ? `, ${customFieldsSelect}` : ''}
    FROM inscripciones i
    JOIN contactos c ON i.id_contacto = c.id_contacto
    LEFT JOIN inscripcion_respuestas ir ON i.id_inscripcion = ir.id_inscripcion
    LEFT JOIN pagos p ON i.id_inscripcion = p.id_inscripcion
    LEFT JOIN (
      SELECT
        id_inscripcion,
        SUM(CASE WHEN estado = 'Pagado' THEN monto ELSE 0 END) AS total_pagado_movimientos,
        SUBSTRING_INDEX(
          GROUP_CONCAT(
            estado
            ORDER BY COALESCE(fecha_pago, fecha_creado) DESC, id_movimiento DESC
            SEPARATOR ','
          ),
          ',',
          1
        ) AS ultimo_estado_movimiento
      FROM inscripcion_movimientos_pago
      GROUP BY id_inscripcion
    ) mp ON mp.id_inscripcion = i.id_inscripcion
    LEFT JOIN (
      SELECT
        id_inscripcion,
        SUM(CASE WHEN estado = 'Pagado' THEN monto ELSE 0 END) AS total_pagado_pasarela,
        SUBSTRING_INDEX(
          GROUP_CONCAT(
            CASE WHEN estado = 'Fallido' THEN 'Rechazado' ELSE estado END
            ORDER BY fecha_actualizado DESC, id_pago DESC
            SEPARATOR ','
          ),
          ',',
          1
        ) AS ultimo_estado_pasarela
      FROM pagos
      GROUP BY id_inscripcion
    ) pp ON pp.id_inscripcion = i.id_inscripcion
    LEFT JOIN tipos_de_entrada te ON i.id_tipo_entrada = te.id_tipo_entrada
    ${whereClause}
    GROUP BY
        i.id_inscripcion,
        i.estado_asistencia,
        i.fecha_acreditacion,
        i.nota,
        i.monto_pagado_manual,
        c.id_contacto,
        c.nombre,
        c.email,
        c.telefono,
        c.rut,
        c.empresa,
        c.actividad,
        c.profesion,
        c.pais,
        c.comuna,
        c.fecha_creado,
        te.id_tipo_entrada,
        te.nombre,
        te.precio,
        mp.total_pagado_movimientos,
        mp.ultimo_estado_movimiento,
        pp.total_pagado_pasarela,
        pp.ultimo_estado_pasarela
    ORDER BY i.fecha_inscripcion ASC
    LIMIT ? OFFSET ?
`;

    const finalParams = [...params, limit, offset];
    const [rows] = await pool.execute(dataQuery, finalParams);

    return {
        asistentes: rows,
        totalInscripciones,
        totalPages: Math.ceil(totalInscripciones / limit),
        statusCounts
    };
},

    updateStatus: async (id_inscripcion, estado_asistencia) => {
        const [result] = await pool.execute(
            'UPDATE inscripciones SET estado_asistencia = ? WHERE id_inscripcion = ?',
            [estado_asistencia, id_inscripcion]
        );
        return result.affectedRows > 0;
    },

    updateNota: async (id_inscripcion, nota) => {
        const [result] = await pool.execute(
            'UPDATE inscripciones SET nota = ? WHERE id_inscripcion = ?',
            [nota, id_inscripcion]
        );
        return result.affectedRows > 0;
    },
    
    updateOrInsertRespuestas: async (id_inscripcion, asistenteData) => {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            const { custom_fields, ...contactInfo } = asistenteData;

            if (Object.keys(contactInfo).length > 0) {
                const { id_contacto } = (await connection.query('SELECT id_contacto FROM inscripciones WHERE id_inscripcion = ?', [id_inscripcion]))[0][0];
                await connection.query('UPDATE contactos SET ? WHERE id_contacto = ?', [contactInfo, id_contacto]);
            }

            if (custom_fields) {
                for (const field of custom_fields) {
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

            await connection.query(
                'UPDATE inscripciones SET estado_asistencia = ?, nota = ? WHERE id_inscripcion = ?',
                [estado_asistencia, nota, id_inscripcion]
            );

            if (Object.keys(datosContacto).length > 0) {
                const { id_contacto } = (await connection.query('SELECT id_contacto FROM inscripciones WHERE id_inscripcion = ?', [id_inscripcion]))[0][0];
                await connection.query('UPDATE contactos SET ? WHERE id_contacto = ?', [datosContacto, id_contacto]);
            }

            if (respuestas && respuestas.length > 0) {
                for (const resp of respuestas) {
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
            const camposQuery = `
                SELECT fc.id_campo, fc.etiqueta, fc.nombre_interno, fc.es_de_sistema
                FROM campana_formulario_config cfc
                JOIN formulario_campos fc ON cfc.id_campo = fc.id_campo
                WHERE cfc.id_campana = ?
            `;
            const [camposDelFormulario] = await connection.query(camposQuery, [id_campana]);

            const normalizeString = (str) => {
                if (!str) return '';
                return String(str)
                    .toLowerCase()
                    .replace(/ã¡/g, 'a').replace(/ã©/g, 'e').replace(/ã³/g, 'o').replace(/ãº/g, 'u').replace(/ã±/g, 'n').replace(/ã\xad/g, 'i')
                    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
                    .replace(/[^a-z0-9\s]/g, "") 
                    .trim();
            };

            const normalizeHeader = (str) => normalizeString(str).replace(/\s+/g, "");

            const mapaEtiquetaAId = camposDelFormulario.reduce((mapa, campo) => {
                mapa[normalizeHeader(campo.etiqueta)] = campo.id_campo;
                return mapa;
            }, {});
            
            const camposDeSistema = camposDelFormulario
                .filter(c => c.es_de_sistema === 1)
                .reduce((mapa, campo) => {
                    mapa[normalizeHeader(campo.etiqueta)] = campo.nombre_interno;
                    return mapa;
                }, {});

            const [opcionesCampos] = await connection.query(`
                SELECT id_campo, etiqueta_opcion
                FROM campo_opciones
                WHERE id_campo IN (SELECT id_campo FROM campana_formulario_config WHERE id_campana = ?)
            `, [id_campana]);

            const mapaOpcionesDB = {};
            opcionesCampos.forEach(opc => {
                if (!mapaOpcionesDB[opc.id_campo]) mapaOpcionesDB[opc.id_campo] = {};
                mapaOpcionesDB[opc.id_campo][normalizeString(opc.etiqueta_opcion)] = opc.etiqueta_opcion; 
            });

            const etiquetasValidas = new Set(Object.keys(mapaEtiquetaAId));
            
            // --- CONSTANTES DE INTEGRACIÓN TESORERÍA ---
            const MONTO_HEADER = normalizeHeader('Monto Pagado (Opcional)');
            const MEDIO_PAGO_HEADER = normalizeHeader('Medio de Pago (Opcional)');
            
            // Retrocompatibilidad con nombres antiguos
            etiquetasValidas.add(MONTO_HEADER);
            etiquetasValidas.add(MEDIO_PAGO_HEADER);
            etiquetasValidas.add(normalizeHeader('Monto Pagado Manual (Opcional)'));
            etiquetasValidas.add(normalizeHeader('Monto Pagado Manual'));

            const cabecerasRecibidas = new Set();
            contactos.forEach((fila) => {
                Object.keys(fila || {}).forEach((cabecera) => {
                    const cabeceraNormalizada = normalizeHeader(cabecera);
                    if (cabeceraNormalizada) cabecerasRecibidas.add(cabeceraNormalizada);
                });
            });

            const cabecerasDesconocidas = Array.from(cabecerasRecibidas).filter(
                (cabecera) => !etiquetasValidas.has(cabecera)
            );

            if (cabecerasDesconocidas.length > 0) {
                 const reales = Array.from(cabecerasDesconocidas).map(norm => {
                     let original = norm;
                     Object.keys(contactos[0] || {}).forEach(k => {
                         if(normalizeHeader(k) === norm) original = k;
                     });
                     return original;
                 });
                throw new Error(`La plantilla no coincide con la campaña. Columnas no reconocidas: ${reales.join(', ')}`);
            }

            let totalProcesados = 0;

            for (const [index, fila] of contactos.entries()) {
                const emailKey = Object.keys(fila).find(k => normalizeHeader(k) === normalizeHeader('email'));
                const email = emailKey ? fila[emailKey]?.toLowerCase().trim() : null;

                if (!email || email === '') continue; 
                
                const datosContacto = {};
                let montoPagadoManual = null;
                let medioPagoManual = 'Transferencia'; // Por defecto si se sube monto sin especificar medio

                for (const cabecera in fila) {
                    const cabeceraNormalizada = normalizeHeader(cabecera);
                    
                    // Capturamos el Monto
                    if (cabeceraNormalizada === MONTO_HEADER || cabeceraNormalizada.includes('montopagadomanual')) {
                         const rawMonto = String(fila[cabecera]).replace(/[^0-9]/g, '');
                         if (rawMonto) montoPagadoManual = parseInt(rawMonto, 10);
                         continue;
                    }

                    // Capturamos el Medio de Pago (Débito, Crédito, etc.)
                    if (cabeceraNormalizada === MEDIO_PAGO_HEADER) {
                         if (fila[cabecera]) medioPagoManual = String(fila[cabecera]).trim();
                         continue;
                    }

                    const nombreColumna = camposDeSistema[cabeceraNormalizada];
                    if (nombreColumna && fila[cabecera] !== null && fila[cabecera] !== '') {
                        datosContacto[nombreColumna] = fila[cabecera];
                    }
                }
                datosContacto.email = email;

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

                let queryInsc = 'INSERT IGNORE INTO inscripciones (id_campana, id_contacto, estado_asistencia) VALUES (?, ?, ?)';
                let valuesInsc = [id_campana, id_contacto, 'Invitado'];
                
                const [resultInscripcion] = await connection.query(queryInsc, valuesInsc);
                
                let id_inscripcion;
                if (resultInscripcion.insertId > 0) {
                    id_inscripcion = resultInscripcion.insertId;
                } else {
                    const [inscripcionExistente] = await connection.query(
                        'SELECT id_inscripcion FROM inscripciones WHERE id_campana = ? AND id_contacto = ?',
                        [id_campana, id_contacto]
                    );
                    if (!inscripcionExistente.length) {
                         throw new Error(`Fila ${index + 2}: Error en la inscripción para ${email}.`);
                    }
                    id_inscripcion = inscripcionExistente[0].id_inscripcion;
                }
                
                // --- INTEGRACIÓN CON TESORERÍA (MOVIMIENTO DE PAGO REAL) ---
                if (montoPagadoManual !== null) {
                    // Verificamos si ya tenía un movimiento de pago manual previo para no duplicarlo si re-subes el excel
                    const [existingMov] = await connection.query(
                        "SELECT id_movimiento FROM inscripcion_movimientos_pago WHERE id_inscripcion = ? LIMIT 1",
                        [id_inscripcion]
                    );

                    if (existingMov.length > 0) {
                        await connection.query(
                            "UPDATE inscripcion_movimientos_pago SET monto = ?, medio_pago = ?, estado = 'Pagado' WHERE id_movimiento = ?",
                            [montoPagadoManual, medioPagoManual, existingMov[0].id_movimiento]
                        );
                    } else {
                        // Insertamos un movimiento limpio para la Tesorería
                        await connection.query(
                            "INSERT INTO inscripcion_movimientos_pago (id_inscripcion, monto, medio_pago, estado) VALUES (?, ?, ?, 'Pagado')",
                            [id_inscripcion, montoPagadoManual, medioPagoManual]
                        );
                    }

                    // Por compatibilidad con código antiguo, se guarda el backup en la misma tabla
                    await connection.query(
                        "UPDATE inscripciones SET monto_pagado_manual = ? WHERE id_inscripcion = ?", 
                        [montoPagadoManual, id_inscripcion]
                    );
                }
                
                const respuestasParaInsertar = [];
                for (const cabecera in fila) {
                    const cabeceraNormalizada = normalizeHeader(cabecera);
                    const id_campo = mapaEtiquetaAId[cabeceraNormalizada];
                    let valor = fila[cabecera];

                    if (id_campo && valor !== null && valor !== '') {
                        if (mapaOpcionesDB[id_campo]) {
                            const valorNormalizado = normalizeString(valor);
                            if (mapaOpcionesDB[id_campo][valorNormalizado]) {
                                valor = mapaOpcionesDB[id_campo][valorNormalizado];
                            }
                        }
                        respuestasParaInsertar.push([id_inscripcion, id_campo, String(valor)]);
                    }
                }
                
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
            throw error;
        } finally {
            connection.release();
        }
    }

};

module.exports = Inscripcion;