const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Email y contraseña son obligatorios.' });
    }

    try {
        const [rows] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);

        if (rows.length === 0) {
            return res.status(401).json({ success: false, error: 'Credenciales inválidas.' });
        }

        const usuario = rows[0];
        const isMatch = await bcrypt.compare(password, usuario.password);

        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Credenciales inválidas.' });
        }

        const payload = {
            id_usuario: usuario.id_usuario,
            nombre: usuario.nombre
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: '1h' // El token expirará en 1 hora
        });

        res.json({
            success: true,
            data: {
                token: token
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'No se pudo conectar con el servidor.' });
    }
};
