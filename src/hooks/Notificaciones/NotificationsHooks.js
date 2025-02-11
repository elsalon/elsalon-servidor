// import payload from "payload"
import { GetNuevosMencionados } from "../../helper";
import { NotificationService } from "./NotificationService"
const notificationService = new NotificationService();

export const NotificarEvento = async ({
    doc,
    req,
    previousDoc,
    operation,
    context,
}) => {
    if(context.skipHooks) return;

    if(operation == 'create'){
        const rawData = {
            identidad: req.user,
            link: doc,
            linkCollection: 'salones',
            evento: doc,
        }
        await notificationService.triggerNotification('evento-nuevo', rawData);
    }
}

export const NotificarAprecio = async ({
    doc,
    req, // full express request
    previousDoc, // document data before updating the collection
    operation, // name of the operation ie. 'create', 'update'
    context,
}) => {

    if (context.skipHooks) return;

    if (operation == 'create' && req.body?.contenidotipo) {

        const contenidotipo = req.body.contenidotipo;
        let link;
        if (contenidotipo == 'entrada') {
            link = await req.payload.findByID({ collection: 'entradas', id: doc.contenidoid });
        } else if (contenidotipo == 'comentario') {
            link = await req.payload.findByID({ collection: 'comentarios', id: doc.contenidoid });
            link = link;
        }
        const contenidoGrupal = link.autoriaGrupal;

        const rawData = {
            identidad: req.user,
            link,
            linkCollection: 'entradas',
        }

        if (contenidotipo == 'entrada' && contenidoGrupal) {
            await notificationService.triggerNotification('aprecio-entrada-grupal', rawData);

        } else if (contenidotipo == 'entrada' && !contenidoGrupal) {
            await notificationService.triggerNotification('aprecio-entrada-usuario', rawData);

        } else if (contenidotipo == 'comentario' && contenidoGrupal) {
            await notificationService.triggerNotification('aprecio-comentario-grupal', rawData);

        } else if (contenidotipo == 'comentario' && !contenidoGrupal) {
            await notificationService.triggerNotification('aprecio-comentario-usuario', rawData);

        } else {
            console.warn("NotificarAprecio: Tipo de contenido no reconocido:", req.body.contenidotipo);
        }
    }
}

export const NotificarNuevoEnlace = async ({
    doc, // full document data
    req, // full express request
    previousDoc, // document data before updating the collection
    operation, // name of the operation ie. 'create', 'update'
}) => {
    if (operation === 'create') {
        // console.log("Usuario que enlazó:", req.user.slug)
        // console.log("Tipo de enlace:", doc.tipo);
        // console.log("Objeto con el que se enlaza:", doc.idEnlazado);
        try {
            let rawData = {
                identidad: req.user,
                link: doc.idEnlazado,
            };
            switch (doc.tipo) {
                case 'salon':
                    // Nadie a quien notificar :)
                    break;
                case 'bitacora':
                    rawData.linkCollection = 'users',
                    await notificationService.triggerNotification('enlace-usuario', rawData);
                    break;
                case 'grupo':
                    rawData.linkCollection = 'grupos'
                    await notificationService.triggerNotification('enlace-grupo', rawData);

                    break;
            }
        } catch (e) {
            console.error("Error al notificar nuevo enlace", e);
        }
    }
}

export const NotificarNuevoComentario = async ({
    doc, // full document data
    req, // full express request
    operation, // name of the operation ie. 'create', 'update'
    context,
}, entrada) => {
    try {
        if (context.skipHooks) return;
        
        if(operation == 'create'){
            
            const comentarioGrupal = doc.autoriaGrupal;
            const identidad = comentarioGrupal ? doc.grupo : doc.autor;
            const entradaGrupal = entrada.autoriaGrupal;
            const link = entrada;

            const rawData = {
                identidad, // quien la genero
                link,
                linkCollection: 'entradas',
                comentario: doc,
            }

            if (entrada.autor.id == doc.autor.id && !entradaGrupal) return; // No notificar si el autor del comentario es el mismo que el de la entrada, y la entrada es individual
            if (comentarioGrupal && entradaGrupal) {
                await notificationService.triggerNotification('comentario-grupal-entrada-grupal', rawData);
            
            }else if(!comentarioGrupal && entradaGrupal){
                await notificationService.triggerNotification('comentario-usuario-entrada-grupal', rawData);

            }else if(comentarioGrupal && !entradaGrupal){
                await notificationService.triggerNotification('comentario-grupal-entrada-usuario', rawData);

            }else if(!comentarioGrupal && !entradaGrupal){
                await notificationService.triggerNotification('comentario-usuario-entrada-usuario', rawData);
            }
        }
    } catch (e) {
        console.error("Error al notificar nuevo comentario", e);
    }
}

