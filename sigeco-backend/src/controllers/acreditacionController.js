const { validationResult } = require('express-validator');
const pool = require('../config/db');
const permissionModel = require('../models/permissionModel');
const AcreditacionModel = require('../models/acreditacionModel');

// Helper mínimo para query (compatible con mysql2/promise y callback)
async function q(sql, params = []) {
  const maybe = pool.query(sql, params);
  if (maybe && typeof maybe.then === 'function') {
    const [rows] = await maybe;
    return rows;
  }
  return await new Promise((resolve, reject) => {
    pool.query(sql, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
}

function getUserId(req) {
  const cand =
    (req.user && (req.user.id || req.user.userId || req.user.id_usuario || req.user.idUsuario)) ||
    req.userId ||
    req.uid ||
    (req.usuario && (req.usuario.id || req.usuario.id_usuario || req.usuario.idUsuario));
  const n = parseInt(cand, 10);
  return Number.isFinite(n) ? n : null;
}

// Mapea campaña -> id_evento (sin tocar tus modelos)
async function getEventIdByCampana(id_campana) {
  // Ajusta si tu schema usa otro nombre de columna
  const rows = await q(
    `SELECT id_evento FROM campanas WHERE id_campana = ? LIMIT 1`,
    [id_campana]
  );
  return rows[0]?.id_evento || null;
}

// Mapea inscripción -> id_evento (inscripciones -> campanas -> eventos)
async function getEventIdByInscripcion(id_inscripcion) {
  const rows = await q(
    `SELECT c.id_evento
       FROM inscripciones i
       JOIN campanas c ON c.id_campana = i.id_campana
      WHERE i.id_inscripcion = ?
      LIMIT 1`,
    [id_inscripcion]
  );
  return rows[0]?.id_evento || null;
}

exports.getCampanasParaAcreditar = async (req, res) => {
  try {
    // 1) Trae la estructura completa tal como antes (eventos con atributo campanas)
    const eventos = await AcreditacionModel.findEventosConCampanasAcreditables();

    // 2) SUPER ADMIN -> devolver intacto (mismo formato que antes)
    if (req.isSuperAdmin === true) {
      return res.json({ success: true, data: eventos });
    }

    // 3) No super: filtrar por eventos permitidos en módulo 'acreditacion'
    const allowedIds = Array.isArray(req.allowedEventIds) ? req.allowedEventIds : [];
    if (allowedIds.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // Mantener exactamente la misma forma de respuesta (cada item debe conservar .campanas)
    const filtrados = (Array.isArray(eventos) ? eventos : []).filter(ev => {
      // ev.id_evento debe existir en el payload original del modelo
      return allowedIds.includes(ev.id_evento);
    });

    return res.json({ success: true, data: filtrados });
  } catch (error) {
    console.error('Error al obtener campañas para acreditar:', error);
    res.status(500).json({ success: false, error: 'Error del servidor.' });
  }
};

exports.getAsistentesAcreditacion = async (req, res) => {
  const { id_campana } = req.params;
  try {
    // SUPER ADMIN
    if (req.isSuperAdmin === true) {
      const asistentes = await AcreditacionModel.findAcreditacionAsistentesPorCampana(id_campana);
      return res.json({ success: true, data: asistentes });
    }

    // No super: verificar permiso sobre el evento dueño de la campaña
    const userId = getUserId(req);
    const eventId = await getEventIdByCampana(id_campana);
    if (!eventId) {
      return res.status(404).json({ success: false, error: 'Campaña no encontrada.' });
    }

    const allowed = await permissionModel.isAllowedOnEvent(userId, eventId, 'acreditacion', 'read');
    if (!allowed) {
      return res.status(403).json({ success: false, error: 'Sin acceso a este evento.' });
    }

    const asistentes = await AcreditacionModel.findAcreditacionAsistentesPorCampana(id_campana);
    res.json({ success: true, data: asistentes });
  } catch (error) {
    console.error(`Error al obtener asistentes para la campaña ${id_campana}:`, error);
    res.status(500).json({ success: false, error: 'Error del servidor.' });
  }
};

exports.getAsistentes = async (req, res) => {
  const { id_campana } = req.params;
  try {
    // SUPER ADMIN
    if (req.isSuperAdmin === true) {
      const asistentes = await AcreditacionModel.findAsistentesPorCampana(id_campana);
      return res.json({ success: true, data: asistentes });
    }

    // No super: validar permiso de lectura
    const userId = getUserId(req);
    const eventId = await getEventIdByCampana(id_campana);
    if (!eventId) {
      return res.status(404).json({ success: false, error: 'Campaña no encontrada.' });
    }

    const allowed = await permissionModel.isAllowedOnEvent(userId, eventId, 'acreditacion', 'read');
    if (!allowed) {
      return res.status(403).json({ success: false, error: 'Sin acceso a este evento.' });
    }

    const asistentes = await AcreditacionModel.findAsistentesPorCampana(id_campana);
    res.json({ success: true, data: asistentes });
  } catch (error) {
    console.error(`Error al obtener asistentes para la campaña ${id_campana}:`, error);
    res.status(500).json({ success: false, error: 'Error del servidor.' });
  }
};

exports.updateAsistencia = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { id_inscripcion } = req.params;
  const { nuevo_estado } = req.body;

  try {
    // SUPER ADMIN
    if (req.isSuperAdmin === true) {
      const result = await AcreditacionModel.updateEstadoAsistencia(id_inscripcion, nuevo_estado);
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, error: 'Inscripción no encontrada.' });
      }
      return res.json({ success: true, message: 'Estado actualizado correctamente.' });
    }

    // No super: validar permiso de actualización sobre el evento dueño
    const userId = getUserId(req);
    const eventId = await getEventIdByInscripcion(id_inscripcion);
    if (!eventId) {
      return res.status(404).json({ success: false, error: 'Inscripción no encontrada.' });
    }

    const allowed = await permissionModel.isAllowedOnEvent(userId, eventId, 'acreditacion', 'update');
    if (!allowed) {
      return res.status(403).json({ success: false, error: 'Sin acceso para actualizar en este evento.' });
    }

    const result = await AcreditacionModel.updateEstadoAsistencia(id_inscripcion, nuevo_estado);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Inscripción no encontrada.' });
    }
    res.json({ success: true, message: 'Estado actualizado correctamente.' });
  } catch (error) {
    console.error(`Error al actualizar estado para la inscripción ${id_inscripcion}:`, error);
    res.status(500).json({ success: false, error: 'Error del servidor.' });
  }
};

