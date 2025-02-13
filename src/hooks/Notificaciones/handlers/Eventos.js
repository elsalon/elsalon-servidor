import { BaseNotificationHandler } from '../BaseNotificationHandler'
import payload from 'payload';

async function BuscarEnlazados(id) {
    console.log("Buscando enlazados a", id)
    return payload.find({
        collection: 'enlaces',
        limit: 999,
        where: {
            idEnlazado: { equals: id }
        }
    });
}

/************************************************************
Notificacion EVENTO NUEVO
**************************************************************/ 
export class EventoNuevoHandler extends BaseNotificationHandler{
    async enrichContext(baseContext) {
        // Busco todos los enlazados a esta sala
        const salaId = typeof baseContext.evento.sala.id == 'object' ? baseContext.evento.sala.id.id : baseContext.evento.sala.id;
        const enlazados = await BuscarEnlazados(salaId);
        console.log(enlazados)
        baseContext.enlazados = enlazados.docs;
        return baseContext;
    }

    createCategory() { return 'evento'; }
    
    async getRecipients({ enlazados }) {
        return enlazados.map(i => i.autor.id);
    }
    
    createIdentidad({ evento }) {
        return { value: evento.sala.id, relationTo: 'salones' };
    }
    
    createMessage({ identidad, evento }) {
        return `${identidad.nombre} creó un nuevo evento en ${evento.sala.nombre}: <strong>${evento.titulo}</strong>`;
    }
    
    createLink({ evento }) {
        return { value: evento.sala.id, relationTo: 'salones' };
    }
}

/************************************************************
Notificacion EVENTO MODIFICADO
**************************************************************/
export class EventoModificadoHandler extends BaseNotificationHandler{
    async enrichContext(baseContext) {
        // Busco todos los enlazados a esta sala
        const salaId = typeof baseContext.evento.sala.id == 'object' ? baseContext.evento.sala.id.id : baseContext.evento.sala.id;
        const enlazados = await BuscarEnlazados(salaId);
        console.log(enlazados)
        baseContext.enlazados = enlazados.docs;
        return baseContext;
    }

    createCategory() { return 'evento'; }
    
    async getRecipients({ enlazados }) {
        return enlazados.map(i => i.autor.id);
    }
    
    createIdentidad({ evento }) {
        return { value: evento.sala.id, relationTo: 'salones' };
    }
    
    createMessage({ identidad, evento }) {
        return `${identidad.nombre} modificó la hora o fecha de <strong>${evento.titulo}</strong>`;
    }
    
    createLink({ evento }) {
        return { value: evento.sala.id, relationTo: 'salones' };
    }
}