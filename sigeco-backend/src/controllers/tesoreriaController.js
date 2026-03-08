const { validationResult } = require('express-validator');
const pool = require('../config/db');
const permissionModel = require('../models/permissionModel');
const TesoreriaModel = require('../models/tesoreriaModel');
const PagoModel = require('../models/pagoModel');
const FlowService = require('../services/flowService');
const InscripcionPagoModel = require('../models/inscripcionPagoModel');

const ESTADOS_PAGO_VALIDOS = [
  'No Aplica',
  'Pendiente',
  'Pagado',
  'Rechazado',
  'Reembolsado',
];

const MEDIOS_PAGO_MANUALES_VALIDOS = [
  'Efectivo',
  'Transferencia',
  'Cortesia',
  'Otro',
];

function getUserId(req) {
  const cand =
    (req.user && (req.user.id || req.user.userId || req.user.id_usuario || req.user.idUsuario)) ||
    req.userId ||
    req.uid ||
    (req.usuario && (req.usuario.id || req.usuario.id_usuario || req.usuario.idUsuario));

  const n = parseInt(cand, 10);
  return Number.isFinite(n) ? n : null;
}

async function getEventIdByCampana(id_campana) {
  const [rows] = await pool.query(
    `SELECT id_evento
     FROM campanas
     WHERE id_campana = ?
     LIMIT 1`,
    [id_campana]
  );

  return rows[0]?.id_evento || null;
}

async function getEventIdByInscripcion(id_inscripcion) {
  const [rows] = await pool.query(
    `SELECT c.id_evento
     FROM inscripciones i
     JOIN campanas c ON c.id_campana = i.id_campana
     WHERE i.id_inscripcion = ?
     LIMIT 1`,
    [id_inscripcion]
  );

  return rows[0]?.id_evento || null;
}

async function getMontoPagadoManualActual(id_inscripcion) {
  const [rows] = await pool.query(
    `SELECT monto_pagado_manual
     FROM inscripciones
     WHERE id_inscripcion = ?
     LIMIT 1`,
    [id_inscripcion]
  );

  if (!rows.length) {
    return undefined;
  }

  return rows[0].monto_pagado_manual;
}

async function getInscripcionCobroContext(id_inscripcion) {
  const [rows] = await pool.query(
    `SELECT
      i.id_inscripcion,
      i.id_campana,
      c.nombre AS contacto_nombre,
      c.email,
      COALESCE(te.nombre, 'Abono') AS ticket_nombre
    FROM inscripciones i
    JOIN contactos c ON c.id_contacto = i.id_contacto
    LEFT JOIN tipos_de_entrada te ON te.id_tipo_entrada = i.id_tipo_entrada
    WHERE i.id_inscripcion = ?
    LIMIT 1`,
    [id_inscripcion]
  );

  return rows[0] || null;
}

async function isSuperAdmin(userId) {
  if (!userId) return false;
  if (userId === 1) return true;
  return permissionModel.isSuperAdmin(userId);
}

async function ensureTesoreriaPermissionByCampana(userId, id_campana, action = 'read') {
  if (!userId) {
    return { ok: false, status: 401, error: 'No autorizado.' };
  }

  const eventId = await getEventIdByCampana(id_campana);

  if (!eventId) {
    return { ok: false, status: 404, error: 'Campaña no encontrada.' };
  }

  if (await isSuperAdmin(userId)) {
    return { ok: true, eventId };
  }

  const allowed = await permissionModel.isAllowedOnEvent(
    userId,
    eventId,
    'tesoreria',
    action
  );

  if (!allowed) {
    return {
      ok: false,
      status: 403,
      error: action === 'update'
        ? 'Sin acceso para actualizar pagos en este evento.'
        : 'Sin acceso a este evento.',
    };
  }

  return { ok: true, eventId };
}

async function ensureTesoreriaPermissionByInscripcion(userId, id_inscripcion, action = 'read') {
  if (!userId) {
    return { ok: false, status: 401, error: 'No autorizado.' };
  }

  const eventId = await getEventIdByInscripcion(id_inscripcion);

  if (!eventId) {
    return { ok: false, status: 404, error: 'Inscripción no encontrada.' };
  }

  if (await isSuperAdmin(userId)) {
    return { ok: true, eventId };
  }

  const allowed = await permissionModel.isAllowedOnEvent(
    userId,
    eventId,
    'tesoreria',
    action
  );

  if (!allowed) {
    return {
      ok: false,
      status: 403,
      error: action === 'update'
        ? 'Sin acceso para actualizar pagos en este evento.'
        : 'Sin acceso a este evento.',
    };
  }

  return { ok: true, eventId };
}

