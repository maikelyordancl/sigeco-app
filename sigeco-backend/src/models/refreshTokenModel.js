const pool = require('../config/db');

const RefreshToken = {
    create: async (userId, token, expiresAt) => {
        const query = 'INSERT INTO user_refresh_tokens (id_usuario, token, expires_at) VALUES (?, ?, ?)';
        await pool.query(query, [userId, token, expiresAt]);
    },
    findByToken: async (token) => {
        const query = 'SELECT * FROM user_refresh_tokens WHERE token = ?';
        const [rows] = await pool.query(query, [token]);
        return rows[0];
    },
    delete: async (token) => {
        const query = 'DELETE FROM user_refresh_tokens WHERE token = ?';
        const [result] = await pool.query(query, [token]);
        return result.affectedRows;
    },
    deleteByUserId: async (userId) => {
        const query = 'DELETE FROM user_refresh_tokens WHERE id_usuario = ?';
        await pool.query(query, [userId]);
    }
};

module.exports = RefreshToken;