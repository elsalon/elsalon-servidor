import payload from 'payload';
import { SignJWT, jwtVerify  } from 'jose';
import { ResolveIdentidad, GetNotificationRecipients, NormalizeAutorData } from './helper';
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
    text-transform: uppercase;"
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


function BloqueEntrada(doc, autorData = null){
    // Use provided autor data or fall back to doc.autor for backwards compatibility
    const autor = autorData || doc.autor;
    return `
    <div style="margin-bottom: 20px; padding: 15px; background-color: #f9f9f9; border-radius: 6px;">
        <div style="display: flex; gap: 12px; margin-bottom: 12px;">
            <div style="flex-shrink: 0;">
                ${GenerarAvatar(autor)}
            </div>
            <div style="flex: 1; min-width: 0;">
                <p style="margin: 0 0 4px 0; font-weight: 600; color: #1a1a1a; font-size: 14px;">${autor.nombre}</p>
                <p style="margin: 0; font-size: 12px; color: #6b7280;">${FormatearFecha(doc.createdAt)}</p>
            </div>
        </div>
        <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.5;">${doc.extracto}</p>
        <p style="margin: 12px 0 0 0;"><a href="https://elsalon.org/entradas/${doc.id}" style="color: #0066cc; text-decoration: none; font-size: 13px; font-weight: 500;">Ver en El Salón →</a></p>
    </div>`;
}

function BloqueComentario(comentario, entrada, comentarioAutorData = null, entradaAutorData = null){
    // Use provided author data or fall back to the document objects for backwards compatibility
    const comentarioAutor = comentarioAutorData || comentario.autor;
    const entradaAutor = entradaAutorData || entrada.autor;
    
    return `
    <div style="margin-bottom: 20px;">
        <div style="padding: 15px; background-color: #f9f9f9; border-radius: 6px; margin-bottom: 12px;">
            <p style="margin: 0 0 10px 0; font-size: 12px; color: #6b7280; font-weight: 500;">Comentario nuevo:</p>
            <div style="display: flex; gap: 12px;">
                <div style="flex-shrink: 0;">
                    ${GenerarAvatar(comentarioAutor)}
                </div>
                <div style="flex: 1; min-width: 0;">
                    <p style="margin: 0 0 4px 0; font-weight: 600; color: #1a1a1a; font-size: 14px;">${comentarioAutor.nombre}</p>
                    <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280;">${FormatearFecha(comentario.createdAt)}</p>
                    <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.5;">${comentario.extracto}</p>
                </div>
            </div>
        </div>
        
        <div style="padding: 15px; background-color: #fafafa; border-left: 3px solid #e5e7eb; border-radius: 4px;">
            <p style="margin: 0 0 10px 0; font-size: 12px; color: #6b7280; font-weight: 500;">En la entrada:</p>
            <div style="display: flex; gap: 12px;">
                <div style="flex-shrink: 0;">
                    ${GenerarAvatar(entradaAutor)}
                </div>
                <div style="flex: 1; min-width: 0;">
                    <p style="margin: 0 0 4px 0; font-weight: 600; color: #1a1a1a; font-size: 14px;">${entradaAutor.nombre}</p>
                    <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280;">${FormatearFecha(entrada.createdAt)}</p>
                    <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.5;">${entrada.extracto}</p>
                </div>
            </div>
        </div>
    </div>
    
    <p style="margin: 20px 0 0 0; text-align: center;"><a href="https://elsalon.org/entradas/${entrada.id}" style="color: #0066cc; text-decoration: none; font-size: 13px; font-weight: 500;">Ver conversación completa →</a></p>`;
}


export const EnviarMailMencion = async (mencionado, doc, collection) => {
    // Extract info from mention object (could be {value: {...}} or just the object)
    const mencionadoId = mencionado.value?.id || mencionado.id;
    const mencionadoCollection = mencionado.relationTo || (mencionado.value?.id ? 'users' : 'users');
    
    if (!mencionadoId) {
        console.error('EnviarMailMencion: Could not extract mention info');
        return;
    }

    // Fire and forget - resolve and send emails asynchronously
    EnviarMailMencionAsync(mencionadoId, mencionadoCollection, doc, collection).catch(e => 
        console.error('Error in EnviarMailMencionAsync:', e)
    );
}

// Async function that handles both user and group mentions
const EnviarMailMencionAsync = async (mencionadoId, mencionadoCollection, doc, collection) => {
    try {
        // Resolve the identity (user or group)
        const identidad = await ResolveIdentidad(mencionadoId, mencionadoCollection);
        if (!identidad) {
            console.warn('EnviarMailMencionAsync: Could not resolve identity:', mencionadoCollection, mencionadoId);
            return;
        }

        // Get list of recipients (user itself or all group members)
        const recipients = await GetNotificationRecipients(identidad, mencionadoCollection);
        if (!Array.isArray(recipients) || recipients.length === 0) {
            return;
        }

        // Get normalized author data for the mention source
        const autorData = NormalizeAutorData(doc.autor, 'users');

        // Send email to each recipient
        for (const recipient of recipients) {
            // Check if recipient wants mention emails
            if (!recipient.notificacionesMail?.activas || !recipient.notificacionesMail?.mencionNueva) {
                continue;
            }

            var body = mailHeader;

            if(collection == 'entradas'){
                body += BloqueEntrada(doc, autorData);
            }else{
                body += BloqueComentario(doc, doc.entrada, autorData);
            }
            
            body += await mailFooter(recipient.email);

            AddToMailQueue(recipient.email, `El Salon - ${doc.autor.nombre} te mencionó`, body).catch(e => 
                console.error('Error adding mention email to queue:', e)
            );
        }
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
    
    // Fire and forget - fetch and send email asynchronously
    NotificarMailComentarioAsync(entrada, doc).catch(e =>
        console.error('Error in NotificarMailComentarioAsync:', e)
    );
}

// Async function that handles both individual and group entry notifications
const NotificarMailComentarioAsync = async (entrada, doc) => {
    try {
        // Resolve entry author (user or group)
        const entradaAutorCollection = entrada.autoriaGrupal ? 'grupos' : 'users';
        const entradaAutorId = entrada.autoriaGrupal ? entrada.grupo.id : entrada.autor.id;
        
        const entradaAutor = await ResolveIdentidad(entradaAutorId, entradaAutorCollection);
        if (!entradaAutor) {
            console.warn('NotificarMailComentarioAsync: Could not resolve entry author');
            return;
        }

        // Get list of recipients (entry author if user, or all group members if group entry)
        const recipients = await GetNotificationRecipients(entradaAutor, entradaAutorCollection);
        if (!Array.isArray(recipients) || recipients.length === 0) {
            return;
        }

        // Get normalized author data for the comment source and entry author
        const comentarioAutorData = NormalizeAutorData(doc.autor, 'users');
        const entradaAutorData = NormalizeAutorData(entradaAutor, entradaAutorCollection);

        // Send email to each recipient
        for (const recipient of recipients) {
            // Check if recipient wants comment notification emails
            if (!recipient.notificacionesMail?.activas || !recipient.notificacionesMail?.comentarioNuevo) {
                continue;
            }
        
            var body = mailHeader;
            body += BloqueComentario(doc, entrada, comentarioAutorData, entradaAutorData);
            body += await mailFooter(recipient.email);
        
            AddToMailQueue(recipient.email, `El Salon - ${doc.autor.nombre} comentó una entrada tuya`, body).catch(e => 
                console.error('Error adding comment email to queue:', e)
            );
        }
    } catch(e){
        console.error('Error al procesar mail de comentario:', e);
    }
}