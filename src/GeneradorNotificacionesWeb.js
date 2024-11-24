import payload from "payload"
import { GetNuevosMencionados } from "./helper";


 /**
 * @param {user} autor - Usuario siendo notificado
 * @param {user} usuario - Usuario que ejecutó la accion (se usará su avatar)
 * @param {string} tipoNotificacion - Tipo de notificación 'aprecio' | 'comentario' | 'mencion' | 'colaboracion']
 * @param {string} sourceDocumentId - ID de la entrada o comentario a la que se hace referencia
 */
 const GenerarNotificacionOSumar = async (autor, usuario, tipoNotificacion, sourceDocumentId, sourceDocumentCollection) => {
    // var where;
    let where = {
        and: [
            {tipoNotificacion: {equals: tipoNotificacion}},
            {'sourceDocument.value': {equals: sourceDocumentId}},
            {autor: {equals: autor}},
        ]
    };
    // switch(tipoNotificacion){
    //     case 'aprecio':
    //         break;
    //     case 'colaboracion':
    //         where = {
    //             and: [
    //                 {tipoNotificacion: {equals: tipoNotificacion}},
    //                 {autor: {equals: autor}},
    //             ]
    //         };
    //         break
    //     case 'comentario':
    //         where = {
    //             and: [
    //                 {tipoNotificacion: {equals: tipoNotificacion}},
    //                 {sourceEventId: {equals: sourceEventId}},
    //                 {autor: {equals: autor}},
    //             ]
    //         };
    //         break;
    //     case 'mencion':
    //         where = {
    //             and: [
    //                 {tipoNotificacion: {equals: tipoNotificacion}},
    //                 {sourceEventId: {equals: sourceEventId}},
    //                 {autor: {equals: autor}},
    //             ]
    //         };
    //         // console.log("Notificar mencion ** ", where)
    //         break;
    // }

        console.log({sourceDocumentId})
    const existente = await payload.find({
        collection: "notificaciones",
        where: where,
    });

    // console.log({existente})
    if(existente.totalDocs == 0){
        // Primera vez que se aprecia esta entrada
        console.log("Creando nueva notificacion")
        await payload.create({
            collection: 'notificaciones',
            data: {
                autor: autor,  // El autor de la entrada que fue apreciada
                usuario: usuario.id, // El usuario que aprecio
                tipoNotificacion,
                sourceDocument: {
                    relationTo: sourceDocumentCollection,
                    value: sourceDocumentId
                },
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
        destinatarios = entrada.grupo.integrantes.map(i => i.id);
    }else{
        destinatarios.push(entrada.autor.id);
    }
    destinatarios.forEach(async (destinatario) => {
        if(destinatario == req.user.id) return; // No notificar si el autor del comentario es el mismo que el de la entrada
        GenerarNotificacionOSumar(destinatario, req.user, 'aprecio', entrada.id, 'entradas');
    });
}

export const NotificacionAprecioComentario = async (doc, req) => {
    const comentario = await req.payload.findByID({
        collection: 'comentarios',
        id: doc.contenidoid,
    });
    if(!comentario) return;
    GenerarNotificacionOSumar(comentario.autor.id, req.user, 'aprecio', comentario.id, 'comentarios');
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
                GenerarNotificacionOSumar(doc.idColaborador, req.user, 'colaboracion', req.user.id, 'users');

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
                        GenerarNotificacionOSumar(integrante.id, req.user, 'colaboracion', grupo.id, 'grupos');
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

    GenerarNotificacionOSumar(entrada.autor.id, doc.autor, 'comentario', doc.id, 'comentarios');
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
        if (mencionado.id === doc.autor.id) continue; // No notificar si el autor del comentario es el mismo que el de la entrada

        try {
            console.log(mencionado.nombre, mencionado.id, " --- ", doc.autor.nombre, doc.autor.id)
            await GenerarNotificacionOSumar(mencionado.id, doc.autor, 'mencion', doc.id, 'entradas');
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
        if (mencionado.id === doc.autor.id) continue; // No notificar si el autor del comentario es el mismo que el de la entrada
        
        try {
            await GenerarNotificacionOSumar(mencionado.id, doc.autor, 'mencion', doc.id, 'comentarios');
            // // Wait 500ms between operations
            // await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
            console.error(`Error processing mention for user ${mencionado.id}:`, error);
        }
    }
}
