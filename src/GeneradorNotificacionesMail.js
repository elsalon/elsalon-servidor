import payload from 'payload';
import { SignJWT, jwtVerify  } from 'jose';
const logoUrl = `${process.env.NEXT_PUBLIC_SERVER_URL}/public/salon_logo_lg_600x80.png`;

// generate jwt
async function generateToken(payload) {
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('2d')
      .sign(new TextEncoder().encode(process.env.PAYLOAD_SECRET));
    return token;
}
// Verify a JWT
async function verifyToken(token) {
    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.PAYLOAD_SECRET));
      return payload;
    } catch (err) {
      console.error('Invalid or expired token:', err.message);
      throw err;
    }
  }

async function GenerarMailDesuscripcion(email){
    const data = {
        email,
        action: "unsubscribe",
    }
    // const token = await payload.auth.sign(data, process.env.PAYLOAD_SECRET, { expiresIn: '2d'});
    const token = await generateToken(data);
      
    // const token = jwt.sign(data, process.env.PAYLOAD_SECRET);
    const url = process.env.NEXT_PUBLIC_SERVER_URL + `/api/desuscribir?token=${token}`;
    return `<p>Para dejar de recibir mails de El Salón, podés <a href="${url}">desuscribirte acá</a>.</p>`;
}

export const DesuscribirUsuario = async (req, res, next) => {
    const token = req.query.token;
    if (!token) {
        res.status(400).send("Token inválido");
        return;
    }
    try {
        const data = await verifyToken(token);
        if (data.action !== "unsubscribe") {
            res.status(400).send("Token inválido");
            return;
        }
        const res = await payload.find({
            collection: 'users',
            where: {
                email: {equals: data.email}
            }
        });
        const user = res.docs[0];
        if (!user) {
            res.status(404).send("Usuario no encontrado");
            return;
        }
        await payload.update({
            collection: 'users',
            id: user.id,
            data: {
                notificacionesMail: {
                    activas: false
                }
            }
        });
    } catch (error) {
        console.error('Error al desuscribir usuario:', error);
        res.status(500).send("Error al desuscribir usuario");
        return;
    }

    const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Desuscripción Exitosa</title>
            <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
            }
            </style>
        </head>
        <body>
            <h1>Desuscripción Exitosa</h1>
            <p>Ya no vas a recibir correos de El Salón</p>
            <p>Para volver a suscribirte, podés hacerlo desde tu perfil</p>
        </body>
        </html>
    `;
    res.status(200).send(htmlContent);
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

            const mailFooter = async (email) => `</div>
<div class="footer">
    <p>El Salón</p>
    ${await GenerarMailDesuscripcion(email)}
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

function GenerarAvatar(autor){
    if(autor.avatar?.sizes?.thumbnail?.url){
        return `
            <img 
                src="${autor.avatar.sizes.thumbnail.url}" 
                alt="Avatar" 
                style="max-width: 48px; height: auto;"
            />`;
    }else{
        // Genero un cuadrado con las iniciales del nombre
        const initials = autor.nombre.split(' ').map(word => word[0]).join('');
        return `
            <div 
                style="width: 48px; height: 48px; background-color: #000; color: #fff; font-weight: bold; font-size: 20px; text-align: center; line-height: 48px;"
            >
                ${initials}
            </div>`;
    }
}


function BloqueEntrada(doc){
    return `<table>
    <tr>
        <td width="48" style="vertical-align: top; padding-right: 20px;">
            ${GenerarAvatar(doc.autor)}
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
            ${GenerarAvatar(comentario.autor)}
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


export const EnviarMailMencion = async (mencionado, doc, collection) => {
    // Chequear si el usuario tiene notificaciones por mail habilitadas
    if (!mencionado.notificacionesMail?.activas || !mencionado.notificacionesMail?.mencionNueva) return;
    var body = mailHeader;

    if(collection == 'entradas'){
        body += BloqueEntrada(doc);
    }else{
        body += BloqueComentario(doc, doc.entrada);
    }
    
    body += await mailFooter(mencionado.email);

    AddToMailQueue(mencionado.email, `El Salon - ${doc.autor.nombre} te mencionó`, body);
}

export const NotificarMailComentario = async ({
    doc, // full document data
    operation, // name of the operation ie. 'create', 'update'
}, entrada) => {
    if(operation != 'create') return;
    if(entrada.autor.id == doc.autor.id) return; // No notificar si el autor del comentario es el mismo que el de la entrada
    if(!entrada.autor.notificacionesMail.activas || !entrada.autor.notificacionesMail.comentarioNuevo) return; // Chequear si el usuario tiene notificaciones por mail habilitadas

    var body = mailHeader;
    body += BloqueComentario(doc, entrada);
    body += await mailFooter(entrada.autor.email);

    AddToMailQueue(entrada.autor.email, `El Salon - ${doc.autor.nombre} comentó una entrada tuya`, body);
}