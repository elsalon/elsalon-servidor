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
        return `<strong>${usuario.nombre}</strong> creó una entrada en tu grupo <strong>${link.grupo.nombre}</strong>: <strong>${link.extracto}</strong>`;
    }
    
    createLink({ link }) {
        return { value: link.id, relationTo: 'entradas' };
    }
}