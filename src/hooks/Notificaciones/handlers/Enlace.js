import { BaseNotificationHandler } from '../BaseNotificationHandler'

/************************************************************
Notificacion NUEVO ENLACE A GRUPO
**************************************************************/ 
export class EnlaceGrupoHandler extends BaseNotificationHandler{
    createCategory() { return 'enlace'; }
    
    async getRecipients({ link }) {
        if(typeof link.integrantes[0] == 'object'){
          return link.integrantes.map(i => i.id);
        }
        return link.integrantes;
    }
    
    createIdentidad({ identidad }) {
        return { value: identidad.id, relationTo: 'users' };
    }
    
    createMessage({ link, identidad }) {
        return `<strong>${identidad.nombre}</strong> enlazó con el grupo <strong>${link.nombre}</strong>`;
    }
    
    createLink({ identidad }) {
        return { value: identidad.id, relationTo: 'users' };
    }
}

/************************************************************
Notificacion NUEVO ENLACE A USUARIO
**************************************************************/ 
export class EnlaceUsuarioHandler extends BaseNotificationHandler{
    createCategory() { return 'enlace'; }
    
    async getRecipients({ link }) {
        return [link.id];
    }
    
    createIdentidad({ identidad }) {
        return { value: identidad.id, relationTo: 'users' };
    }
    
    createMessage({ identidad }) {
        return `<strong>${identidad.nombre}</strong> enlazó con vos`;
    }
    
    createLink({ identidad }) {
        return { value: identidad.id, relationTo: 'users' };
    }
}