export const NotificarGrupoNuevoComentario = async ({
    doc, // full document data
    req, // full express request
    operation, // name of the operation ie. 'create', 'update'
    context,
}, entrada) => {
    if (context.skipHooks) return;
    if (!doc.autoriaGrupal) return;
    
    const identidad = doc.grupo;
    const link = entrada;
    const rawData = {
        identidad, // quien la genero
        link,
        linkCollection: 'entradas',
        usuario: req.user,
        comentario: doc,
    }
    const handleName = operation == 'create' ? 'actividad-grupo-nuevo-comentario' : 'actividad-grupo-edito-comentario';
    await notificationService.triggerNotification(handleName, rawData);
};

export const NotificarGrupoNuevaEntrada = async ({
    doc, // full document data
    previousDoc, // document data before updating the collection
    operation, // name of the operation ie. 'create', 'update'
    context, // full context object
    req,
}) => {
    if (context.skipHooks) return;
    if (!doc.autoriaGrupal) return;
    // Notificar a los integrantes del grupo
    try {
        const identidad = doc.grupo;
        const link = doc;
        const rawData = {
            identidad, // quien la genero
            link,
            linkCollection: 'entradas',
            usuario: req.user,
        }
        const handleName = operation == 'create' ? 'actividad-grupo-nueva-entrada' : 'actividad-grupo-edito-entrada';
        await notificationService.triggerNotification(handleName, rawData);
    } catch (e) {
        console.error("Error al notificar nueva entrada", e);
    }
}

export const NotificarMencionEntrada = async ({
    doc, // full document data
    previousDoc, // document data before updating the collection
    operation, // name of the operation ie. 'create', 'update'
    context,
}) => {
    if (context.skipHooks) return;
    try {
        const nuevosMencionados = await GetNuevosMencionados({ doc, previousDoc, operation });
        
        if (!Array.isArray(nuevosMencionados)) {
            console.error("Expected an array from GetNuevosMencionados, but got:", nuevosMencionados);
            return;
        }
        if(nuevosMencionados.length == 0) return;

        const entradaGrupal = doc.autoriaGrupal;
        const identidad = entradaGrupal ? doc.grupo : doc.autor;
        const identidadCollection = entradaGrupal ? 'grupos' : 'users';

        for (const mencionado of nuevosMencionados) {
            if (mencionado.id === doc.autor.id) continue; // No notificar si es una automencion
            const mencionAGrupo = mencionado.relationTo == 'grupos';
            const rawContext = {
                identidad, // quien la genero
                identidadCollection,
                link: doc,
                linkCollection: 'entradas',
                mencionado,
            }

            if (entradaGrupal && mencionAGrupo) {
                await notificationService.triggerNotification('mencion-grupo-entrada-grupal', rawContext);
            }

            else if (entradaGrupal && !mencionAGrupo) {
                await notificationService.triggerNotification('mencion-usuario-entrada-grupal', rawContext);
            }

            else if (!entradaGrupal && mencionAGrupo) {
                await notificationService.triggerNotification('mencion-grupo-entrada-individual', rawContext);

            } else if (!entradaGrupal && !mencionAGrupo) {
                await notificationService.triggerNotification('mencion-usuario-entrada-individual', rawContext);
            }
        }
    } catch (e) {
        console.error("Error al notificar mencion en entrada", e);
    }
}

