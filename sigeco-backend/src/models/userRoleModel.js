const pool = require('../config/db');

exports.assign = async (user_id, role_id) => {
  await pool.query(
    `INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)`,
    [user_id, role_id]
  );
};

exports.remove = async (user_id, role_id) => {
  await pool.query(
    `DELETE FROM user_roles WHERE user_id = ? AND role_id = ?`,
    [user_id, role_id]
  );
};

exports.findRolesByUser = async (user_id) => {
  const [rows] = await pool.query(
    `SELECT r.id, r.name
       FROM user_roles ur
       JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = ?
      ORDER BY r.name ASC`,
    [user_id]
  );
  return rows;
};
