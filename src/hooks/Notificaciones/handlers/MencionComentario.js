import { BaseNotificationHandler } from '../BaseNotificationHandler'

/************************************************************
Notificacion cuando un GRUPO MENCIONA OTRO GRUPO EN UN COMENTARIO
**************************************************************/ 
export class MencionGrupoComentarioGrupalHandler extends BaseNotificationHandler {
    createCategory() { return 'mencion'; }
    
    async getRecipients({ mencionado }) {
        if(typeof mencionado.value.integrantes[0] == 'object'){
          return mencionado.value.integrantes.map(i => i.id);
        }
        return mencionado.value.integrantes;
    }
    
    createIdentidad({ identidad }) {
        return { value: identidad.id, relationTo: 'grupos' };
    }
    
    createMessage({ identidad, link, comentario, mencionado }) {
        return `<strong>${identidad.nombre}</strong> mencionó a tu grupo <strong>${mencionado.value.nombre}</strong> en <strong>${comentario.extracto}</strong>`;
    }
    
    createLink({ link }) {
        return { value: link.id, relationTo: 'entradas' };
    }
}

/************************************************************
Notificacion cuando un GRUPO MENCIONA A UN USUARIO EN UN COMENTARIO
**************************************************************/ 
export class MencionUsuarioComentarioGrupalHandler extends BaseNotificationHandler {
    createCategory() { return 'mencion'; }
    
    async getRecipients({ mencionado }) {
        return [mencionado.value.id];
    }
    
    createIdentidad({ identidad }) {
        return { value: identidad.id, relationTo: 'grupos' };
    }
    
    createMessage({ identidad, link, comentario }) {
        return `<strong>${identidad.nombre}</strong> te mencionó en <strong>${comentario.extracto}</strong>`;
    }
    
    createLink({ link }) {
        return { value: link.id, relationTo: 'entradas' };
    }
}

/************************************************************
Notificacion cuando un USUARIO MENCIONA A UN GRUPO EN UN COMENTARIO
**************************************************************/ 
export class MencionGrupoComentarioIndividualHandler extends BaseNotificationHandler {
    createCategory() { return 'mencion'; }
    
    async getRecipients({ mencionado }) {
        console.log("Mencionado", mencionado)
        if(typeof mencionado.value.integrantes[0] == 'object'){
          return mencionado.value.integrantes.map(i => i.id);
        }
        return mencionado.value.integrantes;
    }
    
    createIdentidad({ identidad }) {
        return { value: identidad.id, relationTo: 'users' };
    }
    
    createMessage({ identidad, link, comentario, mencionado }) {
        return `<strong>${identidad.nombre}</strong> mencionó a tu grupo <strong>${mencionado.value.nombre}</strong> en <strong>${comentario.extracto}</strong>`;
    }
    
    createLink({ link }) {
        const entradaId = typeof link == 'object' ? link.id : link
        return { value: entradaId, relationTo: 'entradas' };
    }
}

/************************************************************
Notificacion cuando un USUARIO MENCIONA OTRO USUARIO EN UN COMENTARIO
**************************************************************/ 
export class MencionUsuarioComentarioIndividualHandler extends BaseNotificationHandler {
    createCategory() { return 'mencion'; }
    
    async getRecipients({ mencionado }) {
        return [mencionado.value.id];
    }
    
    createIdentidad({ identidad }) {
        return { value: identidad.id, relationTo: 'users' };
    }
    
    createMessage({ identidad, link, comentario }) {
        return `<strong>${identidad.nombre}</strong> te mencionó en <strong>${comentario.extracto}</strong>`;
    }
    
    createLink({ link }) {
        const entradaId = typeof link == 'object' ? link.id : link
        return { value: entradaId, relationTo: 'entradas' };
    }
}