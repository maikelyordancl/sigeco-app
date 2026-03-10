const { validationResult } = require('express-validator');
const CampanaModel = require('../models/campanaModel');
const InscripcionModel = require('../models/inscripcionModel');
const ContactoModel = require('../models/contactoModel');
const PagoModel = require('../models/pagoModel');
const FlowService = require('../services/flowService');
const FormularioModel = require('../models/formularioModel'); // Para campos personalizados
const InscripcionPagoModel = require('../models/inscripcionPagoModel');
const emailService = require('../services/emailService'); // Importar el nuevo servicio de correo

// Mapea el estado numérico de Flow al estado de la tabla pagos
const mapFlowPagoStatus = (flowStatus) => {
    switch (flowStatus) {
        case 1: return 'Pendiente';
        case 2: return 'Pagado';
        case 3: return 'Fallido';
        case 4: return 'Anulado';
        default: return 'Fallido';
    }
};

const enviarCorreoSiPagoCompleto = async (id_inscripcion) => {
    const inscripcion = await InscripcionModel.findById(id_inscripcion);

    if (!inscripcion || inscripcion.estado_pago !== 'Pagado') {
        return;
    }

    const contacto = await ContactoModel.findById(inscripcion.id_contacto);
    const campanaData = await CampanaModel.findPublicDataById(inscripcion.id_campana);

    if (!contacto || !campanaData || !campanaData.campana) {
        return;
    }

    const { evento_nombre, fecha_inicio, lugar } = campanaData.campana;

    const eventData = {
        event_name: evento_nombre,
        event_start_date: fecha_inicio,
        event_location: lugar
    };

    await emailService.sendConfirmationEmail(
        contacto.email,
        contacto.nombre,
        eventData,
        inscripcion.id_campana,
        inscripcion.id_inscripcion
    );
};

