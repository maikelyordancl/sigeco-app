const pool = require('../config/db');

const ESTADO_MAP = {
  Pendiente: 'Pendiente',
  Pagado: 'Pagado',
  Fallido: 'Rechazado',
  Rechazado: 'Rechazado',
  Anulado: 'Anulado',
  Reembolsado: 'Reembolsado',
};

function mapEstadoMovimiento(estado) {
  return ESTADO_MAP[estado] || 'Pendiente';
}

function normalizeNumber(value) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

async function findByPagoId(id_pago) {
  const [rows] = await pool.execute(
    `SELECT *
     FROM inscripcion_movimientos_pago
     WHERE id_pago = ?
     LIMIT 1`,
    [id_pago]
  );

  return rows[0] || null;
}

async function createMovimiento(data) {
  const {
    id_inscripcion,
    id_pago = null,
    monto,
    medio_pago,
    tipo_registro = 'Manual',
    estado = 'Pagado',
    observacion = null,
    creado_por = null,
    fecha_pago = null,
  } = data;

  const [result] = await pool.execute(
    `INSERT INTO inscripcion_movimientos_pago (
      id_inscripcion,
      id_pago,
      monto,
      medio_pago,
      tipo_registro,
      estado,
      observacion,
      creado_por,
      fecha_pago
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id_inscripcion,
      id_pago,
      monto,
      medio_pago,
      tipo_registro,
      estado,
      observacion,
      creado_por,
      fecha_pago,
    ]
  );

  return {
    id_movimiento: result.insertId,
    ...data,
  };
}

async function upsertMovimientoFlowDesdePago(data) {
  const {
    id_pago,
    id_inscripcion,
    monto,
    estado = 'Pendiente',
    observacion = null,
  } = data;

  if (!id_pago) {
    throw new Error('id_pago es obligatorio para registrar un movimiento Flow.');
  }

  const existente = await findByPagoId(id_pago);

  if (existente) {
    await pool.execute(
      `UPDATE inscripcion_movimientos_pago
       SET monto = ?,
           estado = ?,
           observacion = COALESCE(?, observacion),
           fecha_pago = CASE WHEN ? = 'Pagado' THEN NOW() ELSE fecha_pago END
       WHERE id_pago = ?`,
      [
        monto,
        mapEstadoMovimiento(estado),
        observacion,
        mapEstadoMovimiento(estado),
        id_pago,
      ]
    );

    return {
      ...existente,
      monto,
      estado: mapEstadoMovimiento(estado),
    };
  }

  return createMovimiento({
    id_inscripcion,
    id_pago,
    monto,
    medio_pago: 'Flow',
    tipo_registro: 'Flow',
    estado: mapEstadoMovimiento(estado),
    observacion,
    fecha_pago: mapEstadoMovimiento(estado) === 'Pagado' ? new Date() : null,
  });
}

async function getCobroResumen(id_inscripcion) {
  const [rows] = await pool.execute(
    `SELECT
      i.id_inscripcion,
      i.estado_asistencia,
      i.estado_pago AS estado_pago_actual,
      COALESCE(te.precio, 0) AS monto_objetivo,
      COALESCE(
        SUM(CASE WHEN mp.estado = 'Pagado' THEN mp.monto ELSE 0 END),
        0
      ) AS total_pagado
    FROM inscripciones i
    LEFT JOIN tipos_de_entrada te
      ON te.id_tipo_entrada = i.id_tipo_entrada
    LEFT JOIN inscripcion_movimientos_pago mp
      ON mp.id_inscripcion = i.id_inscripcion
    WHERE i.id_inscripcion = ?
    GROUP BY
      i.id_inscripcion,
      i.estado_asistencia,
      i.estado_pago,
      te.precio`,
    [id_inscripcion]
  );

  if (!rows.length) {
    return null;
  }

  const row = rows[0];
  const montoObjetivo = normalizeNumber(row.monto_objetivo);
  const totalPagado = normalizeNumber(row.total_pagado);
  const saldoPendiente = Math.max(montoObjetivo - totalPagado, 0);

  return {
    id_inscripcion: row.id_inscripcion,
    estadoAsistencia: row.estado_asistencia,
    estadoPagoActual: row.estado_pago_actual,
    montoObjetivo,
    totalPagado,
    saldoPendiente,
  };
}

async function recalculateInscripcionPayment(id_inscripcion) {
  const resumen = await getCobroResumen(id_inscripcion);

  if (!resumen) {
    return null;
  }

  let nuevoEstadoPago = 'Pendiente';

  if (
    resumen.estadoPagoActual === 'No Aplica' &&
    resumen.montoObjetivo <= 0 &&
    resumen.totalPagado <= 0
  ) {
    nuevoEstadoPago = 'No Aplica';
  } else if (
    resumen.montoObjetivo > 0 &&
    resumen.totalPagado >= resumen.montoObjetivo
  ) {
    nuevoEstadoPago = 'Pagado';
  }

  let nuevoEstadoAsistencia = resumen.estadoAsistencia;

  if (
    nuevoEstadoPago === 'Pagado' &&
    ['Registrado', 'Por Confirmar'].includes(resumen.estadoAsistencia)
  ) {
    nuevoEstadoAsistencia = 'Confirmado';
  } else if (
    nuevoEstadoPago === 'Pendiente' &&
    resumen.estadoAsistencia === 'Confirmado'
  ) {
    nuevoEstadoAsistencia = 'Registrado';
  }

  await pool.execute(
    `UPDATE inscripciones
     SET estado_pago = ?,
         monto_pagado_manual = ?,
         estado_asistencia = ?
     WHERE id_inscripcion = ?`,
    [
      nuevoEstadoPago,
      resumen.totalPagado,
      nuevoEstadoAsistencia,
      id_inscripcion,
    ]
  );

  return {
    id_inscripcion,
    totalPagado: resumen.totalPagado,
    montoObjetivo: resumen.montoObjetivo,
    saldoPendiente: Math.max(resumen.montoObjetivo - resumen.totalPagado, 0),
    estadoPago: nuevoEstadoPago,
    estadoAsistencia: nuevoEstadoAsistencia,
  };
}

async function syncEstadoFromPago(id_pago, estadoPagoTabla) {
  const movimiento = await findByPagoId(id_pago);

  if (!movimiento) {
    return { synced: false };
  }

  const estadoMovimiento = mapEstadoMovimiento(estadoPagoTabla);

  await pool.execute(
    `UPDATE inscripcion_movimientos_pago
     SET estado = ?,
         fecha_pago = CASE
           WHEN ? = 'Pagado' THEN NOW()
           ELSE fecha_pago
         END
     WHERE id_pago = ?`,
    [estadoMovimiento, estadoMovimiento, id_pago]
  );

  const recalculo = await recalculateInscripcionPayment(movimiento.id_inscripcion);

  return {
    synced: true,
    estadoMovimiento,
    ...recalculo,
  };
}

async function registrarAbonoManual(data) {
  const {
    id_inscripcion,
    monto,
    medio_pago,
    observacion = null,
    creado_por = null,
  } = data;

  await createMovimiento({
    id_inscripcion,
    monto,
    medio_pago,
    tipo_registro: 'Manual',
    estado: 'Pagado',
    observacion,
    creado_por,
    fecha_pago: new Date(),
  });

  return recalculateInscripcionPayment(id_inscripcion);
}

async function getHistorialByInscripcion(id_inscripcion) {
  const [rows] = await pool.execute(
    `SELECT
      mp.id_movimiento,
      mp.id_inscripcion,
      mp.id_pago,
      mp.monto,
      mp.medio_pago,
      mp.tipo_registro,
      mp.estado,
      mp.observacion,
      mp.fecha_pago,
      mp.fecha_creado,
      mp.fecha_actualizado,
      p.orden_compra
    FROM inscripcion_movimientos_pago mp
    LEFT JOIN pagos p
      ON p.id_pago = mp.id_pago
    WHERE mp.id_inscripcion = ?
    ORDER BY
      COALESCE(mp.fecha_pago, mp.fecha_creado) DESC,
      mp.id_movimiento DESC`,
    [id_inscripcion]
  );

  return rows;
}

module.exports = {
  findByPagoId,
  createMovimiento,
  upsertMovimientoFlowDesdePago,
  getCobroResumen,
  recalculateInscripcionPayment,
  syncEstadoFromPago,
  registrarAbonoManual,
  getHistorialByInscripcion,
};