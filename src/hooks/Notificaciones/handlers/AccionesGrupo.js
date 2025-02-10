import { BaseNotificationHandler } from '../BaseNotificationHandler'
import payload from 'payload';

/************************************************************
Notificacion NUEVO GRUPO (aviso a los integrantes recien agregados)
**************************************************************/ 
export class AccionGrupoNuevoHandler extends BaseNotificationHandler{
    createCategory() { return 'acciones-grupo'; }
    
    async getRecipients({ identidad, creador }) {
        // Le aviso a todos menos al creador
        return identidad.integrantes.map(i => i.id).filter(i => i != creador.id);
    }
    
    createIdentidad({ identidad }) {
        return { value: identidad.id, relationTo: 'grupos' };
    }
    
    createMessage({ identidad }) {
        return `Fuiste agregado al nuevo grupo <strong>${identidad.nombre}</strong>`;
    }
    
    createLink({ link }) {
        return { value: link.id, relationTo: 'grupos' };
    }
}
/************************************************************
Notificacion NUEVO INTEGRANTE
**************************************************************/ 
export class AccionGrupoIntegranteAgregadoHandler extends BaseNotificationHandler{
    createCategory() { return 'acciones-grupo'; }
    
    async getRecipients({ identidad, editor }) {
        // Le aviso a todos menos al editor
        return identidad.integrantes.map(i => i.id).filter(i => i != editor.id);
    }
    
    createIdentidad({ identidad }) {
        return { value: identidad.id, relationTo: 'grupos' };
    }

    createMessage({ integrantesNuevos, identidad }) {
        if(integrantesNuevos.length == 1){
            return `<strong>${integrantesNuevos[0].nombre}</strong> fue agregado al grupo <strong>${identidad.nombre}</strong>`;
        }else{
            const integrantes = integrantesNuevos.map(i => i.nombre).join(', ');
            return `<strong>${integrantes}</strong> fueron agregados al grupo <strong>${identidad.nombre}</strong>`;
        }
    }

    createLink({ link }) {
        return { value: link.id, relationTo: 'grupos' };
    }
}
/************************************************************
Notificacion ABANDONÓ INTEGRANTE
**************************************************************/ 
export class AccionGrupoIntegranteAbandonoHandler extends BaseNotificationHandler{
    async enrichContext(baseContext) {
        baseContext.integrantesAbandonaron = await Promise.all(
            baseContext.integrantesAbandonaron.map(async (userId) => {
                return await payload.findByID({ collection: 'users', id: userId }); // This will replace the ID with the full user object
            })
        );
        return baseContext;
    }

    createCategory() { return 'acciones-grupo'; }
    
    async getRecipients({ identidad, editor }) {
        // Le aviso a todos menos al editor
        return identidad.integrantes.map(i => i.id).filter(i => i != editor.id);
    }
    
    createIdentidad({ identidad }) {
        return { value: identidad.id, relationTo: 'grupos' };
    }

    createMessage({ integrantesAbandonaron, identidad }) {
        if(integrantesAbandonaron.length == 1){
            return `<strong>${integrantesAbandonaron[0].nombre}</strong> abandonó el grupo <strong>${identidad.nombre}</strong>`;
        }else{
            const integrantes = integrantesAbandonaron.map(i => i.nombre).join(', ');
            return `<strong>${integrantes}</strong> abandonaron el grupo <strong>${identidad.nombre}</strong>`;
        }
    }

    createLink({ link }) {
        return { value: link.id, relationTo: 'grupos' };
    }
}