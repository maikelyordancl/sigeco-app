const axios = require('axios');
const Campana = require('../models/campanaModel'); // <--- 1. IMPORTAMOS EL MODELO

// --- Función para formatear fecha en español (sin cambios) ---
const formatFechaES = (dateInput) => {
    const fecha = new Date(dateInput);
    return fecha.toLocaleDateString('es-CL', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
};

// --- Plantilla HTML por defecto (sin cambios) ---
// Esta se usará si la campaña no tiene una plantilla personalizada
const getDefaultEmailHtml = (toName, nombre_evento, fecha, lugar) => {
    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmación Inscripción ${nombre_evento}</title>
    </head>
    <body style="margin:0; padding:0; background-color:#f0f0f0; font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;">
      <div style="max-width:600px; margin:20px auto; background:#ffffff; box-shadow:0 4px 12px rgba(0,0,0,0.1); border-radius:8px; overflow:hidden;">
        <div style="padding:20px;">
          <h2 style="margin:0; padding:0; text-align:center; color:#000;">
            <span style="background-color:#4cd964; padding:6px 12px; border-radius:4px; display:inline-block;">
              ¡Confirmación de tu inscripción al ${nombre_evento}
            </span>
          </h2>
        </div>
        <div style="padding:20px; font-size:16px; line-height:1.6; color:#000;">
        <p>Hola ${toName || 'Participante'},</p>
          <p>¡Excelente! Tu inscripción para el 
            <strong>${nombre_evento}</strong>, ha sido confirmada exitosamente.
          </p>
          <p><strong style="color:#008c23;">Fecha del evento:</strong> ${fecha}.</p>
          <p><strong style="color:#008c23;">Lugar:</strong> ${lugar}.</p>
          <p><strong style="color:#008c23;">Para ingresar:</strong> Presenta tu carnet de identidad en la entrada.</p>
          <p>Saludos cordiales,</p>
          <p><strong>Equipo</strong><br><i>Emov Biobío</i></p>
        </div>
        <div style="border-top:1px solid #DFE3E8; padding:15px; text-align:center; font-size:12px; color:#888;">
          <a href="#" style="color:#888; margin:0 10px; text-decoration:none;">Desuscribir</a>
        </div>
      </div>
    </body>
    </html>
  `;
};


// --- FUNCIÓN DE ENVÍO PRINCIPAL MODIFICADA ---
exports.sendConfirmationEmail = async (toEmail, toName, eventData, id_campana) => {
    const { event_name, event_start_date, event_location } = eventData;
    const fechaFormateada = formatFechaES(event_start_date);

    // --- INICIO DE LA NUEVA LÓGICA ---

    // 2. Definimos el asunto y cuerpo por defecto
    let subject = `Confirmación Inscripción ${event_name}`;
    let htmlContent = getDefaultEmailHtml(toName, event_name, fechaFormateada, event_location);

    try {
        // 3. Buscamos la campaña para ver si tiene plantilla personalizada
        const campana = await Campana.findById(id_campana);

        // 4. Si encontramos la campaña y tiene plantilla, la usamos
        if (campana && campana.email_subject && campana.email_body) {
            subject = campana.email_subject;
            htmlContent = campana.email_body;

            // 5. Reemplazamos las variables (placeholders) en la plantilla personalizada
            htmlContent = htmlContent.replace(/{{nombre_asistente}}/g, toName || 'participante');
            htmlContent = htmlContent.replace(/{{email_asistente}}/g, toEmail);
            htmlContent = htmlContent.replace(/{{nombre_evento}}/g, event_name);
            htmlContent = htmlContent.replace(/{{fecha_evento}}/g, fechaFormateada);
            htmlContent = htmlContent.replace(/{{lugar_evento}}/g, event_location);
        }
    } catch (dbError) {
        console.error("Error al buscar la plantilla de campaña en la BD. Se usará la plantilla por defecto.", dbError);
    }
    
    // --- FIN DE LA NUEVA LÓGICA ---


    // La lógica de envío con Brevo se mantiene intacta, pero usando las variables dinámicas
    const url = 'https://api.brevo.com/v3/smtp/email';
    const apiKey = process.env.BREVO_API_KEY;

    const data = {
        sender: {
            name: 'Eventos Pais',
            email: 'noreply@eventospais.cl',
        },
        to: [{
            email: toEmail,
            name: toName || '',
        }],
        subject: subject, // <--- Asunto dinámico
        htmlContent: htmlContent, // <--- Cuerpo HTML dinámico
    };

    const headers = {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
    };

    try {
        await axios.post(url, data, { headers: headers });
        console.log(`Correo de confirmación enviado a ${toEmail} usando la plantilla de la campaña ${id_campana}.`);
    } catch (error) {
        console.error("❌ Error al enviar el correo con Brevo (Axios):");
        if (error.response) {
            console.error("Respuesta de Brevo:", error.response.data);
        } else if (error.request) {
            console.error("⚠️ No hubo respuesta de Brevo. Request fue:", error.request);
        } else {
            console.error("⚙️ Error en la configuración:", error.message);
        }
    }
};