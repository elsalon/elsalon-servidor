import payload from 'payload';
const jwt = require('jsonwebtoken');
const logoUrl = `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/public/salon_logo_lg_600x80.png`;

function GenerarMailDesuscripcion(email){
    const data = {
        email,
        action: "unsubscribe",
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 horas
    }
    const token = jwt.sign(data, process.env.PAYLOAD_SECRET);
    const url = process.env.PAYLOAD_PUBLIC_FRONTEND_URL + `/desuscribir?token=${token}`;
    return `<p>Para dejar de recibir mails de El Salón, podés <a href="${url}">desuscribirte acá</a>.</p>`;
}

const mailHeader =`<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>El Salón</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
            }
            .container {
                max-width: 600px;
                margin: 20px auto;
                background: white;
            }
            .header {
                padding: 20px;
                text-align: center;
                color: white;
            }
            .header img {
                max-width: 150px; /* Adjust logo size */
            }
            .content {
                padding: 20px;
            }
            .footer {
                text-align: center;
                font-size: 12px;
                color: #888;
                padding: 10px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="${logoUrl}" alt="El Salon">
            </div>
            <div class="content">`;

            const mailFooter = (email) => `</div>
<div class="footer">
    <p>El Salón</p>
    ${GenerarMailDesuscripcion(email)}
</div>
</div>
</body>
</html>
`;


export const AddToMailQueue = (to, subject, body) => {
    console.log("Agregando mail a la cola", to, subject);
    return payload.create({
        collection: 'mailQueue',
        data: {to, subject, body},
    });
}



function BloqueEntrada(doc){
    return `<table>
    <tr>
        <td width="48" style="vertical-align: top; padding-right: 20px;">
            <img 
                src="${doc.autor.avatar.sizes.thumbnail.url}" 
                alt="Avatar" 
                style="max-width: 48px; height: auto;"
            />
        </td>
        <td>
            <p style="font-weight:bold">${doc.autor.nombre}</p>
            <p>${doc.extracto} - <a href="https://elsalon.org/entradas/${doc.id}">Ver en El Salón</a></p>
        </td>
    </tr>
    </table>`;
}

function BloqueComentario(comentario, entrada){
    return `<table>
    <tr>
        <td width="48" style="vertical-align: top; padding-right: 20px;">
            <img 
                src="${comentario.autor.avatar.sizes.thumbnail.url}" 
                alt="Avatar" 
                style="max-width: 48px; height: auto;"
            />
        </td>
        <td>
            <p style="font-weight:bold">${comentario.autor.nombre}</p>
            <p>${comentario.extracto}</p>
        </td>
    </tr>
    </table>

    <p>Tu entrada:</p>
    <p>${entrada.extracto}</p>

    <a href="https://elsalon.org/entradas/${entrada.id}">Ver en El Salón</a>`;
}


export const EnviarMailMencion = (mencionado, doc) => {
    // Chequear si el usuario tiene notificaciones por mail habilitadas
    if (!mencionado.notificacionesMail.activas || !mencionado.notificacionesMail.mencionNueva) return;
    var body = mailHeader;
    body += BloqueEntrada(doc);
    body += mailFooter(mencionado.email);

    AddToMailQueue(mencionado.email, `El Salon - ${doc.autor.nombre} te mencionó`, body);
}

export const EnviarMailComentario = (comentario, entrada) => {
    // Chequear si el usuario tiene notificaciones por mail habilitadas
    if (!entrada.autor.notificacionesMail.activas || !entrada.autor.notificacionesMail.comentarioNuevo) return;
    var body = mailHeader;
    body += BloqueComentario(comentario, entrada);
    body += mailFooter(entrada.autor.email);

    AddToMailQueue(entrada.autor.email, `El Salon - ${comentario.autor.nombre} comentó una entrada tuya`, body);
}