// Helper functions
import { Access, FieldAccess } from 'payload/types';
import payload from 'payload';


// Helper acces function
export const isAutor: Access = ({ req: { user }, id }) => {
    if (!user) return false;
    return {
        'autor': {
            equals: user.id,
        },
    };
};

export const isAdminOrAutor: Access = ({ req: { user }, id }) => {
    if (!user) return false;
    if (user.isAdmin) return true;
    return {
        'autor': {
            equals: user.id,
        },
    };
};

export const isAdminOrIntegrante: Access = ({ req: { user }, id }) => {
    if (!user) return false;
    if (user.isAdmin) return true;
    return {
        'integrantes': {
            contains: user.id,
        },
    };
};

export const isAdminOrSelf: Access = ({ req: { user }, id }) => {
    if (!user) return false;
    if (user.isAdmin) return true;
    return user.id === id;
}

export const isAdminOrDocente: Access = ({ req: { user }, id }) => {
    if (!user) return false;
    if (user.isAdmin) return true;
    if (user.rol == 'docente') return true;
}

export const isAdmin: Access = ({ req: { user } }) => {
    if (!user) return false;
    return user.isAdmin;
};

export const afterCreateAssignAutorToUser = async ({ operation, data, req }) => {
    if(operation === 'create' && req.user){
        data.autor = req.user.id; // El autor es el usuario actual
        return data;
    }
}


export const AddNotificationAprecio = async ({ 
    doc,
    req, // full express request
    previousDoc, // document data before updating the collection
    operation, // name of the operation ie. 'create', 'update'
    }) => {
    if(operation === 'create' && req.body?.contenidotipo){
        // console.log("*** notificacion aprecio***", req.body.contenidotipo, req.body.contenidoid);
        switch(req.body.contenidotipo){
            case 'entrada':
                console.log("Crear notificacion aprecio de entrada");
                NotificacionAprecioEntrada(doc, req);
                break;
            case 'comentario':
                console.log("Crear notificacion aprecio de comentario")
                NotificacionAprecioComentario(doc, req);
                break;
        }
    }
}

const NotificacionAprecioEntrada = async (doc, req) => {
    const entrada = await req.payload.findByID({
        collection: 'entradas',
        id: doc.contenidoid,
    });
    if(!entrada) return;
    let destinatarios = [];
    if(entrada.autoriaGrupal){
        destinatarios = entrada.integrantes.map(i => i.id);
    }else{
        destinatarios.push(entrada.autor.id);
    }
    destinatarios.forEach(async (destinatario) => {
        await req.payload.create({
            collection: 'notificaciones',
            data: {
                autor: destinatario,  // El autor de la entrada que fue apreciada
                tipoNotificacion: 'apreciacion',
                mensaje: `<strong>${req.user.nombre}</strong> apreció tu entrada <strong>${entrada.extracto}</strong>`,
                leida: false,
                linkType: 'entrada',
                linkTo: entrada.id,
            },
        });
    });
}

const NotificacionAprecioComentario = async (doc, req) => {
    const comentario = await req.payload.findByID({
        collection: 'comentarios',
        id: doc.contenidoid,
    });
    if(!comentario) return;
    let resumen = comentario.contenido.replace(/<[^>]*>?/gm, '').substring(0, 10);
    // remove html tags
    await req.payload.create({
        collection: 'notificaciones',
        data: {
            autor: comentario.autor.id,  // El autor de la entrada que fue apreciada
            tipoNotificacion: 'apreciacion',
            mensaje: `<strong>${req.user.nombre}</strong> apreció tu comentario ${resumen}...`,
            leida: false,
            linkType: 'entrada',
            linkTo: comentario.entrada.id,
        },
    });
}

