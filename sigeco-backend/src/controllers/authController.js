const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const RefreshTokenModel = require('../models/refreshTokenModel'); // Importamos el nuevo modelo

// Función para generar tokens
const generateTokens = (user) => {
    const accessToken = jwt.sign(
        { id_usuario: user.id_usuario, nombre: user.nombre },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
        { id_usuario: user.id_usuario },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
    );

    return { accessToken, refreshToken };
};


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

        const { accessToken, refreshToken } = generateTokens(usuario);
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días

        // Limpiamos tokens viejos y guardamos el nuevo
        await RefreshTokenModel.deleteByUserId(usuario.id_usuario);
        await RefreshTokenModel.create(usuario.id_usuario, refreshToken, expiresAt);

        res.json({
            success: true,
            data: { accessToken, refreshToken }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'No se pudo conectar con el servidor.' });
    }
};

exports.refreshToken = async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return res.status(401).json({ success: false, error: 'Token de refresco no proporcionado.' });
    }

    try {
        const storedToken = await RefreshTokenModel.findByToken(refreshToken);
        if (!storedToken || new Date(storedToken.expires_at) < new Date()) {
            return res.status(403).json({ success: false, error: 'Token de refresco inválido o expirado.' });
        }

        jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, async (err, user) => {
            if (err) {
                return res.status(403).json({ success: false, error: 'Fallo en la verificación del token.' });
            }

            const [rows] = await pool.query('SELECT * FROM usuarios WHERE id_usuario = ?', [user.id_usuario]);
            if (rows.length === 0) {
                 return res.status(403).json({ success: false, error: 'Usuario no encontrado.' });
            }

            const usuario = rows[0];
            const { accessToken, refreshToken: newRefreshToken } = generateTokens(usuario);
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días

            await RefreshTokenModel.delete(refreshToken); // Eliminamos el token viejo
            await RefreshTokenModel.create(usuario.id_usuario, newRefreshToken, expiresAt); // Guardamos el nuevo

            res.json({ success: true, data: { accessToken, refreshToken: newRefreshToken } });
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error interno del servidor.' });
    }
};

exports.logout = async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return res.status(400).json({ success: false, error: 'Token de refresco requerido.' });
    }
    try {
        await RefreshTokenModel.delete(refreshToken);
        res.json({ success: true, message: 'Sesión cerrada exitosamente.' });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error interno del servidor.' });
    }
};


exports.verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, error: 'Acceso denegado. No se proporcionó token.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            // Distinguimos entre token expirado y otros errores
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ success: false, error: 'Token expirado.' });
            }
            return res.status(403).json({ success: false, error: 'Token inválido.' });
        }
        req.user = user;
        next();
    });
};