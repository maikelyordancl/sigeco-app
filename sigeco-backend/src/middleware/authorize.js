// src/middlewares/authorize.js
const permissionModel = require('../models/permissionModel');

function getUserId(req) {
  const cand = [
    req.user && (req.user.id || req.user.userId || req.user.id_usuario || req.user.idUsuario),
    req.userId,
    req.uid,
    req.usuario && (req.usuario.id || req.usuario.id_usuario || req.usuario.idUsuario),
  ].find(Boolean);
  const n = parseInt(cand, 10);
  return Number.isFinite(n) ? n : null;
}

function getEventIdFromRequest(req) {
  const cand =
    (req.params && (req.params.eventId || req.params.id_evento || req.params.id)) ||
    (req.query && (req.query.eventId || req.query.id_evento || req.query.id)) ||
    (req.body && (req.body.event_id || req.body.id_evento || req.body.eventId || req.body.id)) ||
    null;
  const n = parseInt(cand, 10);
  return Number.isFinite(n) ? n : null;
}

module.exports = function authorize(moduleName, action) {
  return async function (req, res, next) {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: 'No autorizado' });

      // 🔓 Bypass definitivo para user 1 y marca explícita
      if (userId === 1) {
        req.isSuperAdmin = true;      // <<--- MARCA AQUÍ
        return next();
      }

      // Super admin por BD (por si en el futuro no es el 1)
      if (await permissionModel.isSuperAdmin(userId)) {
        req.isSuperAdmin = true;      // <<--- MARCA TAMBIÉN
        return next();
      }

      // (Opcional) permisos por rol (ahora true en permissionModel)
      const okRole = await permissionModel.roleHasPermission(userId, moduleName, action);
      if (!okRole) return res.status(403).json({ message: 'Permiso insuficiente (rol)' });

      // Scope por evento
      const eventId = getEventIdFromRequest(req);
      if (eventId !== null) {
        const okEvent = await permissionModel.isAllowedOnEvent(userId, eventId, moduleName, action);
        if (!okEvent) return res.status(403).json({ message: 'Sin acceso a este evento' });
      } else if (action === 'read') {
        req.allowedEventIds = await permissionModel.getAllowedEventIds(userId, moduleName, action);
      }

      return next();
    } catch (err) {
      console.error('authorize error:', err);
      return res.status(500).json({ message: 'Error de autorización' });
    }
  };
};
