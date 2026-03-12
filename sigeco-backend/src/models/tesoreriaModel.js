const pool = require('../config/db');

exports.findEventosConCampanasTesoreria = async () => {
  const query = `
    SELECT
      e.id_evento, e.nombre AS evento_nombre, e.fecha_inicio, e.fecha_fin,
      c.id_campana, c.nombre AS campana_nombre, s.nombre AS subevento_nombre
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
      evento = { id_evento: row.id_evento, nombre: row.evento_nombre, fecha_inicio: row.fecha_inicio, fecha_fin: row.fecha_fin, campanas: [] };
      acc.push(evento);
    }
    evento.campanas.push({ id_campana: row.id_campana, nombre: row.campana_nombre, subevento_nombre: row.subevento_nombre });
    return acc;
  }, []);

  return eventos;
};

exports.findAsistentesPorCampana = async (id_campana) => {
  const query = `
    SELECT
      base.id_inscripcion, base.id_tipo_entrada,
      CASE
        WHEN base.monto_total <= 0 AND base.monto_pagado_actual <= 0 THEN 'No Aplica'
        WHEN base.monto_pagado_actual >= base.monto_total THEN 'Pagado'
        WHEN COALESCE(base.estado_transaccion, '') = 'Reembolsado' AND base.monto_pagado_actual <= 0 THEN 'Reembolsado'
        WHEN COALESCE(base.estado_transaccion, '') IN ('Rechazado', 'Anulado') AND base.monto_pagado_actual <= 0 THEN 'Rechazado'
        ELSE 'Pendiente'
      END AS estado_pago,
      base.fecha_inscripcion, base.nota, base.monto_pagado_manual, base.monto_objetivo_manual,
      base.nombre, base.email, base.empresa, base.rut, base.tipo_entrada,
      base.monto_total, base.monto_ref, base.monto_pagado_actual,
      GREATEST(base.monto_total - base.monto_pagado_actual, 0) AS saldo_pendiente,
      base.ultimo_medio_pago, base.estado_transaccion
    FROM (
      SELECT
        i.id_inscripcion, i.id_tipo_entrada, i.fecha_inscripcion, i.nota, i.monto_pagado_manual, i.monto_objetivo_manual,
        c.nombre, c.email, c.empresa, c.rut, te.nombre AS tipo_entrada,
        
        -- MODIFICACIÓN: Siempre prioriza el monto manual si está definido, si no, usa el del ticket.
        COALESCE(i.monto_objetivo_manual, te.precio, 0) AS monto_total,
        COALESCE(i.monto_objetivo_manual, te.precio, 0) AS monto_ref,

        COALESCE(mp.total_pagado_movimientos, i.monto_pagado_manual, pp.total_pagado_pasarela, 0) AS monto_pagado_actual,
        COALESCE(mp.ultimo_medio_pago, 'Flow') AS ultimo_medio_pago,
        COALESCE(mp.ultimo_estado_movimiento, pp.ultimo_estado_pasarela) AS estado_transaccion
      FROM inscripciones i
      JOIN contactos c ON c.id_contacto = i.id_contacto
      LEFT JOIN tipos_de_entrada te ON te.id_tipo_entrada = i.id_tipo_entrada
      LEFT JOIN (
        SELECT
          id_inscripcion,
          SUM(CASE WHEN estado = 'Pagado' THEN monto ELSE 0 END) AS total_pagado_movimientos,
          SUBSTRING_INDEX(GROUP_CONCAT(medio_pago ORDER BY COALESCE(fecha_pago, fecha_creado) DESC, id_movimiento DESC SEPARATOR ','), ',', 1) AS ultimo_medio_pago,
          SUBSTRING_INDEX(GROUP_CONCAT(estado ORDER BY COALESCE(fecha_pago, fecha_creado) DESC, id_movimiento DESC SEPARATOR ','), ',', 1) AS ultimo_estado_movimiento
        FROM inscripcion_movimientos_pago
        GROUP BY id_inscripcion
      ) mp ON mp.id_inscripcion = i.id_inscripcion
      LEFT JOIN (
        SELECT
          id_inscripcion,
          SUM(CASE WHEN estado = 'Pagado' THEN monto ELSE 0 END) AS total_pagado_pasarela,
          SUBSTRING_INDEX(GROUP_CONCAT(CASE WHEN estado = 'Fallido' THEN 'Rechazado' ELSE estado END ORDER BY fecha_actualizado DESC, id_pago DESC SEPARATOR ','), ',', 1) AS ultimo_estado_pasarela
        FROM pagos
        GROUP BY id_inscripcion
      ) pp ON pp.id_inscripcion = i.id_inscripcion
      WHERE i.id_campana = ?
    ) base
    ORDER BY
      CASE
        WHEN base.monto_total <= 0 AND base.monto_pagado_actual <= 0 THEN 4
        WHEN base.monto_pagado_actual >= base.monto_total THEN 1
        WHEN COALESCE(base.estado_transaccion, '') IN ('Rechazado', 'Anulado') AND base.monto_pagado_actual <= 0 THEN 2
        WHEN COALESCE(base.estado_transaccion, '') = 'Reembolsado' AND base.monto_pagado_actual <= 0 THEN 3
        ELSE 0
      END,
      base.fecha_inscripcion DESC, base.nombre ASC
  `;

  const [rows] = await pool.query(query, [id_campana]);
  return rows;
};

exports.updatePagoTesoreria = async (id_inscripcion, _estado_pago, monto_pagado) => {
  const [result] = await pool.query(
    `UPDATE inscripciones SET monto_pagado_manual = ? WHERE id_inscripcion = ?`,
    [monto_pagado, id_inscripcion]
  );
  return result;
};