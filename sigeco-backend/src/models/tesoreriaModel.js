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
      COALESCE(MAX(p.monto), te.precio, 0) AS monto_ref,
      COALESCE(
        i.monto_pagado_manual,
        SUM(CASE WHEN p.estado = 'Pagado' THEN p.monto ELSE 0 END),
        0
      ) AS monto_pagado_actual,
      MAX(p.estado) AS estado_transaccion
    FROM inscripciones i
    JOIN contactos c ON c.id_contacto = i.id_contacto
    LEFT JOIN tipos_de_entrada te ON te.id_tipo_entrada = i.id_tipo_entrada
    LEFT JOIN pagos p ON p.id_inscripcion = i.id_inscripcion
    WHERE i.id_campana = ?
    GROUP BY
      i.id_inscripcion,
      i.estado_pago,
      i.fecha_inscripcion,
      i.nota,
      i.monto_pagado_manual,
      c.nombre,
      c.email,
      c.empresa,
      c.rut,
      te.nombre,
      te.precio
    ORDER BY
      CASE i.estado_pago
        WHEN 'Pendiente' THEN 0
        WHEN 'Rechazado' THEN 1
        WHEN 'Pagado' THEN 2
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