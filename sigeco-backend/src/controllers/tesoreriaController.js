const { validationResult } = require('express-validator');
const pool = require('../config/db');
const permissionModel = require('../models/permissionModel');
const TesoreriaModel = require('../models/tesoreriaModel');

const ESTADOS_PAGO_VALIDOS = [
  'No Aplica',
  'Pendiente',
  'Pagado',
  'Rechazado',
  'Reembolsado',
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

async function isSuperAdmin(userId) {
  if (!userId) return false;
  if (userId === 1) return true;
  return permissionModel.isSuperAdmin(userId);
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

    if (!userId) {
      return res.status(401).json({ success: false, error: 'No autorizado.' });
    }

    const eventId = await getEventIdByCampana(id_campana);

    if (!eventId) {
      return res.status(404).json({ success: false, error: 'Campaña no encontrada.' });
    }

    if (!(await isSuperAdmin(userId))) {
      const allowed = await permissionModel.isAllowedOnEvent(
        userId,
        eventId,
        'tesoreria',
        'read'
      );

      if (!allowed) {
        return res.status(403).json({ success: false, error: 'Sin acceso a este evento.' });
      }
    }

    const asistentes = await TesoreriaModel.findAsistentesPorCampana(id_campana);

    return res.json({ success: true, data: asistentes });
  } catch (error) {
    console.error('Error al obtener asistentes de tesorería:', error);
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

    if (!userId) {
      return res.status(401).json({ success: false, error: 'No autorizado.' });
    }

    if (!ESTADOS_PAGO_VALIDOS.includes(estado_pago)) {
      return res.status(400).json({
        success: false,
        error: 'Estado de pago inválido.',
      });
    }

    const eventId = await getEventIdByInscripcion(id_inscripcion);

    if (!eventId) {
      return res.status(404).json({ success: false, error: 'Inscripción no encontrada.' });
    }

    if (!(await isSuperAdmin(userId))) {
      const allowed = await permissionModel.isAllowedOnEvent(
        userId,
        eventId,
        'tesoreria',
        'update'
      );

      if (!allowed) {
        return res.status(403).json({
          success: false,
          error: 'Sin acceso para actualizar pagos en este evento.',
        });
      }
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