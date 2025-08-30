const { validationResult } = require('express-validator');
const AcreditacionModel = require('../models/acreditacionModel');

exports.getCampanasParaAcreditar = async (req, res) => {
    try {
        const eventos = await AcreditacionModel.findEventosConCampanasAcreditables();
        res.json({ success: true, data: eventos });
    } catch (error) {
        console.error('Error al obtener campañas para acreditar:', error);
        res.status(500).json({ success: false, error: 'Error del servidor.' });
    }
};

exports.getAsistentesAcreditacion = async (req, res) => {
    const { id_campana } = req.params;
    try {
        const asistentes = await AcreditacionModel.findAcreditacionAsistentesPorCampana(id_campana);
        res.json({ success: true, data: asistentes });
    } catch (error) {
        console.error(`Error al obtener asistentes para la campaña ${id_campana}:`, error);
        res.status(500).json({ success: false, error: 'Error del servidor.' });
    }
};

exports.getAsistentes = async (req, res) => {
    const { id_campana } = req.params;
    try {
        const asistentes = await AcreditacionModel.findAsistentesPorCampana(id_campana);
        res.json({ success: true, data: asistentes });
    } catch (error) {
        console.error(`Error al obtener asistentes para la campaña ${id_campana}:`, error);
        res.status(500).json({ success: false, error: 'Error del servidor.' });
    }
};

exports.updateAsistencia = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id_inscripcion } = req.params;
    const { nuevo_estado } = req.body;

    try {
        const result = await AcreditacionModel.updateEstadoAsistencia(id_inscripcion, nuevo_estado);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, error: 'Inscripción no encontrada.' });
        }
        res.json({ success: true, message: 'Estado actualizado correctamente.' });
    } catch (error) {
        console.error(`Error al actualizar estado para la inscripción ${id_inscripcion}:`, error);
        res.status(500).json({ success: false, error: 'Error del servidor.' });
    }
};

exports.registrarEnPuerta = async (req, res) => {
    // Validaciones de express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            success: false, 
            errors: errors.array() 
        });
    }

    try {
        // --- Datos principales ---
        const { id_campana } = req.params;
        const {
            id_tipo_entrada,
            nombre,
            email,
            telefono,
            rut,
            empresa,
            actividad,
            profesion,
            comuna,
            pais,
            respuestas,
            acreditar_ahora
        } = req.body;

        // Validación mínima de email
        if (!email || email.trim() === '') {
            return res.status(400).json({ 
                success: false, 
                message: 'El campo email es obligatorio.' 
            });
        }

        // Datos de contacto
        const datosContacto = {
            nombre: nombre?.trim() || null,
            email: email.trim().toLowerCase(),
            telefono: telefono?.trim() || null,
            rut: rut?.trim() || null,
            empresa: empresa?.trim() || null,
            actividad: actividad?.trim() || null,
            profesion: profesion?.trim() || null,
            comuna: comuna?.trim() || null,
            pais: pais?.trim() || null
        };

        // Estado de asistencia
        const estado_asistencia = acreditar_ahora ? 'Asistió' : 'Confirmado';
        const registrado_en_puerta = acreditar_ahora ? 1 : 0;

        // Llamada al modelo
        const resultado = await AcreditacionModel.registrarEnPuerta(
            Number(id_campana),
            id_tipo_entrada || null,
            datosContacto,
            Array.isArray(respuestas) ? respuestas : [],
            estado_asistencia,
            registrado_en_puerta
        );

        return res.status(201).json({
            success: true,
            message: 'Asistente registrado correctamente.',
            data: resultado
        });

    } catch (error) {
        console.error('Error en el controlador al registrar en puerta:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Error interno del servidor.'
        });
    }
};
