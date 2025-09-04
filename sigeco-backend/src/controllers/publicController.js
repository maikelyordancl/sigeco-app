const { validationResult } = require('express-validator');
const CampanaModel = require('../models/campanaModel');
const InscripcionModel = require('../models/inscripcionModel');
const ContactoModel = require('../models/contactoModel');
const PagoModel = require('../models/pagoModel');
const FlowService = require('../services/flowService');
const FormularioModel = require('../models/formularioModel'); // Para campos personalizados
const emailService = require('../services/emailService'); // Importar el nuevo servicio de correo

// Mapea el estado numérico de Flow a nuestro estado de texto
const mapFlowStatus = (flowStatus) => {
    switch (flowStatus) {
        case 1: return 'Pendiente';
        case 2: return 'Pagado';
        case 3: return 'Fallido';
        case 4: return 'Anulado';
        default: return 'Fallido';
    }
};

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
 * Verifica si un contacto existe por su email.
 */
exports.verificarContactoPorEmail = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, id_campana } = req.body;

    try {
        // --- INICIO DE LA LÓGICA MODIFICADA ---
        const campana = await CampanaModel.findById(id_campana);
        if (!campana) {
            return res.status(404).json({ success: false, message: 'Campaña no encontrada.' });
        }

        const contacto = await ContactoModel.findByEmail(email);
        let inscripcion = contacto ? await InscripcionModel.findByCampanaAndContacto(id_campana, contacto.id_contacto) : null;

        // Si la inscripción NO es libre, el usuario debe tener una inscripción previa.
        if (campana.inscripcion_libre === 0 && !inscripcion) {
            return res.status(403).json({
                success: false,
                message: 'Este es un evento por invitación y tu correo no se encuentra en la lista de asistentes.'
            });
        }

        // Si la inscripción es libre o si no es libre pero el usuario ya tiene una inscripción, se procede.
        res.json({ success: true, data: { contacto, inscripcion } });
        // --- FIN DE LA LÓGICA MODIFICADA ---

    } catch (error) {
        console.error('Error al verificar contacto:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
};

/**
 * Gestiona una inscripción pública y crea una orden de pago si es necesario.
 * Ahora se centra en el email para crear o actualizar el contacto.
 */
exports.crearInscripcionPublica = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { id_campana, id_tipo_entrada, email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: 'El campo "Email" es obligatorio.' });
    }

    if (!id_campana) {
        return res.status(400).json({ success: false, message: 'El campo "id_campana" es obligatorio.' });
    }

    try {
        const campanaRules = await CampanaModel.findRulesById(id_campana);
        if (!campanaRules) {
            return res.status(404).json({ success: false, message: 'Campaña no válida.' });
        }

        const ticket = campanaRules.obligatorio_pago ? await PagoModel.findTicketById(id_tipo_entrada) : null;
        if (campanaRules.obligatorio_pago && !ticket) {
            return res.status(404).json({ success: false, message: 'El tipo de entrada seleccionado no es válido.' });
        }

        const formConfig = (await FormularioModel.findByCampanaId(id_campana)) || [];
        const datosContacto = {};
        const respuestasPersonalizadas = [];

        for (const campo of formConfig) {
            if (!campo.es_visible) continue;

            const key = campo.nombre_interno;
            let value = req.body[key];

            // Manejo de archivo
            if (campo.tipo_campo === 'ARCHIVO') {
                const file = req.files && req.files.find(f => f.fieldname === key);
                if (file) {
                    value = `/uploads/inscripciones/${file.filename}`;
                } else if (campo.es_obligatorio) {
                    return res.status(400).json({ success: false, message: `El archivo para "${campo.etiqueta}" es obligatorio.` });
                }
            }

            // Opción A: CASILLAS viene como JSON string desde el front -> parsear a array UNA sola vez
            if (campo.tipo_campo === 'CASILLAS' && typeof value === 'string') {
                try {
                    const parsed = JSON.parse(value);
                    if (Array.isArray(parsed)) {
                        value = parsed;
                    } else if (parsed == null) {
                        value = [];
                    } else {
                        // Fallback defensivo: si no es array, lo envolvemos como array único
                        value = [String(parsed)];
                    }
                } catch (e) {
                    console.warn(`Valor CASILLAS no es JSON válido para "${key}", usando fallback. Valor recibido:`, value);
                    value = value ? [String(value)] : [];
                }
            }

            // Normalizar: ignorar vacíos; para arrays, ignorar si están vacíos
            const isArray = Array.isArray(value);
            const isEmpty =
                value === undefined ||
                value === null ||
                (typeof value === 'string' && value.trim() === '') ||
                (isArray && value.length === 0);

            if (isEmpty) continue;

            if (campo.es_de_sistema) {
                // Campos de sistema deben ser escalares; CASILLAS no se espera aquí
                datosContacto[key] = isArray ? value.join(', ') : value; // o simplemente value si deseas guardar tal cual
            } else {
                // NO forzar String aquí; dejamos el tipo real para que saveRespuestas decida cómo persistir
                respuestasPersonalizadas.push({
                    id_campo: campo.id_campo,
                    valor: value
                });
            }
        }

        // Contacto por email
        let contacto = await ContactoModel.findByEmail(email);

        if (contacto) {
            await ContactoModel.updateById(contacto.id_contacto, datosContacto);
        } else {
            const nuevoContacto = await ContactoModel.create({ ...datosContacto, email, recibir_mail: true });
            contacto = { id_contacto: nuevoContacto.id_contacto };
        }

        // Inscripción
        let inscripcion = await InscripcionModel.findByCampanaAndContacto(id_campana, contacto.id_contacto);

        if (inscripcion) {
            if (inscripcion.estado_pago === 'Pagado') {
                return res.status(409).json({ success: false, message: 'Ya tienes una entrada válida para este evento.' });
            }
            if (inscripcion.estado_pago === 'Fallido' || inscripcion.estado_pago === 'Pendiente') {
                await InscripcionModel.update(inscripcion.id_inscripcion, { id_tipo_entrada: id_tipo_entrada || null });
                await PagoModel.anularPagosAnteriores(inscripcion.id_inscripcion);
            }
        } else {
            inscripcion = await InscripcionModel.create({
                id_campana,
                id_contacto: contacto.id_contacto,
                id_tipo_entrada: id_tipo_entrada || null,
                estado_asistencia: 'Registrado',
                estado_pago: campanaRules.obligatorio_pago ? 'Pendiente' : 'No Aplica',
            });
        }

        // Guardar respuestas personalizadas (con nueva lógica de persistencia)
        if (respuestasPersonalizadas.length > 0) {
            await FormularioModel.saveRespuestas(inscripcion.id_inscripcion, respuestasPersonalizadas);
        }

        // Flujo de pago (si corresponde)
        if (campanaRules.obligatorio_pago) {
            const ordenCompra = `sigeco-insc-${inscripcion.id_inscripcion}-${Date.now()}`;
            const nuevoPago = await PagoModel.create({
                id_inscripcion: inscripcion.id_inscripcion,
                monto: ticket.precio,
                orden_compra: ordenCompra,
            });

            try {
                const flowResponse = await FlowService.crearOrdenDePago({
                    orden_compra: ordenCompra,
                    monto: ticket.precio,
                    subject: `Entrada: ${ticket.nombre}`,
                    email: email,
                });
                await PagoModel.updateById(nuevoPago.id_pago, { token_flow: flowResponse.token });
                return res.status(200).json({ success: true, redirectUrl: flowResponse.redirectUrl });
            } catch (flowError) {
                console.error('Error al crear orden de pago en Flow:', flowError);
                let errorMsg = flowError.message || 'No se pudo crear la orden de pago.';
                return res.status(500).json({ success: false, message: errorMsg });
            }
        }

        // Confirmación sin pago
        await InscripcionModel.update(inscripcion.id_inscripcion, { estado_asistencia: 'Confirmado' });

        // Envío de correo (sin cambios de lógica aquí)
        const campanaData = await CampanaModel.findPublicDataById(id_campana);
        if (campanaData && campanaData.campana) {
            const { evento_nombre, fecha_inicio, fecha_fin, lugar } = campanaData.campana;
            const eventData = {
                event_name: evento_nombre,
                event_start_date: fecha_inicio,
                event_end_date: fecha_fin,
                event_location: lugar
            };

            if (campanaRules.obligatorio_pago && campanaRules.estado_pago === 'Pagado') {
                await emailService.sendConfirmationEmail(email, datosContacto.nombre, eventData);
            } else if (!campanaRules.obligatorio_pago) {
                await emailService.sendConfirmationEmail(email, datosContacto.nombre, eventData);
            }
        }

        return res.status(200).json({ success: true, message: 'Inscripción confirmada correctamente.' });

    } catch (error) {
        console.error('Error al procesar inscripción:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
};

/**
 * Obtiene los detalles del pago por token.
 */
exports.getPagoByToken = async (req, res) => {
    try {
        const { token } = req.params;

        const flowStatusResult = await FlowService.obtenerEstadoDelPago(token);
        const nuestroEstado = mapFlowStatus(flowStatusResult.status);

        const pago = await PagoModel.findByToken(token);
        if (pago && pago.estado !== nuestroEstado) {
            await PagoModel.updateById(pago.id_pago, { estado: nuestroEstado });
            await InscripcionModel.update(pago.id_inscripcion, { estado_pago: nuestroEstado });
        }

        const pagoDetails = await PagoModel.findByTokenWithDetails(token);
        if (!pagoDetails) {
            return res.status(404).json({ success: false, message: 'Pago no encontrado.' });
        }

        res.json({ success: true, data: pagoDetails });

    } catch (error) {
        console.error('Error al obtener detalles del pago:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
};

/**
 * Webhook de Flow para confirmar pagos
 */
exports.confirmarPagoFlow = async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).send("Token no proporcionado");
        }

        const flowStatusResult = await FlowService.obtenerEstadoDelPago(token);
        const nuestroEstado = mapFlowStatus(flowStatusResult.status);

        const pago = await PagoModel.findByToken(token);
        if (pago) {
            await PagoModel.updateById(pago.id_pago, { estado: nuestroEstado });
            await InscripcionModel.update(pago.id_inscripcion, { estado_pago: nuestroEstado });
            console.log(`Webhook: Pago ${pago.id_pago} actualizado a estado: ${nuestroEstado}`);
        }

        res.status(200).send("Confirmación recibida");

    } catch (error) {
        console.error("Error en webhook de Flow:", error);
        res.status(500).send("Error interno");
    }
};