exports.getCampanasParaTesoreria = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ success: false, error: 'No autorizado.' });
    }

    const eventos = await TesoreriaModel.findEventosConCampanasTesoreria();

    if (await isSuperAdmin(userId)) {
      return res.json({ success: true, data: eventos });
    }

    const allowedIds = await permissionModel.getAllowedEventIds(userId, 'tesoreria', 'read');

    if (!allowedIds.length) {
      return res.json({ success: true, data: [] });
    }

    const filtrados = eventos.filter((ev) => allowedIds.includes(ev.id_evento));

    return res.json({ success: true, data: filtrados });
  } catch (error) {
    console.error('Error al obtener campañas para tesorería:', error);
    res.status(500).json({ success: false, error: 'Error del servidor.' });
  }
};

exports.getAsistentesTesoreria = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const userId = getUserId(req);
    const { id_campana } = req.params;

    const permission = await ensureTesoreriaPermissionByCampana(userId, id_campana, 'read');

    if (!permission.ok) {
      return res.status(permission.status).json({ success: false, error: permission.error });
    }

    const asistentes = await TesoreriaModel.findAsistentesPorCampana(id_campana);

    return res.json({ success: true, data: asistentes });
  } catch (error) {
    console.error('Error al obtener asistentes de tesorería:', error);
    res.status(500).json({ success: false, error: 'Error del servidor.' });
  }
};

exports.getHistorialPagos = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const userId = getUserId(req);
    const { id_inscripcion } = req.params;

    const permission = await ensureTesoreriaPermissionByInscripcion(userId, id_inscripcion, 'read');

    if (!permission.ok) {
      return res.status(permission.status).json({ success: false, error: permission.error });
    }

    const historial = await InscripcionPagoModel.getHistorialByInscripcion(id_inscripcion);

    return res.json({ success: true, data: historial });
  } catch (error) {
    console.error('Error al obtener historial de pagos:', error);
    res.status(500).json({ success: false, error: 'Error del servidor.' });
  }
};

exports.registrarAbono = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const userId = getUserId(req);
    const { id_inscripcion } = req.params;
    const { monto, medio_pago, observacion = null } = req.body;

    const permission = await ensureTesoreriaPermissionByInscripcion(userId, id_inscripcion, 'update');

    if (!permission.ok) {
      return res.status(permission.status).json({ success: false, error: permission.error });
    }

    if (!MEDIOS_PAGO_MANUALES_VALIDOS.includes(medio_pago)) {
      return res.status(400).json({
        success: false,
        error: 'Medio de pago manual inválido.',
      });
    }

    const montoNumerico = Number(monto);

    if (!Number.isFinite(montoNumerico) || montoNumerico <= 0) {
      return res.status(400).json({
        success: false,
        error: 'El monto debe ser mayor a 0.',
      });
    }

    const resumen = await InscripcionPagoModel.getCobroResumen(id_inscripcion);

    if (!resumen) {
      return res.status(404).json({ success: false, error: 'Inscripción no encontrada.' });
    }

    const tieneCobroObjetivo = Number(resumen.montoObjetivo || 0) > 0;

    if (tieneCobroObjetivo) {
      if (resumen.saldoPendiente <= 0) {
        return res.status(400).json({
          success: false,
          error: 'La inscripción ya está completamente pagada.',
        });
      }

      if (montoNumerico > resumen.saldoPendiente) {
        return res.status(400).json({
          success: false,
          error: `El abono no puede superar el saldo pendiente (${resumen.saldoPendiente}).`,
        });
      }
    }

    const result = await InscripcionPagoModel.registrarAbonoManual({
      id_inscripcion,
      monto: montoNumerico,
      medio_pago,
      observacion,
      creado_por: userId,
    });

    return res.json({
      success: true,
      message: 'Abono registrado correctamente.',
      data: result,
    });
  } catch (error) {
    console.error('Error al registrar abono manual:', error);
    res.status(500).json({ success: false, error: 'Error del servidor.' });
  }
};