exports.registrarEnPuerta = async (req, res) => {
  // Validaciones de express-validator
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { id_campana } = req.params;

    // SUPER ADMIN
    if (req.isSuperAdmin === true) {
      const resultado = await AcreditacionModel.registrarEnPuerta(
        Number(id_campana),
        req.body.id_tipo_entrada || null,
        {
          nombre: req.body.nombre?.trim() || null,
          email: req.body.email?.trim().toLowerCase(),
          telefono: req.body.telefono?.trim() || null,
          rut: req.body.rut?.trim() || null,
          empresa: req.body.empresa?.trim() || null,
          actividad: req.body.actividad?.trim() || null,
          profesion: req.body.profesion?.trim() || null,
          comuna: req.body.comuna?.trim() || null,
          pais: req.body.pais?.trim() || null
        },
        Array.isArray(req.body.respuestas) ? req.body.respuestas : [],
        req.body.acreditar_ahora ? 'Asistió' : 'Confirmado',
        req.body.acreditar_ahora ? 1 : 0
      );
      return res.status(201).json({
        success: true,
        message: 'Asistente registrado correctamente.',
        data: resultado
      });
    }

    // No super: validar permiso de actualización
    const userId = getUserId(req);
    const eventId = await getEventIdByCampana(id_campana);
    if (!eventId) {
      return res.status(404).json({ success: false, error: 'Campaña no encontrada.' });
    }

    const allowed = await permissionModel.isAllowedOnEvent(userId, eventId, 'acreditacion', 'update');
    if (!allowed) {
      return res.status(403).json({ success: false, error: 'Sin acceso para actualizar en este evento.' });
    }

    const resultado = await AcreditacionModel.registrarEnPuerta(
      Number(id_campana),
      req.body.id_tipo_entrada || null,
      {
        nombre: req.body.nombre?.trim() || null,
        email: req.body.email?.trim().toLowerCase(),
        telefono: req.body.telefono?.trim() || null,
        rut: req.body.rut?.trim() || null,
        empresa: req.body.empresa?.trim() || null,
        actividad: req.body.actividad?.trim() || null,
        profesion: req.body.profesion?.trim() || null,
        comuna: req.body.comuna?.trim() || null,
        pais: req.body.pais?.trim() || null
      },
      Array.isArray(req.body.respuestas) ? req.body.respuestas : [],
      req.body.acreditar_ahora ? 'Asistió' : 'Confirmado',
      req.body.acreditar_ahora ? 1 : 0
    );

    return res.status(201).json({
      success: true,
      message: 'Asistente registrado correctamente.',
      data: resultado
    });
  } catch (error) {
    console.error('Error en el controlador al registrar en puerta:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error interno del servidor.'
    });
  }
};
