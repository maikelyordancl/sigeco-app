const pool = require('../config/db');

exports.findAll = async () => {
  const [rows] = await pool.query(`SELECT id, name FROM roles ORDER BY name ASC`);
  return rows;
};

exports.findByName = async (name) => {
  const [rows] = await pool.query(
    `SELECT id, name FROM roles WHERE LOWER(name) = LOWER(?) LIMIT 1`,
    [name]
  );
  return rows[0] || null;
};

exports.create = async (name) => {
  const [result] = await pool.query(`INSERT INTO roles (name) VALUES (?)`, [name]);
  return { id: result.insertId, name };
};
