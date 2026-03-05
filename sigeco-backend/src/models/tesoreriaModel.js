const pool = require('../config/db');

exports.findEventosConCampanasTesoreria = async () => {
  const query = `
    SELECT
      e.id_evento,
      e.nombre AS evento_nombre,
      e.fecha_inicio,
      e.fecha_fin,
      c.id_campana,
      c.nombre AS campana_nombre,
      s.nombre AS subevento_nombre
    FROM eventos e
    JOIN campanas c ON e.id_evento = c.id_evento
    JOIN subeventos s ON c.id_subevento = s.id_subevento
    WHERE e.estado = 1
      AND c.estado = 'Activa'
      AND c.id_subevento IS NOT NULL
      AND COALESCE(s.obligatorio_pago, 0) = 1
    ORDER BY e.fecha_inicio DESC, c.nombre ASC
  `;

  const [rows] = await pool.query(query);

  const eventos = rows.reduce((acc, row) => {
    let evento = acc.find((e) => e.id_evento === row.id_evento);

    if (!evento) {
      evento = {
        id_evento: row.id_evento,
        nombre: row.evento_nombre,
        fecha_inicio: row.fecha_inicio,
        fecha_fin: row.fecha_fin,
        campanas: [],
      };
      acc.push(evento);
    }

    evento.campanas.push({
      id_campana: row.id_campana,
      nombre: row.campana_nombre,
      subevento_nombre: row.subevento_nombre,
    });

    return acc;
  }, []);

  return eventos;
};

exports.findAsistentesPorCampana = async (id_campana) => {
  const query = `
    SELECT
      i.id_inscripcion,
      i.estado_pago,
      i.fecha_inscripcion,
      i.nota,
      i.monto_pagado_manual,
      c.nombre,
      c.email,
      c.empresa,
      c.rut,
      te.nombre AS tipo_entrada,
      COALESCE(te.precio, 0) AS monto_total,
      COALESCE(te.precio, 0) AS monto_ref,
      COALESCE(
        mp.total_pagado_movimientos,
        i.monto_pagado_manual,
        pp.total_pagado_pasarela,
        0
      ) AS monto_pagado_actual,
      GREATEST(
        COALESCE(te.precio, 0) - COALESCE(
          mp.total_pagado_movimientos,
          i.monto_pagado_manual,
          pp.total_pagado_pasarela,
          0
        ),
        0
      ) AS saldo_pendiente,
      (
        SELECT mp2.medio_pago
        FROM inscripcion_movimientos_pago mp2
        WHERE mp2.id_inscripcion = i.id_inscripcion
        ORDER BY COALESCE(mp2.fecha_pago, mp2.fecha_creado) DESC, mp2.id_movimiento DESC
        LIMIT 1
      ) AS ultimo_medio_pago,
      COALESCE(
        (
          SELECT mp3.estado
          FROM inscripcion_movimientos_pago mp3
          WHERE mp3.id_inscripcion = i.id_inscripcion
          ORDER BY COALESCE(mp3.fecha_pago, mp3.fecha_creado) DESC, mp3.id_movimiento DESC
          LIMIT 1
        ),
        (
          SELECT CASE
            WHEN p2.estado = 'Fallido' THEN 'Rechazado'
            ELSE p2.estado
          END
          FROM pagos p2
          WHERE p2.id_inscripcion = i.id_inscripcion
          ORDER BY p2.fecha_actualizado DESC, p2.id_pago DESC
          LIMIT 1
        )
      ) AS estado_transaccion
    FROM inscripciones i
    JOIN contactos c
      ON c.id_contacto = i.id_contacto
    LEFT JOIN tipos_de_entrada te
      ON te.id_tipo_entrada = i.id_tipo_entrada
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
    WHERE i.id_campana = ?
    ORDER BY
      CASE i.estado_pago
        WHEN 'Pendiente' THEN 0
        WHEN 'Pagado' THEN 1
        WHEN 'Rechazado' THEN 2
        WHEN 'Reembolsado' THEN 3
        ELSE 4
      END,
      i.fecha_inscripcion DESC,
      c.nombre ASC
  `;

  const [rows] = await pool.query(query, [id_campana]);
  return rows;
};

exports.updatePagoTesoreria = async (id_inscripcion, estado_pago, monto_pagado) => {
  const [result] = await pool.query(
    `UPDATE inscripciones
     SET estado_pago = ?, monto_pagado_manual = ?
     WHERE id_inscripcion = ?`,
    [estado_pago, monto_pagado, id_inscripcion]
  );

  return result;
};