export const NotificarMencionComentario = async ({
    doc, // full document data
    previousDoc,
    operation, // name of the operation ie. 'create', 'update'
    context
}, entrada) => {
    if (context.skipHooks) return;
    try {
        const nuevosMencionados = await GetNuevosMencionados({ doc, previousDoc, operation });

        if (!Array.isArray(nuevosMencionados)) {
            console.error("Expected an array from GetNuevosMencionados, but got:", nuevosMencionados);
            return;
        }

        const comentarioGrupal = doc.autoriaGrupal;
        const identidad = comentarioGrupal ? doc.grupo : doc.autor;
        const identidadCollection = comentarioGrupal ? 'grupos' : 'users';
        // Process mentions sequentially with delay
        for (const mencionado of nuevosMencionados) {
            if (mencionado.id === entrada.autor.id) continue;
            if (mencionado.id === doc.autor.id) continue; // No notificar si el autor del comentario es el mismo que el de la entrada

            console.log("Notificar mencionado", mencionado);
            const mencionAGrupo = mencionado.relationTo == 'grupos';

            const rawContext = {
                identidad, // quien la genero
                identidadCollection,
                link: entrada,
                linkCollection: 'entradas',
                mencionado,
                comentario: doc,
            }

            if (comentarioGrupal && mencionAGrupo) {
                rawContext.identidadCollection = 'grupos';
                await notificationService.triggerNotification('mencion-grupo-comentario-grupal', rawContext);
            }

            else if (comentarioGrupal && !mencionAGrupo) {
                await notificationService.triggerNotification('mencion-usuario-comentario-grupal', rawContext);
            }

            else if (!comentarioGrupal && mencionAGrupo) {
                await notificationService.triggerNotification('mencion-grupo-comentario-individual', rawContext);
            }

            else if (!comentarioGrupal && !mencionAGrupo) {
                await notificationService.triggerNotification('mencion-usuario-comentario-individual', rawContext);
            }

        }
    } catch (e) {
        console.error("Error al notificar mencion en comentario", e);
    }
}

export const NotificarNuevoGrupo = async ({
    doc, // full document data
    previousDoc,
    operation, // name of the operation ie. 'create', 'update'
    req,
    context,
}) => {

    if (context.skipHooks) return;
    if (operation === 'create') {
        // Notificar a los integrantes del grupo
        try {
            console.log("Nuevo Grupo", doc.nombre, "integrantes:", doc.integrantes.map(i => i.nombre));
            
            await notificationService.triggerNotification('grupo-nuevo', {
                identidad: doc, // el grupo
                identidadCollection: 'grupos',
                link: doc,
                linkCollection: 'grupos',
                creador: req.user,
            });
            
        } catch (e) {
            console.error("Error al notificar nuevo grupo", e);
        }
    } else if (operation === 'update') {
        // Integrantes nuevos
        const previousIntegrantesIds = new Set(previousDoc.integrantes);
        const currentIntegrantesIds = new Set(doc.integrantes.map(i => i.id));

        const integrantesNuevos = doc.integrantes.filter(i => !previousIntegrantesIds.has(i.id));
        const integrantesAbandonaron = previousDoc.integrantes.filter(i => !currentIntegrantesIds.has(i));

        console.log("Modificacion Grupo", doc.nombre, "integrantes nuevos:", integrantesNuevos.map(i => i.nombre), "abandonaron:", integrantesAbandonaron);
        try {
            if(integrantesNuevos.length > 0){
                // Aviso sobre los nuevos integrantes
                await notificationService.triggerNotification('grupo-integrantes-nuevos', {
                    identidad: doc, // el grupo
                    identidadCollection: 'grupos',
                    link: doc,
                    linkCollection: 'grupos',
                    integrantesNuevos,
                    editor: req.user,
                });
            }

            if(integrantesAbandonaron.length > 0){
                await notificationService.triggerNotification('grupo-integrantes-abandonaron', {
                    identidad: doc, // el grupo
                    identidadCollection: 'grupos',
                    link: doc,
                    linkCollection: 'grupos',
                    integrantesAbandonaron,
                    editor: req.user,
                });
            }
        } catch (e) {
            console.error("Error al notificar nuevo grupo", e);
        }
    }
}