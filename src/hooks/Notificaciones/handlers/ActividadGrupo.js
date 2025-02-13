import { BaseNotificationHandler } from '../BaseNotificationHandler'

/************************************************************
Notificacion a GRUPO cuando un INTEGRANTE CREA UNA ENTRADA
**************************************************************/ 
export class ActividadGrupoNuevaEntradaHandler extends BaseNotificationHandler{
    createCategory() { return 'actividad-grupo'; }
    
    async getRecipients({ link }) {
        if(typeof link.grupo.integrantes[0] == 'object'){
          return link.grupo.integrantes.map(i => i.id).filter(i => i != link.autor.id);
        }
        return link.grupo.integrantes.filter(i => i != link.autor.id);;
    }

    
    createIdentidad({ identidad }) {
        return { value: identidad.id, relationTo: 'grupos' };
    }
    
    createMessage({ link, usuario }) {
        return `<strong>${usuario.nombre}</strong> creó una entrada como grupo <strong>${link.grupo.nombre}</strong>: <strong>${link.extracto}</strong>`;
    }
    
    createLink({ link }) {
        return { value: link.id, relationTo: 'entradas' };
    }
}
/************************************************************
Notificacion a GRUPO cuando un INTEGRANTE EDITA UNA ENTRADA
**************************************************************/ 
export class ActividadGrupoEditoEntradaHandler extends BaseNotificationHandler{
    createCategory() { return 'actividad-grupo'; }
    
    async getRecipients({ link }) {
        if(typeof link.grupo.integrantes[0] == 'object'){
          return link.grupo.integrantes.map(i => i.id).filter(i => i != link.autor.id);
        }
        return link.grupo.integrantes.filter(i => i != link.autor.id);;
    }

    
    createIdentidad({ identidad }) {
        return { value: identidad.id, relationTo: 'grupos' };
    }
    
    createMessage({ link, usuario }) {
        return `<strong>${usuario.nombre}</strong> editó una entrada como grupo <strong>${link.grupo.nombre}</strong>: <strong>${link.extracto}</strong>`;
    }
    
    createLink({ link }) {
        return { value: link.id, relationTo: 'entradas' };
    }
}

/************************************************************
Notificacion a GRUPO cuando un INTEGRANTE CREA UN COMENTARIO
**************************************************************/ 
export class ActividadGrupoNuevoComentarioHandler extends BaseNotificationHandler{
    createCategory() { return 'actividad-grupo'; }
    
    async getRecipients({ comentario }) {
        if(typeof comentario.grupo.integrantes[0] == 'object'){
          return comentario.grupo.integrantes.map(i => i.id).filter(i => i != comentario.autor.id);
        }
        return comentario.grupo.integrantes.filter(i => i != comentario.autor.id);;
    }
    
    createIdentidad({ identidad }) {
        return { value: identidad.id, relationTo: 'grupos' };
    }
    
    createMessage({ usuario, comentario }) {
        return `<strong>${usuario.nombre}</strong> comentó como grupo <strong>${comentario.grupo.nombre}</strong>: <strong>${comentario.extracto}</strong>`;
    }
    
    createLink({ link }) {
        return { value: link.id, relationTo: 'entradas' };
    }
}
/************************************************************
Notificacion a GRUPO cuando un INTEGRANTE EDITA UN COMENTARIO
**************************************************************/ 
export class ActividadGrupoEditoComentarioHandler extends BaseNotificationHandler{
    createCategory() { return 'actividad-grupo'; }
    
    async getRecipients({ comentario }) {
        if(typeof comentario.grupo.integrantes[0] == 'object'){
          return comentario.grupo.integrantes.map(i => i.id).filter(i => i != comentario.autor.id);
        }
        return comentario.grupo.integrantes.filter(i => i != comentario.autor.id);;
    }
    
    createIdentidad({ identidad }) {
        return { value: identidad.id, relationTo: 'grupos' };
    }
    
    createMessage({ usuario, comentario }) {
        return `<strong>${usuario.nombre}</strong> editó un comentario como grupo <strong>${comentario.grupo.nombre}</strong>: <strong>${comentario.extracto}</strong>`;
    }
    
    createLink({ link }) {
        return { value: link.id, relationTo: 'entradas' };
    }
}