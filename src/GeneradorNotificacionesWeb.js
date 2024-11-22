import payload from "payload"
import { GetNuevosMencionados } from "./helper";

export const NotificarAprecio = async ({ 
    doc,
    req, // full express request
    previousDoc, // document data before updating the collection
    operation, // name of the operation ie. 'create', 'update'
    }) => {
    if(operation === 'create' && req.body?.contenidotipo){
        // console.log("*** notificacion aprecio***", req.body.contenidotipo, req.body.contenidoid);
        switch(req.body.contenidotipo){
            case 'entrada':
                // console.log("Crear notificacion aprecio de entrada");
                NotificacionAprecioEntrada(doc, req);
                break;
            case 'comentario':
                // console.log("Crear notificacion aprecio de comentario")
                NotificacionAprecioComentario(doc, req);
                break;
        }
    }
}

export const NotificacionAprecioEntrada = async (doc, req) => {
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
        GenerarNotificacionOSumar(destinatario, req.user, 'aprecio', 'entrada', entrada.id);
    });
}

export const NotificacionAprecioComentario = async (doc, req) => {
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
            tipoNotificacion: 'aprecio',
            mensaje: `<strong>${req.user.nombre}</strong> apreció tu comentario ${resumen}...`,
            leida: false,
            linkType: 'entrada',
            linkTo: comentario.entrada.id,
        },
    });
}


 /**
 * @param {user} autor - Usuario siendo notificado
 * @param {user} usuario - Usuario que ejecutó la accion (se usará su avatar)
 * @param {string} tipoNotificacion - Tipo de notificación 'aprecio' | 'comentario' | 'mencion' | 'colaboracion']
 * @param {string} linkType - ID de la entrada o comentario a la que se hace referencia
 * @param {string} linkTo - Tipo de link 'entrada' | 'grupo' | 'usuario' | 'salon'
 */
const GenerarNotificacionOSumar = async (autor, usuario, tipoNotificacion, linkType, linkTo ) => {
    var where;
    switch(tipoNotificacion){
        case 'aprecio':
            where = {
                and: [
                    {tipoNotificacion: {equals: tipoNotificacion}},
                    {linkTo: {equals: linkTo}},
                    {autor: {equals: autor}},
                ]
            };
            break;
        case 'colaboracion':
            where = {
                and: [
                    {tipoNotificacion: {equals: tipoNotificacion}},
                    {autor: {equals: autor}},
                ]
            };
            break
        case 'comentario':
            where = {
                and: [
                    {tipoNotificacion: {equals: tipoNotificacion}},
                    {linkTo: {equals: linkTo}},
                    {autor: {equals: autor}},
                ]
            };
            break;
        case 'mencion':
            where = {
                and: [
                    {tipoNotificacion: {equals: tipoNotificacion}},
                    {linkTo: {equals: linkTo}},
                    {autor: {equals: autor}},
                ]
            };
            console.log("Notificar mencion ** ", where)
            break;
    }

    const existente = await payload.find({
        collection: "notificaciones",
        where: where,
    });

    console.log({existente})
    if(existente.totalDocs == 0){
        // Primera vez que se aprecia esta entrada
        console.log("Creando nueva notificacion")
        await payload.create({
            collection: 'notificaciones',
            data: {
                autor: autor,  // El autor de la entrada que fue apreciada
                usuario: usuario.id, // El usuario que aprecio
                tipoNotificacion: tipoNotificacion,
                linkType: linkType,
                linkTo: linkTo,
            },
        });
    }else{
        // Ya se aprecio antes. Modifico la cantidad
        const notificacion = existente.docs[0];
        console.log("Sumando a notificacion existente", notificacion.id)
        await payload.update({
            collection: 'notificaciones',
            id: notificacion.id,
            data: {
                cantidad: notificacion.cantidad + 1,
                usuario: usuario.id, // El último usuario que aprecio
                leida: false,
            }
        });
    }
}

export const NotificarNuevaColaboracion = async ({
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
                GenerarNotificacionOSumar(doc.idColaborador, req.user, 'colaboracion', 'usuario', req.user.id);

                // Dejo acá comentado. En principio no vamos a enviar mail por cada colaboración
                // const receptor = await req.payload.findByID({collection: 'users', id: doc.idColaborador});
                // if(receptor.notificacionesMail?.activas && receptor.notificacionesMail?.colaboradorNuevo){
                //     await AddToMailQueue(receptor.email, 'Nueva colaboración', `${req.user.nombre} empezó a colaborar con vos`)
                // }
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
                        GenerarNotificacionOSumar(integrante.id, req.user, 'colaboracion', 'usuario', req.user.slug);
                        // Dejo acá comentado. En principio no vamos a enviar mail por cada colaboración
                        // if(integrante.notificacionesMail?.activas && integrante.notificacionesMail?.colaboradorNuevo){
                        //     await AddToMailQueue(integrante.email, 'Nueva colaboración', `${req.user.nombre} empezó a colaborar con tu grupo ${grupo.nombre}`)
                        // }
                    });
                }
                break;
        }
    }
}

export const NotificarNuevoComentario = async ({
    doc, // full document data
    req, // full express request
    operation, // name of the operation ie. 'create', 'update'
}, entrada) => {
    if(operation != 'create') return;
    if(entrada.autor.id == doc.autor.id) return; // No notificar si el autor del comentario es el mismo que el de la entrada

    GenerarNotificacionOSumar(entrada.autor.id, doc.autor, 'comentario', 'entrada', entrada.id);
}


export const NotificarMencionEntrada = async ({
    doc, // full document data
    previousDoc, // document data before updating the collection
    operation, // name of the operation ie. 'create', 'update'
}) =>{
    const nuevosMencionados = await GetNuevosMencionados({doc, previousDoc, operation});

    if (!Array.isArray(nuevosMencionados)) {
        console.error("Expected an array from GetNuevosMencionados, but got:", nuevosMencionados);
        return;
    }

    // Process mentions sequentially with delay
    for (const mencionado of nuevosMencionados) {        
        try {
            console.log(mencionado.nombre, mencionado.id, " --- ", doc.autor.nombre, doc.autor.id)
            await GenerarNotificacionOSumar(mencionado.id, doc.autor, 'mencion', 'entrada', doc.id);
            // Wait 500ms between operations
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.error(`Error processing mention for user ${mencionado.id}:`, error);
        }
    }
}

export const NotificarMencionComentario = async ({
    doc, // full document data
    previousDoc,
    operation, // name of the operation ie. 'create', 'update'
}, entrada) => {
    const nuevosMencionados = await GetNuevosMencionados({doc, previousDoc, operation});

    if (!Array.isArray(nuevosMencionados)) {
        console.error("Expected an array from GetNuevosMencionados, but got:", nuevosMencionados);
        return;
    }

    // Process mentions sequentially with delay
    for (const mencionado of nuevosMencionados) {
        if (mencionado.id === entrada.autor.id) continue;
        
        try {
            await GenerarNotificacionOSumar(mencionado.id, doc.autor, 'mencion', 'entrada', entrada.id);
            // Wait 500ms between operations
            await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.error(`Error processing mention for user ${mencionado.id}:`, error);
        }
    }
}
