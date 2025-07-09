const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Tu función de login (sin cambios)
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


// --- NUEVO: Middleware para verificar el token JWT ---
exports.verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Formato "Bearer TOKEN"

    if (!token) {
        return res.status(401).json({ success: false, error: 'Acceso denegado. No se proporcionó token.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, error: 'Token inválido o expirado.' });
        }
        req.user = user; // Guardamos los datos del usuario en el objeto de la petición
        next(); // El token es válido, continuamos a la siguiente función (el controlador)
    });
};
