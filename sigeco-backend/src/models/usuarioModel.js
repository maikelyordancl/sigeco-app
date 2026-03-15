const pool = require('../config/db');

const TABLE = 'usuarios';
const FIELDS_PUBLIC = 'id_usuario, nombre, email';

exports.findAll = async (search = null) => {
  let query = `SELECT ${FIELDS_PUBLIC} FROM ${TABLE}`;
  const params = [];

  if (search && String(search).trim()) {
    query += ' WHERE nombre LIKE ? OR email LIKE ?';
    params.push(`%${String(search).trim()}%`, `%${String(search).trim()}%`);
  }

  query += ' ORDER BY id_usuario DESC';

  const [rows] = await pool.query(query, params);
  return rows;
};

exports.findByEmail = async (email) => {
  const [rows] = await pool.query(
    `SELECT id_usuario, nombre, email FROM ${TABLE} WHERE email = ? LIMIT 1`,
    [email]
  );
  return rows[0] || null;
};

exports.create = async ({ nombre, email, password_hash }) => {
  const [result] = await pool.query(
    `INSERT INTO ${TABLE} (nombre, email, password) VALUES (?, ?, ?)`,
    [nombre, email, password_hash]
  );
  return { id_usuario: result.insertId, nombre, email };
};

exports.updateById = async (id, { nombre, email }) => {
  const [result] = await pool.query(
    `UPDATE ${TABLE} SET nombre = ?, email = ? WHERE id_usuario = ?`,
    [nombre, email, id]
  );
  return result;
};

exports.deleteById = async (id) => {
  const [result] = await pool.query(
    `DELETE FROM ${TABLE} WHERE id_usuario = ?`,
    [id]
  );
  return result;
};

exports.updatePasswordById = async (id, password_hash) => {
  const [result] = await pool.query(
    `UPDATE ${TABLE} SET password = ? WHERE id_usuario = ?`,
    [password_hash, id]
  );
  return result;
};
