const { validationResult } = require('express-validator');
const CampanaModel = require('../models/campanaModel'); // Usaremos el modelo de campañas
const InscripcionModel = require('../models/inscripcionModel');
const ContactoModel = require('../models/contactoModel');

/**
 * Obtiene los datos públicos de una campaña para mostrar en la landing page.
 */
exports.getDatosPublicosCampana = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { slug } = req.params;

    try {
        const datos = await CampanaModel.findPublicDataBySlug(slug);

        if (!datos) {
            return res.status(404).json({ success: false, message: 'Campaña no encontrada.' });
        }

        // Si la campaña no está activa, no la mostramos
        if (datos.campana.estado !== 'Activa') {
            return res.status(403).json({ success: false, message: 'Esta campaña no está activa actualmente.' });
        }

        res.json({ success: true, data: datos });

    } catch (error) {
        console.error('Error al obtener datos públicos de la campaña:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
};

/**
 * Crea una nueva inscripción desde un formulario público.
 * Determina el estado de asistencia ('Invitado' o 'Registrado')
 * basándose en las reglas del sub-evento asociado.
 */
exports.crearInscripcionPublica = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id_campana, nombre, apellido, email, telefono, rut, pais, empresa, actividad } = req.body;

    try {
        // 1. Buscar o crear el contacto
        let contacto = await ContactoModel.findByEmail(email);

        if (!contacto) {
            // Si el contacto no existe, lo creamos.
            // Asumimos que no tenemos 'profesion' ni 'recibir_mail' desde este formulario.
            const nuevoContactoData = { nombre, apellido, email, telefono, rut, pais, empresa, actividad, profesion: null, recibir_mail: true };
            const result = await ContactoModel.create(nuevoContactoData);
            // Construimos el objeto contacto para tener el ID
            contacto = { id_contacto: result.id_contacto, ...nuevoContactoData };
        }
        
        const id_contacto = contacto.id_contacto;

        // 2. Verificar si ya existe una inscripción para este contacto en esta campaña
        const inscripcionExistente = await InscripcionModel.findByCampanaAndContacto(id_campana, id_contacto);
        if (inscripcionExistente) {
            // Si ya existe, no creamos una nueva, pero podríamos actualizarla si es necesario.
            // Por ahora, devolvemos un error de conflicto.
            return res.status(409).json({ success: false, message: 'Este email ya está inscrito en esta campaña.' });
        }
        
        // --- INICIO DE LA LÓGICA CORREGIDA ---
        // 3. Obtener las reglas de la campaña para decidir el estado
        const campanaRules = await CampanaModel.findRulesById(id_campana);
        if (!campanaRules) {
            return res.status(404).json({ success: false, message: 'La campaña especificada no existe.' });
        }

        // 4. Determinar el 'estado_asistencia' según la regla del sub-evento
        // Si el sub-evento requiere registro (obligatorio_registro = 1), el estado es 'Registrado'.
        // Si no (obligatorio_registro = 0), el estado por defecto es 'Invitado'.
        const estado_asistencia = campanaRules.obligatorio_registro ? 'Registrado' : 'Invitado';
        // --- FIN DE LA LÓGICA CORREGIDA ---

        // 5. Crear la inscripción con el estado correcto
        const nuevaInscripcionData = {
            id_campana,
            id_contacto,
            estado_asistencia: estado_asistencia, // Se usa el estado determinado por la regla
            estado_pago: 'No Aplica' // Este flujo es para inscripciones gratuitas
        };

        const inscripcion = await InscripcionModel.create(nuevaInscripcionData);

        res.status(201).json({ success: true, message: 'Inscripción realizada con éxito.', data: inscripcion });

    } catch (error) {
        console.error('Error al crear inscripción pública:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
};
