const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const usuarioModel = require('../models/usuarioModel');
const userRoleModel = require('../models/userRoleModel');

exports.getUsuarios = async (req, res) => {
  try {
    const usuarios = await usuarioModel.findAll(req.query.search || null);
    return res.json({ success: true, data: usuarios });
  } catch (e) {
    console.error('getUsuarios', e);
    return res.status(500).json({ success: false, error: 'Error del servidor al listar usuarios.' });
  }
};

exports.createUsuario = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { nombre, email, password, role_id } = req.body;

  try {
    const exists = await usuarioModel.findByEmail(email);
    if (exists) {
      return res.status(409).json({ success: false, error: 'El email ya está registrado.' });
    }

    const hash = await bcrypt.hash(password, 10);
    const nuevo = await usuarioModel.create({ nombre, email, password_hash: hash });

    if (role_id) {
      await userRoleModel.assign(nuevo.id_usuario, role_id);
    }

    return res.status(201).json({ success: true, data: nuevo });
  } catch (e) {
    console.error('createUsuario', e);
    return res.status(500).json({ success: false, error: 'Error del servidor al crear usuario.' });
  }
};

exports.updateUsuario = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { id } = req.params;
  const { nombre, email } = req.body;

  try {
    const exists = await usuarioModel.findByEmail(email);
    if (exists && String(exists.id_usuario) !== String(id)) {
      return res.status(409).json({ success: false, error: 'El email ya está en uso por otro usuario.' });
    }

    const result = await usuarioModel.updateById(id, { nombre, email });
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado.' });
    }

    return res.json({ success: true, message: 'Usuario actualizado con éxito.' });
  } catch (e) {
    console.error('updateUsuario', e);
    return res.status(500).json({ success: false, error: 'Error del servidor al actualizar usuario.' });
  }
};

exports.deleteUsuario = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await usuarioModel.deleteById(id);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado.' });
    }
    return res.json({ success: true, message: 'Usuario eliminado con éxito.' });
  } catch (e) {
    console.error('deleteUsuario', e);
    return res.status(500).json({ success: false, error: 'Error del servidor al eliminar usuario.' });
  }
};

exports.updatePassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { id } = req.params;
  const { password } = req.body;

  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await usuarioModel.updatePasswordById(id, hash);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado.' });
    }

    return res.json({ success: true, message: 'Contraseña actualizada con éxito.' });
  } catch (e) {
    console.error('updatePassword', e);
    return res.status(500).json({ success: false, error: 'Error del servidor al actualizar contraseña.' });
  }
};