export const AddNotificationColaboracion = async ({
    doc, // full document data
    req, // full express request
    previousDoc, // document data before updating the collection
    operation, // name of the operation ie. 'create', 'update'
}) => {
    if(operation === 'create'){
        // console.log("Usuario que empezo a colaborar:", req.user.slug)
        // console.log("Tipo de colaboracion:", doc.tipo);
        // console.log("Objeto con el que colabora:", doc.idColaborador);

        switch(doc.tipo){
            case 'salon':
                // Nadie a quien notificar :)
                break;
            case 'bitacora':
                // Notifico al usuario de la bitacora
                await req.payload.create({
                    collection: 'notificaciones',
                    data: {
                        autor: doc.idColaborador,
                        tipoNotificacion: 'colaboracion',
                        mensaje: `<strong>${req.user.nombre}</strong> Empezó a colaborar con vos`,
                        leida: false,
                        linkType: 'usuario',
                        linkTo: req.user.slug,
                    },
                });
                // Envio mail
                const receptor = await req.payload.findByID({collection: 'users', id: doc.idColaborador});
                if(receptor.notificacionesMail?.activas && receptor.notificacionesMail?.colaboradorNuevo){
                    await AddToMailQueue(receptor.email, 'Nueva colaboración', `${req.user.nombre} empezó a colaborar con vos`)
                }
                break;
            case 'grupo':
                // console.log('Colaboracion en grupo');
                const grupo = await req.payload.findByID({
                    collection: 'grupos',
                    id: doc.idColaborador,
                });
                if(grupo){
                    // Notificar a cada integrante del grupo
                    grupo.integrantes.forEach(async (integrante) => {
                        await req.payload.create({
                            collection: 'notificaciones',
                            data: {
                                autor: integrante.id,
                                tipoNotificacion: 'colaboracion',
                                mensaje: `<strong>${req.user.nombre}</strong> empezó a colaborar con tu grupo <strong>${grupo.nombre}</strong>`,
                                leida: false,
                                linkType: 'usuario',
                                linkTo: req.user.slug,
                            },
                        });

                        if(integrante.notificacionesMail?.activas && integrante.notificacionesMail?.colaboradorNuevo){
                            await AddToMailQueue(integrante.email, 'Nueva colaboración', `${req.user.nombre} empezó a colaborar con tu grupo ${grupo.nombre}`)
                        }
                    });
                }
                break;
        }
    }
}

export const AddToMailQueue = (to, subject, body) => {
    console.log("Agregando mail a la cola", to, subject);
    return payload.create({
        collection: 'mailQueue',
        data: {to, subject, body},
    });
}


export const NotificarMencionados = async ({
    doc, // full document data
    req, // full express request
    previousDoc, // document data before updating the collection
    operation, // name of the operation ie. 'create', 'update'
}) => {
    if(operation === 'create'){
        doc.mencionados?.forEach(async (mencionado) => {
            CrearNotificacionMencion(mencionado, doc)
        });
    }else if (operation === 'update'){
        let viejosMencionados = previousDoc.mencionados.map(m => m.id);
        let nuevosMencionados = doc.mencionados.map(m => m.id).filter(m => !viejosMencionados.includes(m));
        nuevosMencionados.forEach(async (mencionado) => {
            CrearNotificacionMencion(mencionado, doc)
        });
    }
};

const CrearNotificacionMencion = async(mencionado, doc) => {
    let mensaje = doc.extracto 
        ? `<strong>${doc.autor.nombre}</strong> te mencionó en su entrada <strong>${doc.extracto}</strong>` // es una entrada
        : `<strong>${doc.autor.nombre}</strong> te mencionó en su comentario a <strong>${doc.entrada.extracto}</strong>`; // es un comentario
    
    let linkTo = doc.extracto ? doc.id : doc.entrada.id;
    
    await payload.create({
        collection: 'notificaciones',
        data: {
            autor: mencionado.id,
            tipoNotificacion: 'mencion',
            mensaje,
            leida: false,
            linkType: 'entrada',
            linkTo,
        },
    });
}
export const CrearExtracto = async ({ operation, data, req }) => {
    if (operation === 'create' || operation === 'update') {
        let text = data.contenido;
        
        // Remove custom images tag
        text = text.replace(/\[image:[a-f0-9]+\]/g, '');
        
        // Function to convert mentions and hashtags to plain text
        const convertToPlainText = (content, regex, caracter) => {
            return content.replace(regex, (match, name) => caracter + name);
        }
        
        // Updated regex patterns
        const mentionRegex = /\[([^\]]+)\]\(mencion:[a-zA-Z0-9]+\)/g;
        const tagRegex = /\[([^\]]+)\]\(etiqueta:[a-zA-Z0-9]+\)/g;
        
        // Convert mentions and hashtags to plain text
        text = convertToPlainText(text, mentionRegex, "@");
        text = convertToPlainText(text, tagRegex, "#");

        // Remove HTML tags and get first 120 characters
        text = text?.replace(/<[^>]*>?/gm, '').substring(0, 120);

        data.extracto = text;
        return data;
    }
}

export const ValidarEntradaVacia = async ({ operation, data, req }) => {
    var entradaVacia = true;
    if (data.contenido == "<p><br></p>") {
        data.contenido = "";
    }else{
        entradaVacia = false;
    }
    if(data.imagenes.length > 0){
        entradaVacia = false;
    }
    if(data.archivos.length > 0){
        entradaVacia = false;
    }
    if(entradaVacia){
        throw new Error('La entrada no puede estar vacía');
    }
 
}