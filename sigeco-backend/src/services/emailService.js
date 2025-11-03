// sigeco-backend/src/services/emailService.js

const axios = require('axios');
const Campana = require('../models/campanaModel');
// const qrcode = require('qrcode'); // <-- Ya no se necesita
// const fs = require('fs'); // <-- Ya no se necesita
// const path = require('path'); // <-- Ya no se necesita

const formatFechaES = (dateInput) => {
    const fecha = new Date(dateInput);
    return fecha.toLocaleString('es-CL', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
};

exports.sendConfirmationEmail = async (toEmail, toName, eventData, id_campana, id_inscripcion = null) => {
    const { event_name, event_start_date, event_location } = eventData;

    try {
        const campana = await Campana.findById(id_campana);
        if (!campana) {
            console.error(`Campaña con ID: ${id_campana} no encontrada.`);
            return;
        }

        let subject = campana.email_subject || `Confirmación Inscripción ${event_name}`;
        let finalHtml = campana.email_body;

        if (!finalHtml) {
            console.error(`Campaña con ID: ${id_campana} no tiene plantilla (email_body).`);
            return;
        }
        
        // --- INICIO DE LÓGICA QR (Modificada para API Externa) ---
        let qrHtmlContent = ''; 

        if (campana.email_incluye_qr === 1 && id_inscripcion) {
            try {
                // 1. Preparamos el dato para la URL
                const qrData = encodeURIComponent(String(id_inscripcion));
                
                // 2. Construimos la URL de la API de QR
                // Usamos ecc=H (alta corrección de errores) y qzone=2 (margen)
                const qrPublicUrl = `https://api.qr-server.com/v1/create-qr-code/?data=${qrData}&size=150x150&ecc=H&qzone=2`;

                // 3. Crear el HTML (igual que antes, pero con la nueva URL)
                qrHtmlContent = `
                    <div style="text-align: center; padding: 10px; border: 1px solid #ddd; border-radius: 8px; margin-top: 15px; background-color: #ffffff; max-width: 170px; margin-left: auto; margin-right: auto;">
                        <img src="${qrPublicUrl}" alt="Código QR para acreditación" style="width: 150px; height: 150px; display: block;">
                        <p style="margin: 5px 0 0 0; font-size: 12px; color: #555;">ID: ${id_inscripcion}</p>
                    </div>
                `;
                
            } catch (qrError) {
                console.error(`Error al construir la URL del QR para ${id_inscripcion}:`, qrError);
            }
        }
        // --- FIN DE LÓGICA QR ---

        
        // Reemplazo de placeholders (sin cambios)
        const fechaFormateada = formatFechaES(event_start_date);
        finalHtml = finalHtml.replace(/{{nombre_asistente}}/g, toName || 'participante');
        finalHtml = finalHtml.replace(/{{email_asistente}}/g, toEmail);
        finalHtml = finalHtml.replace(/{{nombre_evento}}/g, event_name);
        finalHtml = finalHtml.replace(/{{fecha_evento}}/g, fechaFormateada);
        finalHtml = finalHtml.replace(/{{lugar_evento}}/g, event_location);
        finalHtml = finalHtml.replace(/{{codigo_qr_html}}/g, qrHtmlContent);
        
        // Lógica de envío de Brevo (sin cambios)
        const url = 'https://api.brevo.com/v3/smtp/email';
        const apiKey = process.env.BREVO_API_KEY;

        const senderName = campana.email_sender_name || 'Eventos Pais'; 

        const data = {
            sender: { name: senderName, email: 'noreply@eventospais.cl' }, //
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

        console.log(`Correo de confirmación enviado a ${toEmail} para la campaña ${id_campana}. QR (externo) incluido: ${qrHtmlContent !== ''}`);

    } catch (error) {
        console.error("❌ Error en el proceso de envío de correo:", error.message);
        if (error.response) {
            console.error("Respuesta de Brevo:", error.response.data);
        }
    }
};