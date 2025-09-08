const axios = require('axios');
const Campana = require('../models/campanaModel');

// --- Plantilla Maestra Simplificada ---
// Se elimina. El HTML completo ahora viene desde `email_body`.

const formatFechaES = (dateInput) => {
    const fecha = new Date(dateInput);
    return fecha.toLocaleDateString('es-CL', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
};

exports.sendConfirmationEmail = async (toEmail, toName, eventData, id_campana) => {
    const { event_name, event_start_date, event_location } = eventData;

    try {
        const campana = await Campana.findById(id_campana);
        if (!campana) {
            console.error(`Campaña con ID: ${id_campana} no encontrada. No se pudo enviar el correo.`);
            return;
        }

        // 1. Usar directamente los datos de la campaña. Ya no necesitamos valores por defecto complejos.
        let subject = campana.email_subject || `Confirmación Inscripción ${event_name}`;
        let finalHtml = campana.email_body; // El HTML completo ahora está en email_body

        if (!finalHtml) {
            console.error(`Campaña con ID: ${id_campana} no tiene una plantilla de correo (email_body) configurada.`);
            return;
        }
        
        // 2. Reemplazar las variables de datos (placeholders) en el HTML completo
        const fechaFormateada = formatFechaES(event_start_date);
        finalHtml = finalHtml.replace(/{{nombre_asistente}}/g, toName || 'participante');
        finalHtml = finalHtml.replace(/{{email_asistente}}/g, toEmail);
        finalHtml = finalHtml.replace(/{{nombre_evento}}/g, event_name);
        finalHtml = finalHtml.replace(/{{fecha_evento}}/g, fechaFormateada);
        finalHtml = finalHtml.replace(/{{lugar_evento}}/g, event_location);
        
        // 3. Enviar el correo final a través de Brevo
        const url = 'https://api.brevo.com/v3/smtp/email';
        const apiKey = process.env.BREVO_API_KEY;

        const data = {
            sender: { name: 'Eventos Pais', email: 'noreply@eventospais.cl' },
            to: [{ email: toEmail, name: toName || '' }],
            subject: subject,
            htmlContent: finalHtml,
        };

        const headers = {
            'accept': 'application/json',
            'api-key': apiKey,
            'content-type': 'application/json',
        };
        
        await axios.post(url, data, { headers: headers });
        console.log(`Correo de confirmación enviado a ${toEmail} para la campaña ${id_campana}.`);

    } catch (error) {
        console.error("❌ Error en el proceso de envío de correo:", error.message);
        if (error.response) {
            console.error("Respuesta de Brevo:", error.response.data);
        }
    }
};