const pool = require('../config/db');

exports.findByUser = async (user_id) => {
  const [rows] = await pool.query(
    `SELECT user_id, event_id, module, can_read, can_create, can_update, can_delete
       FROM user_event_permissions
      WHERE user_id = ?
      ORDER BY event_id DESC, module ASC`,
    [user_id]
  );
  return rows;
};

exports.upsert = async ({ user_id, event_id, module, can_read, can_create, can_update, can_delete }) => {
  await pool.query(
    `INSERT INTO user_event_permissions (user_id, event_id, module, can_read, can_create, can_update, can_delete)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       can_read = VALUES(can_read),
       can_create = VALUES(can_create),
       can_update = VALUES(can_update),
       can_delete = VALUES(can_delete)`,
    [user_id, event_id, module, can_read, can_create, can_update, can_delete]
  );
  return { user_id, event_id, module, can_read, can_create, can_update, can_delete };
};

exports.remove = async (user_id, event_id, module) => {
  await pool.query(
    `DELETE FROM user_event_permissions WHERE user_id = ? AND event_id = ? AND module = ?`,
    [user_id, event_id, module]
  );
};
