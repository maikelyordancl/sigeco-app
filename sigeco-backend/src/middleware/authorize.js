// src/middleware/authorize.js
const permissionModel = require('../models/permissionModel');

// Detecta el ID del usuario desde varias formas comunes
function getUserId(req) {
  const candidates = [
    // objetos comunes
    req.user && (req.user.id || req.user.userId || req.user.id_usuario || req.user.idUsuario),
    req.usuario && (req.usuario.id || req.usuario.id_usuario || req.usuario.idUsuario),
    // atajos frecuentes
    req.userId,
    req.uid,
    // a veces authController pone decoded en req
    req.decoded && (req.decoded.id || req.decoded.userId || req.decoded.id_usuario || req.decoded.idUsuario),
    // en algunos casos guardan auth en req.auth
    req.auth && (req.auth.id || req.auth.userId || req.auth.id_usuario || req.auth.idUsuario),
  ].filter(Boolean);

  for (const cand of candidates) {
    const n = parseInt(cand, 10);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

// Toma eventId desde params, query o body (tu PUT usa ?id=...)
function getEventIdFromRequest(req) {
  const cands = [
    req.params && (req.params.eventId || req.params.id_evento || req.params.id),
    req.query && (req.query.eventId || req.query.id_evento || req.query.id),
    req.body && (req.body.event_id || req.body.id_evento || req.body.eventId || req.body.id),
  ].filter(Boolean);

  for (const cand of cands) {
    const n = parseInt(cand, 10);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

module.exports = function authorize(moduleName, action) {
  return async function (req, res, next) {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: 'No autorizado' });
      }

      // 🔓 Bypass directo para tu super admin (usuario 1)
      if (userId === 1) {
        req.isSuperAdmin = true;
        return next();
      }

      // Super admin vía BD (por si en el futuro no es el 1)
      if (await permissionModel.isSuperAdmin(userId)) {
        req.isSuperAdmin = true;
        return next();
      }

      // (Opcional) permisos por rol (actualmente true en permissionModel)
      const okRole = await permissionModel.roleHasPermission(userId, moduleName, action);
      if (!okRole) {
        return res.status(403).json({ message: 'Permiso insuficiente (rol)' });
      }

      // Alcance por evento
      const eventId = getEventIdFromRequest(req);

      if (eventId !== null) {
        // Chequeo puntual sobre ese evento
        const okEvent = await permissionModel.isAllowedOnEvent(userId, eventId, moduleName, action);
        if (!okEvent) {
          return res.status(403).json({ message: 'Sin acceso a este evento' });
        }
      } else if (action === 'read') {
        // Para listados (sin eventId): precalcular ids permitidos
        req.allowedEventIds = await permissionModel.getAllowedEventIds(userId, moduleName, action);
      }

      return next();
    } catch (err) {
      console.error('authorize error:', err);
      return res.status(500).json({ message: 'Error de autorización' });
    }
  };
};
