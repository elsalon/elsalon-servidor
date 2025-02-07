import payload from "payload"
import { GetNuevosMencionados } from "./helper";


 /**
 * @param {user} autor - Usuario siendo notificado
 * @param {user} usuario - Usuario que ejecutó la accion (se usará su avatar)
 * @param {string} tipoNotificacion - Tipo de notificación 'aprecio' | 'comentario' | 'mencion' | 'enlace' | 'comentario-grupal' | 'entrada-grupal']
 * @param {string} sourceDocumentId - ID de la entrada o comentario a la que se hace referencia
 * @param {string} sourceDocumentCollection - Colección de la entrada o comentario a la que se hace referencia
 * @param {boolean} sumarExistentes - Si es false, deshabilita la suma de notificaciones existentes y crea una nueva
 */
 const GenerarNotificacionOSumar = async (autor, usuario, tipoNotificacion, sourceDocumentId, sourceDocumentCollection, sumarExistentes = true) => {
    // console.log(autor, usuario, tipoNotificacion, sourceDocumentId, sourceDocumentCollection, sumarExistentes)
    try{
        var existente;
        if(sumarExistentes){
            // var where;
            let where = {
                and: [
                    {tipoNotificacion: {equals: tipoNotificacion}},
                    {'sourceDocument.value': {equals: sourceDocumentId}},
                    {autor: {equals: autor}},
                ]
            };
            existente = await payload.find({
                collection: "notificaciones",
                where: where,
            });
        }
        const crearNueva = !sumarExistentes || existente?.totalDocs == 0;

        if(crearNueva){
            // Primera vez que se aprecia esta entrada
            // console.log("Creando nueva notificacion")
            await payload.create({
                collection: 'notificaciones',
                data: {
                    autor: typeof autor == "object" ? autor.id: autor,  // El autor de la entrada que fue apreciada
                    usuario: typeof usuario == "object" ? usuario.id : usuario, // El usuario que aprecio
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
            // console.log("Sumando a notificacion existente", notificacion.id)
            await payload.update({
                collection: 'notificaciones',
                id: notificacion.id,
                data: {
                    cantidad: notificacion.cantidad + 1,
                    usuario: typeof usuario == "object" ? usuario.id : usuario, // El último usuario que aprecio
                    leida: false,
                }
            });
        }
    }catch(e){
        console.error("Error al generar notificacion", e);
    }
}


export const NotificarAprecio = async ({ 
    doc,
    req, // full express request
    previousDoc, // document data before updating the collection
    operation, // name of the operation ie. 'create', 'update'
    }) => {
    if(operation == 'create' && req.body?.contenidotipo){
        // console.log("*** notificacion aprecio***", operation, req.body.contenidotipo, req.body.contenidoid);
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
        if(destinatario == req.user.id) return; // No notificar si el autor de la entrada es el mismo que el de la entrada
        GenerarNotificacionOSumar(destinatario, req.user, 'aprecio', entrada.id, 'entradas');
    });
}

export const NotificacionAprecioComentario = async (doc, req) => {
    const comentario = await req.payload.findByID({
        collection: 'comentarios',
        id: doc.contenidoid,
    });
    if(!comentario) return;
    if(comentario.autor.id == req.user.id) return; // No notificar si el autor del comentario es el mismo que el de la entrada
    GenerarNotificacionOSumar(comentario.autor.id, req.user, 'aprecio', comentario.id, 'comentarios');
}

export const NotificarNuevoEnlace = async ({
    doc, // full document data
    req, // full express request
    previousDoc, // document data before updating the collection
    operation, // name of the operation ie. 'create', 'update'
}) => {
    if(operation === 'create'){
        // console.log("Usuario que enlazó:", req.user.slug)
        // console.log("Tipo de enlace:", doc.tipo);
        // console.log("Objeto con el que se enlaza:", doc.idEnlazado);
        try{

        switch(doc.tipo){
            case 'salon':
                // Nadie a quien notificar :)
                break;
            case 'bitacora':
                // Notifico al usuario de la bitacora
                GenerarNotificacionOSumar(doc.idEnlazado, req.user, 'enlace', req.user.id, 'users');

                // Dejo acá comentado. En principio no vamos a enviar mail por cada enlace
                // const receptor = await req.payload.findByID({collection: 'users', id: doc.idEnlazado});
                // if(receptor.notificacionesMail?.activas && receptor.notificacionesMail?.enlazadoNuevo){
                //     await AddToMailQueue(receptor.email, 'Nuevo Enlace', `${req.user.nombre} se enlazó con vos`)
                // }
                break;
            case 'grupo':
                const grupo = await req.payload.findByID({
                    collection: 'grupos',
                    id: doc.idEnlazado,
                });
                if(grupo){
                    // Notificar a cada integrante del grupo
                    grupo.integrantes.forEach(async (integrante) => {
                        GenerarNotificacionOSumar(integrante.id, req.user, 'enlace', grupo.id, 'grupos');
                        // Dejo acá comentado. En principio no vamos a enviar mail por cada enlace
                        // if(integrante.notificacionesMail?.activas && integrante.notificacionesMail?.enlazadoNuevo){
                        //     await AddToMailQueue(integrante.email, 'Nuevo Enlace', `${req.user.nombre} se enlazó con tu grupo ${grupo.nombre}`)
                        // }
                    });
                }else{
                    console.error("No se encontró el grupo con ID", doc.idEnlazado);
                }
                break;
            }
        }catch(e){
            console.error("Error al notificar nuevo enlace", e);
        }
    }
}

export const NotificarNuevoComentario = async ({
    doc, // full document data
    req, // full express request
    operation, // name of the operation ie. 'create', 'update'
}, entrada) => {
    try{
        if(operation == 'create') {
            // No notificar si el autor del comentario es el mismo que el de la entrada
            if(entrada.autor.id != doc.autor.id){
                GenerarNotificacionOSumar(entrada.autor.id, doc.autor, 'comentario', doc.id, 'comentarios');
            }
        }
    
        // Si es grupal notificar a otros integrantes
        if(doc.autoriaGrupal){
            doc.grupo.integrantes.forEach(async (integrante) => {
                if(integrante.id == doc.autor.id) return; // No notificar si el autor del comentario es el mismo que el de la entrada
                GenerarNotificacionOSumar(integrante.id, doc.autor, 'comentario-grupal', doc.id, 'comentarios');
            });
        }
    }catch(e){
        console.error("Error al notificar nuevo comentario", e);
    }
}


export const NotificarNuevaEntrada = async ({
    doc, // full document data
    previousDoc, // document data before updating the collection
    operation, // name of the operation ie. 'create', 'update'
    context, // full context object
}) =>{
    if(context.skipHooks) return;
    // Notificar a los integrantes del grupo
    try{
        if(doc.autoriaGrupal){
            doc.grupo.integrantes.forEach(async (integrante) => {
                if(integrante.id == doc.autor.id) return; // No notificar si el autor del comentario es el mismo que el de la entrada
                GenerarNotificacionOSumar(integrante.id, doc.autor, 'entrada-grupal', doc.id, 'entradas');
            });
        }
    }catch(e){
        console.error("Error al notificar nueva entrada", e);
    }
}

export const NotificarMencionEntrada = async ({
    doc, // full document data
    previousDoc, // document data before updating the collection
    operation, // name of the operation ie. 'create', 'update'
    context,
}) =>{
    if(context.skipHooks) return;
    try{
        const nuevosMencionados = await GetNuevosMencionados({doc, previousDoc, operation});
    
        if (!Array.isArray(nuevosMencionados)) {
            console.error("Expected an array from GetNuevosMencionados, but got:", nuevosMencionados);
            return;
        }
    
        // Process mentions sequentially with delay
        for (const mencionado of nuevosMencionados) {    
            if (mencionado.id === doc.autor.id) continue; // No notificar si el autor del comentario es el mismo que el de la entrada
    
            try {
                // console.log(mencionado.nombre, mencionado.id, " --- ", doc.autor.nombre, doc.autor.id)
                await GenerarNotificacionOSumar(mencionado.id, doc.autor, 'mencion', doc.id, 'entradas');
                // Wait 500ms between operations
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
                console.error(`Error processing mention for user ${mencionado.id}:`, error);
            }
        }
    }catch(e){
        console.error("Error al notificar mencion en entrada", e);
    }
}

export const NotificarMencionComentario = async ({
    doc, // full document data
    previousDoc,
    operation, // name of the operation ie. 'create', 'update'
}, entrada) => {
    try{
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
    }catch(e){
        console.error("Error al notificar mencion en comentario", e);
    }
}

export const NotificarNuevoGrupo = async ({
    doc, // full document data
    previousDoc,
    operation, // name of the operation ie. 'create', 'update'
    req,
}) => {
    if(operation === 'create'){
        // Notificar a los integrantes del grupo
        try{
            console.log("Nuevo Grupo", doc.nombre, "integrantes:", doc.integrantes.map(i => i.nombre));
            doc.integrantes.forEach(async (integrante) => {
                if(integrante.id == req.user.id) return; // No notificar si el autor del comentario es el mismo que el de la entrada
                GenerarNotificacionOSumar(integrante.id, integrante.id, 'grupo-fuiste-agregado', doc.id, 'grupos', false);
            });
        }catch(e){
            console.error("Error al notificar nuevo grupo", e);
        }
    }else if(operation === 'update'){
        // Integrantes nuevos
        const previousIntegrantesIds = new Set(previousDoc.integrantes);
        const currentIntegrantesIds = new Set(doc.integrantes.map(i => i.id));

        const integrantesNuevos = doc.integrantes.filter(i => !previousIntegrantesIds.has(i.id));
        const integrantesAbandonaron = previousDoc.integrantes.filter(i => !currentIntegrantesIds.has(i));

        console.log("Modificacion Grupo", doc.nombre, "integrantes nuevos:", integrantesNuevos.map(i => i.nombre), "abandonaron:", integrantesAbandonaron);
        try{
            doc.integrantes.forEach(async (integrante) => {
                if(integrante.id == req.user.id) return; // No notificar si el autor del comentario es el mismo que el de la entrada
                // Aviso de los nuevos integrantes
                integrantesNuevos.forEach(async (nuevo) => {
                    if(nuevo.id == integrante.id) {
                        GenerarNotificacionOSumar(integrante.id, nuevo.id, 'grupo-fuiste-agregado', doc.id, 'grupos', false);
                    }else{
                        GenerarNotificacionOSumar(integrante.id, nuevo.id, 'grupo-integrante-nuevo', doc.id, 'grupos', false);
                    }
                });
                // Aviso de los que se fueron
                integrantesAbandonaron.forEach(async (abandonaron) => {
                    GenerarNotificacionOSumar(integrante.id, abandonaron, 'grupo-integrante-abandono', doc.id, 'grupos', false);
                });
            });
        }catch(e){
            console.error("Error al notificar nuevo grupo", e);
        }
    }
}