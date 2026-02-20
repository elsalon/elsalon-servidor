import payload from 'payload';
import { SignJWT, jwtVerify  } from 'jose';
const logoUrl = `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/salon_logo_lg_600x80.png`;

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
    const url = process.env.PAYLOAD_PUBLIC_SERVER_URL + `/api/desuscribir?token=${token}`;
    return `<p>Para dejar de recibir mails de El Salón, <a href="${url}">desuscribite acá</a>.</p>`;
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
                style="width: 40px; height: 40px; margin-right: 7px; display: block;"
            />`;
    }else{
        // Genero un cuadrado con las iniciales del nombre
        const initials = autor.nombre?.split(' ').map(word => word[0]).join('');
        return `
            <div 
                style="width: 40px; height: 40px; background-color: #3b3b3b; color: #fff; font-weight: 600; font-size: 14px; text-align: center; line-height: 40px; margin-right: 7px; display: block; 
    text-transform: capitalize;"
            >
                ${initials}
            </div>`;
    }
}

function FormatearFecha(datetime) {
    const date = datetime instanceof Date ? datetime : new Date(datetime);
    if (isNaN(date.getTime())) {
        return 'Hace poco';
    }
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
}


function BloqueEntrada(doc){
    return `
    <div style="margin-bottom: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 6px;">
        <div style="display: flex; gap: 12px; margin-bottom: 12px;">
            <div style="flex-shrink: 0;">
                ${GenerarAvatar(doc.autor)}
            </div>
            <div style="flex: 1; min-width: 0;">
                <p style="margin: 0 0 4px 0; font-weight: 600; color: #1a1a1a; font-size: 14px;">${doc.autor.nombre}</p>
                <p style="margin: 0; font-size: 12px; color: #6b7280;">${FormatearFecha(doc.createdAt)}</p>
            </div>
        </div>
        <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.5;">${doc.extracto}</p>
        <p style="margin: 12px 0 0 0;"><a href="https://elsalon.org/entradas/${doc.id}" style="color: #0066cc; text-decoration: none; font-size: 13px; font-weight: 500;">Ver en El Salón →</a></p>
    </div>`;
}

function BloqueComentario(comentario, entrada){
    return `
    <div style="margin-bottom: 20px;">
        <div style="padding: 15px; background-color: #f9f9f9; border-radius: 6px; margin-bottom: 12px;">
            <p style="margin: 0 0 10px 0; font-size: 12px; color: #6b7280; font-weight: 500;">Comentario nuevo:</p>
            <div style="display: flex; gap: 12px;">
                <div style="flex-shrink: 0;">
                    ${GenerarAvatar(comentario.autor)}
                </div>
                <div style="flex: 1; min-width: 0;">
                    <p style="margin: 0 0 4px 0; font-weight: 600; color: #1a1a1a; font-size: 14px;">${comentario.autor.nombre}</p>
                    <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280;">${FormatearFecha(comentario.createdAt)}</p>
                    <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.5;">${comentario.extracto}</p>
                </div>
            </div>
        </div>
        
        <div style="padding: 15px; background-color: #fafafa; border-left: 3px solid #e5e7eb; border-radius: 4px;">
            <p style="margin: 0 0 10px 0; font-size: 12px; color: #6b7280; font-weight: 500;">En la entrada:</p>
            <div style="display: flex; gap: 12px;">
                <div style="flex-shrink: 0;">
                    ${GenerarAvatar(entrada.autor)}
                </div>
                <div style="flex: 1; min-width: 0;">
                    <p style="margin: 0 0 4px 0; font-weight: 600; color: #1a1a1a; font-size: 14px;">${entrada.autor.nombre}</p>
                    <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280;">${FormatearFecha(entrada.createdAt)}</p>
                    <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.5;">${entrada.extracto}</p>
                </div>
            </div>
        </div>
    </div>
    
    <p style="margin: 20px 0 0 0; text-align: center;"><a href="https://elsalon.org/entradas/${entrada.id}" style="color: #0066cc; text-decoration: none; font-size: 13px; font-weight: 500;">Ver conversación completa →</a></p>`;
}


export const EnviarMailMencion = async (mencionado, doc, collection) => {
    // Extract user ID from mention object (could be {value: {...}} or just the user object)
    const userId = mencionado.value?.id || mencionado.id;
    if (!userId) {
        console.error('EnviarMailMencion: Could not extract user ID from mention object');
        return;
    }

    // Fire and forget - fetch user and send email asynchronously
    EnviarMailMencionAsync(userId, doc, collection).catch(e => 
        console.error('Error in EnviarMailMencionAsync:', e)
    );
}

// Async function that actually fetches user and sends email (runs in background)
const EnviarMailMencionAsync = async (userId, doc, collection) => {
    try {
        // Fetch full user object to get notification preferences (bypasses read protection)
        const user = await payload.findByID({
            collection: 'users',
            id: userId,
        });

        if (!user) {
            console.warn('EnviarMailMencionAsync: User not found:', userId);
            return;
        }

        // Chequear si el usuario tiene notificaciones por mail habilitadas
        if (!user.notificacionesMail?.activas || !user.notificacionesMail?.mencionNueva) {
            return;
        }

        var body = mailHeader;
        console.log("Generando cuerpo del mail para mención en", collection);

        if(collection == 'entradas'){
            body += BloqueEntrada(doc);
        }else{
            body += BloqueComentario(doc, doc.entrada);
        }
        
        body += await mailFooter(user.email);

        AddToMailQueue(user.email, `El Salon - ${doc.autor.nombre} te mencionó`, body).catch(e => 
            console.error('Error adding mention email to queue:', e)
        );
    } catch (e) {
        console.error('Error al procesar mail de mención:', e);
    }
}

export const NotificarMailComentario = async ({
    doc, // full document data
    operation, // name of the operation ie. 'create', 'update'
    context,
}, entrada) => {
    if(context.skipHooks) return;
    if(operation != 'create') return;
    if(entrada.autor.id == doc.autor.id) return; // No notificar si el autor del comentario es el mismo que el de la entrada
    
    // Fire and forget - fetch user and send email asynchronously
    NotificarMailComentarioAsync(entrada.autor.id, doc, entrada).catch(e =>
        console.error('Error in NotificarMailComentarioAsync:', e)
    );
}

// Async function that fetches user and sends email (runs in background)
const NotificarMailComentarioAsync = async (userId, doc, entrada) => {
    try {
        // Fetch full user object to get notification preferences
        const user = await payload.findByID({
            collection: 'users',
            id: userId,
        });

        if (!user) {
            console.warn('NotificarMailComentarioAsync: User not found:', userId);
            return;
        }

        // Chequear si el usuario tiene notificaciones por mail habilitadas
        if (!user.notificacionesMail?.activas || !user.notificacionesMail?.comentarioNuevo) {
            return;
        }
    
        var body = mailHeader;
        body += BloqueComentario(doc, entrada);
        body += await mailFooter(user.email);
    
        AddToMailQueue(user.email, `El Salon - ${doc.autor.nombre} comentó una entrada tuya`, body).catch(e => 
            console.error('Error adding comment email to queue:', e)
        );
    } catch(e){
        console.error('Error al procesar mail de comentario:', e);
    }
}