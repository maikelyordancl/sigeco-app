const { validationResult } = require('express-validator');
const Campana = require('../models/campanaModel');
const SubeventoModel = require('../models/subeventoModel');
const InscripcionModel = require('../models/inscripcionModel');

/**
 * Obtiene todas las campanas (principal y de subeventos) de un evento específico.
 */
exports.obtenerCampanasPorEvento = async (req, res) => {
    const { id_evento } = req.params;

    try {
        const resultado = await Campana.findByEventoId(id_evento);
        if (!resultado) {
            return res.status(404).json({ success: false, error: 'No se encontró el evento o no tiene campañas.' });
        }
        res.json({ success: true, data: resultado });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error del servidor al obtener las campanas.' });
    }
};

/**
 * Obtiene los detalles de una única campana.
 */
exports.obtenerDetalleCampana = async (req, res) => {
    const { id_campana } = req.params;

    try {
        const campana = await Campana.findById(id_campana);
        if (!campana) {
            return res.status(404).json({ success: false, error: 'Campana no encontrada.' });
        }
        res.json({ success: true, data: campana });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error del servidor al obtener la campana.' });
    }
};

/**
 * Crea una nueva campana para un subevento (Sub-Campana).
 */
exports.crearSubCampana = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    // AÑADIDO: id_plantilla y fecha_personalizada extraídos del body
    const { id_evento, id_subevento, nombre, url_amigable, id_plantilla = 1, fecha_personalizada } = req.body;

    try {
        const subevento = await SubeventoModel.findById(id_subevento);
        if (!subevento || subevento.id_evento !== parseInt(id_evento, 10)) {
            return res.status(404).json({ success: false, error: 'Subevento no encontrado o no pertenece al evento especificado.' });
        }

        const campanaData = {
            id_evento,
            id_subevento,
            nombre: nombre || `Campana - ${subevento.nombre}`,
            estado: 'Borrador',
            url_amigable: url_amigable,
            id_plantilla: id_plantilla,
            fecha_personalizada: fecha_personalizada // AÑADIDO: Se pasa el nuevo campo
        };

        const nuevaCampana = await Campana.create(campanaData);
        res.status(201).json({ success: true, data: nuevaCampana });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, error: 'La URL amigable (slug) ya está en uso. Por favor, elige otra.' });
        }
        console.error(error);
        res.status(500).json({ success: false, error: 'Error del servidor al crear la sub-campana.' });
    }
};


/**
 * Actualiza los datos de una campana existente.
 */
exports.actualizarCampana = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id_campana } = req.params;
    // campanaData ahora puede incluir fecha_personalizada
    const campanaData = req.body;

    try {
        const result = await Campana.updateById(id_campana, campanaData);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Campana no encontrada.' });
        }
        res.json({ success: true, message: 'Campana actualizada con éxito.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error del servidor al actualizar la campana.' });
    }
};

/**
 * Elimina una campana.
 */
exports.eliminarCampana = async (req, res) => {
    const { id_campana } = req.params;

    try {
        const result = await Campana.deleteById(id_campana);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Campana no encontrada.' });
        }
        res.json({ success: true, message: 'Campana eliminada con éxito.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error del servidor al eliminar la campana.' });
    }
};


// --- INICIO DE LA NUEVA LÓGICA ---
/**
 * Convoca contactos desde bases de datos a una campaña.
 */
exports.convocarContactos = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id_campana } = req.params;
    const { bases_origen } = req.body;

    try {
        const resultado = await InscripcionModel.convocarDesdeBase(id_campana, bases_origen);
        res.status(201).json(resultado);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

exports.guardarLanding = async (req, res) => {
    const { id_campana } = req.params;
    const { landing_page_json } = req.body;

    try {
        const result = await Campana.updateLanding(id_campana, landing_page_json);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Campana no encontrada.' });
        }
        res.json({ success: true, message: 'Landing page guardada con éxito.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Error del servidor al guardar la landing page.' });
    }
};

exports.getAsistentesConCampos = async (req, res) => {
  try {
    // 1. Validar y obtener los parámetros de la petición
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id_campana } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50; // Sincronizado con el frontend
    const offset = (page - 1) * limit;

    // 2. Llamar a la función del modelo que ya hace todo el trabajo
    const paginatedData = await InscripcionModel.findWithCustomFieldsByCampanaId(id_campana, limit, offset);

    // 3. Enviar la respuesta completa directamente al frontend
    res.json(paginatedData);

  } catch (error) {
    console.error('Error fetching asistentes con campos personalizados:', error);
    res.status(500).json({ message: 'Error al obtener los asistentes.' });
  }
};

exports.updateAsistenteStatus = async (req, res) => {
    const { id_inscripcion } = req.params;
    const { estado_asistencia } = req.body;
    try {
        const success = await InscripcionModel.updateStatus(id_inscripcion, estado_asistencia);
        if (success) {
            res.json({ message: 'Estado actualizado correctamente.' });
        } else {
            res.status(404).json({ message: 'Inscripción no encontrada.' });
        }
    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ message: 'Error al actualizar el estado.' });
    }
};

exports.updateAsistenteNota = async (req, res) => {
    const { id_inscripcion } = req.params;
    const { nota } = req.body;
    try {
        const success = await InscripcionModel.updateNota(id_inscripcion, nota);
        if (success) {
            res.json({ message: 'Nota actualizada correctamente.' });
        } else {
            res.status(404).json({ message: 'Inscripción no encontrada.' });
        }
    } catch (error) {
        console.error('Error updating note:', error);
        res.status(500).json({ message: 'Error al actualizar la nota.' });
    }
};

exports.updateAsistenteRespuestas = async (req, res) => {
    const { id_inscripcion } = req.params;
    const { respuestas } = req.body; 

    if (!Array.isArray(respuestas)) {
        return res.status(400).json({ message: 'El cuerpo de la petición debe contener un array de "respuestas".' });
    }

    try {
        await InscripcionModel.updateOrInsertRespuestas(id_inscripcion, respuestas);
        res.json({ success: true, message: 'Respuestas actualizadas correctamente.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al actualizar las respuestas.' });
    }
};

exports.updateAsistenteCompleto = async (req, res) => {
  const { id_inscripcion } = req.params;
  const { estado_asistencia, nota, respuestas, ...datosContacto } = req.body;

  try {
    const success = await InscripcionModel.updateAsistenteCompleto(
      id_inscripcion,
      estado_asistencia,
      nota,
      respuestas,
      datosContacto
    );
    if (success) {
      res.json({ success: true, message: 'Asistente actualizado correctamente.' });
    } else {
      res.status(404).json({ success: false, message: 'Inscripción no encontrada.' });
    }
  } catch (error) {
    console.error('Error al actualizar asistente:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};

/**
 * Elimina un asistente (inscripción) de una campaña.
 */
exports.deleteAsistente = async (req, res) => {
  const { id_inscripcion } = req.params;

  try {
    const success = await InscripcionModel.deleteById(id_inscripcion);

    if (!success) {
      return res.status(404).json({ success: false, message: 'Inscripción no encontrada.' });
    }

    res.json({ success: true, message: 'Asistente eliminado correctamente.' });
  } catch (error) {
    console.error('Error al eliminar asistente:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor.' });
  }
};