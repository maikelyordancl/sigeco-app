const { validationResult } = require('express-validator');
const rolesModel = require('../models/rolesModel');
const userRoleModel = require('../models/userRoleModel');
const uepModel = require('../models/userEventPermissionModel');

// Solo super admin permitido
function ensureSuper(req, res) {
  if (req.isSuperAdmin === true) return true;
  return res.status(403).json({ success: false, error: 'Solo super administrador.' });
}

// ---- ROLES ----
exports.getRoles = async (req, res) => {
  if (!ensureSuper(req, res)) return;
  try {
    const roles = await rolesModel.findAll();
    res.json({ success: true, data: roles });
  } catch (e) {
    console.error('getRoles', e);
    res.status(500).json({ success: false, error: 'Error al listar roles.' });
  }
};

exports.createRole = async (req, res) => {
  if (!ensureSuper(req, res)) return;
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const nuevo = await rolesModel.create(req.body.name);
    res.status(201).json({ success: true, data: nuevo });
  } catch (e) {
    console.error('createRole', e);
    res.status(500).json({ success: false, error: 'Error al crear rol.' });
  }
};

// ---- USER-ROLES ----
exports.assignUserRole = async (req, res) => {
  if (!ensureSuper(req, res)) return;
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { user_id, role_id } = req.body;
  try {
    await userRoleModel.assign(user_id, role_id);
    res.json({ success: true, message: 'Rol asignado.' });
  } catch (e) {
    console.error('assignUserRole', e);
    res.status(500).json({ success: false, error: 'Error al asignar rol.' });
  }
};

exports.removeUserRole = async (req, res) => {
  if (!ensureSuper(req, res)) return;
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { user_id, role_id } = req.query;
  try {
    await userRoleModel.remove(user_id, role_id);
    res.json({ success: true, message: 'Rol removido.' });
  } catch (e) {
    console.error('removeUserRole', e);
    res.status(500).json({ success: false, error: 'Error al remover rol.' });
  }
};

// ---- USER EVENT PERMISSIONS ----
exports.getUserEventPermissions = async (req, res) => {
  if (!ensureSuper(req, res)) return;
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { user_id } = req.query;
  try {
    const rows = await uepModel.findByUser(user_id);
    res.json({ success: true, data: rows });
  } catch (e) {
    console.error('getUserEventPermissions', e);
    res.status(500).json({ success: false, error: 'Error al listar permisos por evento.' });
  }
};

exports.upsertUserEventPermission = async (req, res) => {
  if (!ensureSuper(req, res)) return;
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { user_id, event_id, module, can_read = 0, can_create = 0, can_update = 0, can_delete = 0 } = req.body;

  try {
    const result = await uepModel.upsert({
      user_id,
      event_id,
      module,
      can_read,
      can_create,
      can_update,
      can_delete
    });
    res.json({ success: true, data: result });
  } catch (e) {
    console.error('upsertUserEventPermission', e);
    res.status(500).json({ success: false, error: 'Error al guardar permisos por evento.' });
  }
};

exports.deleteUserEventPermission = async (req, res) => {
  if (!ensureSuper(req, res)) return;
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { user_id, event_id, module } = req.query;
  try {
    await uepModel.remove(user_id, event_id, module);
    res.json({ success: true, message: 'Permiso eliminado.' });
  } catch (e) {
    console.error('deleteUserEventPermission', e);
    res.status(500).json({ success: false, error: 'Error al eliminar permiso por evento.' });
  }
};

// ---- RESUMEN ----
exports.getUserSummary = async (req, res) => {
  if (!ensureSuper(req, res)) return;
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { user_id } = req.params;
  try {
    const roles = await userRoleModel.findRolesByUser(user_id);
    const permisos = await uepModel.findByUser(user_id);
    res.json({
      success: true,
      data: {
        user_id: Number(user_id),
        roles,
        event_permissions: permisos
      }
    });
  } catch (e) {
    console.error('getUserSummary', e);
    res.status(500).json({ success: false, error: 'Error al obtener resumen de usuario.' });
  }
};
