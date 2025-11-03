const { validationResult } = require('express-validator');
const Campana = require('../models/campanaModel');
const SubeventoModel = require('../models/subeventoModel');
const InscripcionModel = require('../models/inscripcionModel');
const Formulario = require('../models/formularioModel');
const ExcelJS = require('exceljs');

// --- INICIO DE LA CORRECCIÓN (Imports añadidos) ---
const permissionModel = require('../models/permissionModel');
const pool = require('../config/db'); 
// --- FIN DE LA CORRECCIÓN ---


// --- INICIO DE LA CORRECCIÓN (Helpers de permisos) ---
// Helpers para verificar permisos
async function q(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

function getUserId(req) {
  const cand = (req.user && (req.user.id || req.user.userId || req.user.id_usuario || req.user.idUsuario));
  const n = parseInt(cand, 10);
  return Number.isFinite(n) ? n : null;
}

async function getEventIdByInscripcion(id_inscripcion) {
  const rows = await q(
    `SELECT c.id_evento
       FROM inscripciones i
       JOIN campanas c ON c.id_campana = i.id_campana
      WHERE i.id_inscripcion = ?
      LIMIT 1`,
    [id_inscripcion]
  );
  return rows[0]?.id_evento || null;
}
// --- FIN DE LA CORRECCIÓN ---


/**
 * Obtiene todas las campanas (principal y de subeventos) de un evento específico.
 */
exports.obtenerCampanasPorEvento = async (req, res) => {
    const { id_evento } = req.params;

    try {
        // (Error tipográfico corregido: findByEventoId)
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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id_campana } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = (page - 1) * limit;

    // --- INICIO DE LA MODIFICACIÓN ---
    // Leer los nuevos parámetros de la query
    const searchTerm = req.query.search || null;
    const estadoFiltro = req.query.estado || null;
    
    // Llamar a la función del modelo con los nuevos parámetros
    const paginatedData = await InscripcionModel.findWithCustomFieldsByCampanaId(id_campana, limit, offset, searchTerm, estadoFiltro);
    // --- FIN DE LA MODIFICACIÓN ---

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

exports.updateEmailTemplate = async (req, res) => {
    try {
        const { id_campana } = req.params;
        
        // (Había un error en tu copia, faltaba 'email_sender_name')
        const { emailSubject, emailBody, emailSettings, email_incluye_qr, email_sender_name } = req.body;

        const campanaData = {};
        if (emailSubject !== undefined) {
            campanaData.email_subject = emailSubject;
        }
        if (emailBody !== undefined) {
            campanaData.email_body = emailBody;
        }
        if (emailSettings !== undefined) {
            campanaData.email_settings = emailSettings; 
        }
        if (email_incluye_qr !== undefined) {
            campanaData.email_incluye_qr = Boolean(email_incluye_qr); 
        }
         if (email_sender_name !== undefined) {
            campanaData.email_sender_name = email_sender_name;
        }


        if (Object.keys(campanaData).length === 0) {
             return res.status(400).json({ success: false, message: 'No se proporcionaron datos para actualizar.' });
        }

        const result = await Campana.updateById(id_campana, campanaData); 

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Campaña no encontrada.' }); 
        }

        res.status(200).json({ success: true, message: 'Plantilla de correo actualizada exitosamente.' });
    } catch (error) {
        console.error('Error al actualizar la plantilla de correo:', error);
        res.status(500).json({ success: false, error: 'Error interno del servidor al actualizar la plantilla.' }); 
    }
};

exports.getListadoSimple = async (req, res) => {
    try {
        const campanas = await Campana.getListadoSimple();
        res.status(200).json(campanas);
    } catch (error) {
        console.error('Error al obtener el listado simple de campañas:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

exports.generarPlantillaImportacion = async (req, res) => {
    // Validación de parámetros de entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    try {
        const { id_campana } = req.params;
        
        const camposFormulario = await Formulario.getCamposByCampanaId(id_campana);

        if (camposFormulario.length === 0) {
            return res.status(404).json({ message: 'No se encontró configuración de formulario para este evento.' });
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Plantilla de Importación');

        worksheet.columns = camposFormulario.map(campo => {
            const width = ['nombre', 'email', 'empresa', 'profesion'].includes(campo.nombre_interno) ? 30 : 20;
            return {
                header: campo.etiqueta, 
                key: campo.nombre_interno, 
                width: width
            };
        });
        
        worksheet.getRow(1).font = { bold: true };

        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            'attachment; filename="plantilla_importacion_evento.xlsx"'
        );

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Error al generar la plantilla de importación:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

exports.importarInscripcionesDesdeExcel = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { id_campana } = req.params;
    const { contactos } = req.body;

    try {
        const resultado = await InscripcionModel.importarMasivamente(id_campana, contactos);
        res.status(201).json({ 
            success: true, 
            message: `Importación completada con éxito. Se procesaron ${resultado.totalProcesados} registros.`,
            ...resultado 
        });
    } catch (error) {
        console.error("Error en el controlador al importar inscripciones:", error);
        res.status(500).json({ success: false, error: error.message || "Error interno del servidor al procesar el archivo." });
    }
};

/**
 * Elimina un asistente (inscripción) de una campaña.
 * (VERSIÓN CORREGIDA CON VERIFICACIÓN DE PERMISOS)
 */
exports.deleteAsistente = async (req, res) => {
  const { id_inscripcion } = req.params;

  try {
    
    // --- INICIO DE LA CORRECCIÓN: Verificación de permisos ---
    const userId = getUserId(req);
    
    // Si no es Super Admin (definido en middleware authorize), verificar permisos
    if (req.isSuperAdmin !== true) {
        const eventId = await getEventIdByInscripcion(id_inscripcion);
        
        if (!eventId) {
            return res.status(404).json({ success: false, message: 'Inscripción no encontrada.' });
        }
        
        // Verificamos permiso de 'delete' en el módulo 'eventos'.
        // Si prefieres que el módulo se llame 'campanas', cambia 'eventos' aquí.
        const allowed = await permissionModel.isAllowedOnEvent(userId, eventId, 'eventos', 'delete');
        
        if (!allowed) {
            return res.status(403).json({ success: false, message: 'No tiene permisos para eliminar asistentes en este evento.' });
        }
    }
    // --- FIN DE LA CORRECCIÓN ---

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