exports.generarLinkPagoFlow = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const userId = getUserId(req);
    const { id_inscripcion } = req.params;
    const { monto, observacion = null } = req.body;

    const permission = await ensureTesoreriaPermissionByInscripcion(userId, id_inscripcion, 'update');

    if (!permission.ok) {
      return res.status(permission.status).json({ success: false, error: permission.error });
    }

    const resumen = await InscripcionPagoModel.getCobroResumen(id_inscripcion);

    if (!resumen) {
      return res.status(404).json({ success: false, error: 'Inscripción no encontrada.' });
    }

    const montoEnviado =
      monto === null || monto === '' || typeof monto === 'undefined'
        ? null
        : Number(monto);

    if (
      montoEnviado !== null &&
      (!Number.isFinite(montoEnviado) || montoEnviado <= 0)
    ) {
      return res.status(400).json({
        success: false,
        error: 'El monto para Flow debe ser mayor a 0.',
      });
    }

    const tieneCobroObjetivo = Number(resumen.montoObjetivo || 0) > 0;
    let montoFinal;

    if (!tieneCobroObjetivo) {
      if (montoEnviado === null) {
        return res.status(400).json({
          success: false,
          error: 'Esta inscripción no tiene ticket asignado. Para generar un link Flow debes ingresar un monto manual.',
        });
      }

      montoFinal = montoEnviado;
    } else {
      if (resumen.saldoPendiente <= 0) {
        return res.status(400).json({
          success: false,
          error: 'La inscripción ya está completamente pagada.',
        });
      }

      montoFinal = montoEnviado === null ? resumen.saldoPendiente : montoEnviado;

      if (montoFinal > resumen.saldoPendiente) {
        return res.status(400).json({
          success: false,
          error: `El link no puede superar el saldo pendiente (${resumen.saldoPendiente}).`,
        });
      }
    }

    const contexto = await getInscripcionCobroContext(id_inscripcion);

    if (!contexto) {
      return res.status(404).json({ success: false, error: 'Inscripción no encontrada.' });
    }

    const observacionNormalizada =
      typeof observacion === 'string' && observacion.trim().length > 0
        ? observacion.trim()
        : null;

    const ordenCompra = `sigeco-abono-${id_inscripcion}-${Date.now()}`;

    const nuevoPago = await PagoModel.create({
      id_inscripcion,
      monto: montoFinal,
      orden_compra: ordenCompra,
    });

    await InscripcionPagoModel.upsertMovimientoFlowDesdePago({
      id_pago: nuevoPago.id_pago,
      id_inscripcion,
      monto: montoFinal,
      estado: 'Pendiente',
      observacion: observacionNormalizada || 'Link generado desde Tesorería',
    });

    try {
      const flowResponse = await FlowService.crearOrdenDePago({
        orden_compra: ordenCompra,
        monto: montoFinal,
        subject: `Abono: ${contexto.ticket_nombre}`,
        email: contexto.email,
      });

      await PagoModel.updateById(nuevoPago.id_pago, {
        token_flow: flowResponse.token,
      });

      return res.status(200).json({
        success: true,
        message: 'Link de pago generado correctamente.',
        data: {
          redirectUrl: flowResponse.redirectUrl,
          monto: montoFinal,
        },
      });
    } catch (flowError) {
      const errorMsg = flowError.message || 'No se pudo crear la orden de pago.';

      await PagoModel.updateById(nuevoPago.id_pago, {
        estado: 'Fallido',
        detalle_error: errorMsg,
      });

      await InscripcionPagoModel.syncEstadoFromPago(nuevoPago.id_pago, 'Fallido');

      return res.status(500).json({
        success: false,
        error: errorMsg,
      });
    }
  } catch (error) {
    console.error('Error al generar link Flow desde Tesorería:', error);
    res.status(500).json({ success: false, error: 'Error del servidor.' });
  }
};

exports.updateEstadoPago = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const userId = getUserId(req);
    const { id_inscripcion } = req.params;
    const { estado_pago } = req.body;

    const permission = await ensureTesoreriaPermissionByInscripcion(userId, id_inscripcion, 'update');

    if (!permission.ok) {
      return res.status(permission.status).json({ success: false, error: permission.error });
    }

    if (!ESTADOS_PAGO_VALIDOS.includes(estado_pago)) {
      return res.status(400).json({
        success: false,
        error: 'Estado de pago inválido.',
      });
    }

    const montoFueEnviado = Object.prototype.hasOwnProperty.call(req.body, 'monto_pagado');
    let montoNormalizado;

    if (!montoFueEnviado) {
      const montoActual = await getMontoPagadoManualActual(id_inscripcion);

      if (typeof montoActual === 'undefined') {
        return res.status(404).json({ success: false, error: 'Inscripción no encontrada.' });
      }

      montoNormalizado = montoActual;
    } else {
      const { monto_pagado } = req.body;

      montoNormalizado =
        monto_pagado === null || monto_pagado === '' || typeof monto_pagado === 'undefined'
          ? null
          : Number(monto_pagado);

      if (
        montoNormalizado !== null &&
        (!Number.isFinite(montoNormalizado) || montoNormalizado < 0)
      ) {
        return res.status(400).json({
          success: false,
          error: 'El monto pagado debe ser un número válido mayor o igual a 0.',
        });
      }
    }

    const result = await TesoreriaModel.updatePagoTesoreria(
      id_inscripcion,
      estado_pago,
      montoNormalizado
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Inscripción no encontrada.' });
    }

    return res.json({
      success: true,
      message: 'Pago actualizado correctamente.',
    });
  } catch (error) {
    console.error('Error al actualizar pago:', error);
    res.status(500).json({ success: false, error: 'Error del servidor.' });
  }
};