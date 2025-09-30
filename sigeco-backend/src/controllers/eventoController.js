const { validationResult } = require('express-validator');
const EventoModel = require('../models/eventoModel');
const CampanaModel = require('../models/campanaModel'); // ---- NUEVO ----

// Obtener todos los eventos
exports.getAllEventos = async (req, res) => {
  try {
    // Si el middleware authorize marcó super admin, devuelve todo (comportamiento original)
    if (req.isSuperAdmin === true) {
      const eventos = await EventoModel.findAll();
      return res.json({ success: true, data: eventos });
    }

    // Si no es super: limitar por eventos permitidos precalculados por authorize
    const allowedIds = Array.isArray(req.allowedEventIds) ? req.allowedEventIds : [];

    // Sin permisos por evento => lista vacía (mantiene formato de respuesta)
    if (allowedIds.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // Necesita que exista un método mínimo en tu modelo para filtrar por IDs
    // (EventoModel.findByIds(ids)). No tocamos tus otros métodos.
    const eventos = await EventoModel.findByIds(allowedIds);
    return res.json({ success: true, data: eventos });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Error del servidor al obtener eventos.' });
  }
};

exports.getEventoById = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { id } = req.params;
  try {
    const evento = await EventoModel.findById(id);
    if (!evento) {
      return res.status(404).json({ success: false, error: 'Evento no encontrado.' });
    }
    return res.json({ success: true, data: evento });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, error: 'Error del servidor al obtener el evento.' });
  }
};

// Crear un nuevo evento
exports.createEvento = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const nuevoEvento = await EventoModel.create(req.body);

    // ---- NUEVO ----
    // Luego de crear el evento, crear su campaña principal asociada.
    if (nuevoEvento && nuevoEvento.id_evento) {
      const nombreCampana = `Campana General - ${nuevoEvento.nombre}`;
      const campanaData = {
        id_evento: nuevoEvento.id_evento,
        nombre: nombreCampana,
        estado: 'Borrador' // inactiva por defecto
      };
      await CampanaModel.create(campanaData);
    }
    // ---- FIN NUEVO ----

    res.status(201).json({ success: true, data: nuevoEvento });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Error del servidor al crear el evento.' });
  }
};

// Actualizar un evento existente
exports.updateEvento = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { id } = req.query;

  try {
    const result = await EventoModel.updateById(id, req.body);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Evento no encontrado.' });
    }
    res.json({ success: true, message: 'Evento actualizado con éxito.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Error del servidor al actualizar el evento.' });
  }
};

// Eliminar un evento
exports.deleteEvento = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  
  const { id } = req.params;

  try {
    const result = await EventoModel.deleteById(id);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Evento no encontrado.' });
    }
    res.json({ success: true, message: 'Evento eliminado con éxito.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Error del servidor al eliminar el evento.' });
  }
};