const aplicarResultadoPago = async (pago, estadoPagoFlow) => {
    await PagoModel.updateById(pago.id_pago, { estado: estadoPagoFlow });

    await InscripcionPagoModel.upsertMovimientoFlowDesdePago({
        id_pago: pago.id_pago,
        id_inscripcion: pago.id_inscripcion,
        monto: pago.monto,
        estado: estadoPagoFlow,
        observacion: 'Resultado sincronizado desde Flow'
    });

    const recalculo = await InscripcionPagoModel.recalculateInscripcionPayment(pago.id_inscripcion);

    if (recalculo?.estadoPago === 'Pagado') {
        await enviarCorreoSiPagoCompleto(pago.id_inscripcion);
    }

    return {
        synced: true,
        ...recalculo
    };
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

// --- INICIO DE NUEVA FUNCIÓN ---
/**
 * Obtiene los datos de un contacto por email y slug de campaña.
 * Se usa para auto-rellenar el formulario público si el email viene en la URL.
 */
exports.getContactoPorEmail = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    // Los parámetros vienen de la validación en la ruta
    const { email, slug } = req.query;

    try {
        // 1. Llamar al modelo para buscar al contacto
        const contacto = await ContactoModel.findByEmailAndCampanaSlug(email, slug);

        // 2. Devolver el resultado
        if (!contacto) {
            // No es un error, simplemente no se encontró
            return res.json({ success: true, data: null });
        }

        // Devolver el contacto encontrado
        res.json({ success: true, data: contacto });

    } catch (error) {
        console.error('Error en getContactoPorEmail:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
};
// --- FIN DE NUEVA FUNCIÓN --- 

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
    const registrarSinPago =
        req.body.registrar_sin_pago === true ||
        req.body.registrar_sin_pago === 'true' ||
        req.body.registrar_sin_pago === '1' ||
        req.body.registrar_sin_pago === 1;

    if (!email) {
        return res.status(400).json({ success: false, message: 'El campo "Email" es obligatorio.' });
    }

    if (!id_campana) {
        return res.status(400).json({ success: false, message: 'El campo "id_campana" es obligatorio.' });
    }

    try {
        const campana = await CampanaModel.findById(id_campana);
        if (!campana) {
            return res.status(404).json({ success: false, message: 'Campaña no válida.' });
        }

        const campanaRules = await CampanaModel.findRulesById(id_campana);
        if (!campanaRules) {
            return res.status(404).json({ success: false, message: 'No se pudieron obtener las reglas de la campaña.' });
        }

        const permiteRegistroSinPago =
            Boolean(campanaRules.obligatorio_pago) &&
            Boolean(campana.registro_sin_pago_inmediato);

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

            if (campo.tipo_campo === 'ARCHIVO') {
                const file = req.files && req.files.find(f => f.fieldname === key);
                if (file) {
                    value = `/uploads/inscripciones/${file.filename}`;
                } else if (campo.es_obligatorio) {
                    return res.status(400).json({
                        success: false,
                        message: `El archivo para "${campo.etiqueta}" es obligatorio.`
                    });
                }
            }

            if (campo.tipo_campo === 'CASILLAS' && typeof value === 'string') {
                try {
                    const parsed = JSON.parse(value);
                    if (Array.isArray(parsed)) value = parsed;
                    else if (parsed == null) value = [];
                    else value = [String(parsed)];
                } catch (e) {
                    console.warn(`Valor CASILLAS no es JSON válido para "${key}", usando fallback. Valor recibido:`, value);
                    value = value ? [String(value)] : [];
                }
            }

            const isArray = Array.isArray(value);
            const isEmpty =
                value === undefined ||
                value === null ||
                (typeof value === 'string' && value.trim() === '') ||
                (isArray && value.length === 0);

            if (isEmpty) continue;

            if (campo.es_de_sistema) {
                datosContacto[key] = isArray ? value.join(', ') : value;
            } else {
                respuestasPersonalizadas.push({
                    id_campo: campo.id_campo,
                    valor: value
                });
            }
        }

        // Buscar primero si el contacto ya existe
        let contacto = await ContactoModel.findByEmail(email);

        // Buscar si ya tiene inscripción previa en esta campaña (ej: Invitado importado)
        let inscripcionExistente = contacto
            ? await InscripcionModel.findByCampanaAndContacto(id_campana, contacto.id_contacto)
            : null;

        // Blindaje backend:
        // Si la campaña NO permite inscripción pública, solo puede avanzar
        // quien ya tenga una inscripción previa en la campaña.
        if (campana.inscripcion_libre === 0 && !inscripcionExistente) {
            return res.status(403).json({
                success: false,
                message: 'Este es un evento por invitación y tu correo no se encuentra en la lista de asistentes.'
            });
        }

        // Ahora sí, crear o actualizar contacto
        if (contacto) {
            await ContactoModel.updateById(contacto.id_contacto, datosContacto);
        } else {
            const nuevoContacto = await ContactoModel.create({
                ...datosContacto,
                email,
                recibir_mail: true
            });
            contacto = { id_contacto: nuevoContacto.id_contacto };
        }

        let inscripcion = await InscripcionModel.findByCampanaAndContacto(id_campana, contacto.id_contacto);
        const estadoPagoObjetivo = campanaRules.obligatorio_pago ? 'Pendiente' : 'No Aplica';

        if (inscripcion) {
            if (inscripcion.estado_pago === 'Pagado') {
                return res.status(409).json({
                    success: false,
                    message: 'Ya tienes una entrada válida para este evento.'
                });
            }

            // Al completar el formulario, queda registrado siempre.
            // Si requiere pago, queda registrado + pago pendiente.
            await InscripcionModel.update(inscripcion.id_inscripcion, {
                id_tipo_entrada: id_tipo_entrada || null,
                estado_asistencia: 'Registrado',
                estado_pago: estadoPagoObjetivo
            });

            // Refrescamos el objeto local
            inscripcion = {
                ...inscripcion,
                id_tipo_entrada: id_tipo_entrada || null,
                estado_asistencia: 'Registrado',
                estado_pago: estadoPagoObjetivo
            };
        } else {
            inscripcion = await InscripcionModel.create({
                id_campana,
                id_contacto: contacto.id_contacto,
                id_tipo_entrada: id_tipo_entrada || null,
                estado_asistencia: 'Registrado',
                estado_pago: estadoPagoObjetivo,
            });
        }

        if (respuestasPersonalizadas.length > 0) {
            await FormularioModel.saveRespuestas(inscripcion.id_inscripcion, respuestasPersonalizadas);
        }

        // Si requiere pago, ya quedó Registrado/Pendiente. Dependiendo de la campaña,
        // puede pagar ahora o dejar el pago pendiente para retomarlo luego.
        if (campanaRules.obligatorio_pago) {
            if (registrarSinPago && permiteRegistroSinPago) {
                const resumePaymentUrl = campana.url_amigable
                    ? `/c/${campana.url_amigable}?email=${encodeURIComponent(email)}`
                    : null;

                return res.status(200).json({
                    success: true,
                    message: 'Inscripción registrada correctamente. El pago quedó pendiente para retomarlo más tarde.',
                    data: {
                        pendingPayment: true,
                        resumePaymentUrl,
                    },
                });
            }

            await PagoModel.anularPagosAnteriores(inscripcion.id_inscripcion);

            const ordenCompra = `sigeco-insc-${inscripcion.id_inscripcion}-${Date.now()}`;
            const nuevoPago = await PagoModel.create({
                id_inscripcion: inscripcion.id_inscripcion,
                monto: ticket.precio,
                orden_compra: ordenCompra,
            });

            await InscripcionPagoModel.upsertMovimientoFlowDesdePago({
                id_pago: nuevoPago.id_pago,
                id_inscripcion: inscripcion.id_inscripcion,
                monto: ticket.precio,
                estado: 'Pendiente',
                observacion: 'Pago generado desde inscripción pública',
            });

            try {
                const flowResponse = await FlowService.crearOrdenDePago({
                    orden_compra: ordenCompra,
                    monto: ticket.precio,
                    subject: `Entrada: ${ticket.nombre}`,
                    email: email,
                });

                await PagoModel.updateById(nuevoPago.id_pago, { token_flow: flowResponse.token });

                return res.status(200).json({
                    success: true,
                    redirectUrl: flowResponse.redirectUrl
                });
            } catch (flowError) {
                console.error('Error al crear orden de pago en Flow:', flowError);
                const errorMsg = flowError.message || 'No se pudo crear la orden de pago.';

                await PagoModel.updateById(nuevoPago.id_pago, {
                    estado: 'Fallido',
                    detalle_error: errorMsg
                });

                await InscripcionPagoModel.syncEstadoFromPago(nuevoPago.id_pago, 'Fallido');

                return res.status(500).json({ success: false, message: errorMsg });
            }
        }

        // Flujo gratuito: ya quedó Registrado y se puede enviar confirmación
        const campanaData = await CampanaModel.findPublicDataById(id_campana);
        if (campanaData && campanaData.campana) {
            const { evento_nombre, fecha_inicio, fecha_fin, lugar } = campanaData.campana;
            const eventData = {
                event_name: evento_nombre,
                event_start_date: fecha_inicio,
                event_end_date: fecha_fin,
                event_location: lugar
            };

            await emailService.sendConfirmationEmail(
                email,
                datosContacto.nombre,
                eventData,
                id_campana,
                inscripcion.id_inscripcion
            );
        }

        return res.status(200).json({
            success: true,
            message: 'Inscripción confirmada correctamente.'
        });

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
        const estadoPagoFlow = mapFlowPagoStatus(flowStatusResult.status);
        const pago = await PagoModel.findByToken(token);

        if (pago && pago.estado !== estadoPagoFlow) {
            await aplicarResultadoPago(pago, estadoPagoFlow);
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
        const estadoPagoFlow = mapFlowPagoStatus(flowStatusResult.status);
        const pago = await PagoModel.findByToken(token);

        if (pago && pago.estado !== estadoPagoFlow) {
            await aplicarResultadoPago(pago, estadoPagoFlow);
            console.log(`Webhook: Pago ${pago.id_pago} actualizado a estado: ${estadoPagoFlow}`);
        }

        res.status(200).send("Confirmación recibida");
    } catch (error) {
        console.error("Error en webhook de Flow:", error);
        res.status(500).send("Error interno");
    }
};