// src/models/permissionModel.js
const pool = require('../config/db');

// Helper dual: soporta mysql2/promise (retorna Promise) y mysql/mysql2 clásico (callback)
async function q(sql, params = []) {
  try {
    const maybe = pool.query(sql, params);
    if (maybe && typeof maybe.then === 'function') {
      // mysql2/promise: retorna [rows, fields]
      const [rows/*, fields*/] = await maybe;
      return rows;
    }
    // mysql clásico: usa callback
    return await new Promise((resolve, reject) => {
      pool.query(sql, params, (err, results/*, fields*/) => {
        if (err) return reject(err);
        resolve(results);
      });
    });
  } catch (e) {
    throw e;
  }
}

exports.isSuperAdmin = async (userId) => {
  const rows = await q(
    `SELECT 1
       FROM user_roles ur
       JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = ? AND r.name = 'SUPER_ADMIN'
      LIMIT 1`,
    [userId]
  );
  return rows.length > 0;
};

// Por ahora no obligamos role_permissions. Cuando quieras activarlo, cambia esta función.
exports.roleHasPermission = async (_userId, _module, _action) => {
  return true;

  // Ejemplo cuando lo actives:
  // const rows = await q(
  //   `SELECT 1
  //      FROM user_roles ur
  //      JOIN role_permissions rp ON rp.role_id = ur.role_id
  //      JOIN permissions p ON p.id = rp.permission_id
  //     WHERE ur.user_id = ? AND p.module = ? AND p.action = ?
  //     LIMIT 1`,
  //   [_userId, _module, _action]
  // );
  // return rows.length > 0;
};

exports.getAllowedEventIds = async (userId, module, action) => {
  const rows = await q(
    `SELECT DISTINCT uep.event_id
       FROM user_event_permissions uep
      WHERE uep.user_id = ?
        AND (uep.module = ? OR uep.module = '*')
        AND (
          (? = 'read'  AND uep.can_read  = 1) OR
          (? = 'create' AND uep.can_create = 1) OR
          (? = 'update' AND uep.can_update = 1) OR
          (? = 'delete' AND uep.can_delete = 1)
        )`,
    [userId, module, action, action, action, action]
  );
  return rows.map(r => r.event_id);
};

exports.isAllowedOnEvent = async (userId, eventId, module, action) => {
  const rows = await q(
    `SELECT 1
       FROM user_event_permissions uep
      WHERE uep.user_id = ?
        AND uep.event_id = ?
        AND (uep.module = ? OR uep.module = '*')
        AND (
          (? = 'read'  AND uep.can_read  = 1) OR
          (? = 'create' AND uep.can_create = 1) OR
          (? = 'update' AND uep.can_update = 1) OR
          (? = 'delete' AND uep.can_delete = 1)
        )
      LIMIT 1`,
    [userId, eventId, module, action, action, action, action]
  );
  return rows.length > 0;
};
