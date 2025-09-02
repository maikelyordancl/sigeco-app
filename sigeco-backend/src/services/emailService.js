const axios = require('axios');

// --- NUEVA FUNCIÓN PARA FORMATEAR FECHA EN ESPAÑOL ---
const formatFechaES = (dateInput) => {
  const fecha = new Date(dateInput);
  return fecha.toLocaleDateString('es-CL', {
    weekday: 'short',   // abreviado: lun., mar., mié., etc.
    day: '2-digit',     // día con dos dígitos
    month: 'short',     // mes abreviado
    year: 'numeric'     // año completo
  });
};

// La función para generar HTML no cambia
const getEmailHtml = (toName, nombre_evento, fecha, lugar) => {
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

// --- FUNCIÓN DE ENVÍO MODIFICADA PARA USAR AXIOS Y DEBUG ---
exports.sendConfirmationEmail = async (toEmail, toName, eventData) => {
  const { event_name, event_start_date, event_location } = eventData;

  // --- FORMATEAR FECHA EN ESPAÑOL ---
  const fechaFormateada = formatFechaES(event_start_date);

  const htmlContent = getEmailHtml(toName, event_name, fechaFormateada, event_location);

  // 1. Definimos la URL del API y la API Key
  const url = 'https://api.brevo.com/v3/smtp/email';
  const apiKey = process.env.BREVO_API_KEY;

  // 2. Creamos el cuerpo de la solicitud (el JSON)
  const data = {
    sender: {
      name: 'Eventos Pais',
      email: 'noreply@eventospais.cl',
    },
    to: [
      {
        email: toEmail,
        name: toName || '',
      },
    ],
    subject: `Confirmación Inscripción ${event_name}`,
    htmlContent: htmlContent,
  };

  // 3. Configuramos las cabeceras (headers)
  const headers = {
    accept: 'application/json',
    'api-key': apiKey,
    'content-type': 'application/json',
  };

  // 4. Hacemos la llamada con axios dentro de un try/catch
  try {

    const response = await axios.post(url, data, { headers: headers });

    console.log(eventData);
  } catch (error) {
    console.error("❌ Error al enviar el correo con Brevo (Axios):");

    if (error.response) {
    } else if (error.request) {
      // Error sin respuesta (problema de red o timeout)
      console.error("⚠️ No hubo respuesta de Brevo. Request fue:", error.request);
    } else {
      // Error de configuración
      console.error("⚙️ Error en la configuración:", error.message);
    }

    console.error("📂 Config completa:", error.config);
  }
};
