import { BaseNotificationHandler } from '../BaseNotificationHandler'
import payload from 'payload';

async function BuscarComentarios(entradaid) {
  return payload.find({
    collection: 'comentarios',
    limit: 2,
    depth: 0,
    where: {
      entrada: {equals: entradaid},
    }
  });
}

function MensajeGrupo ({identidad, link, comentarios}) {
    console.log({link})
    if(comentarios.totalDocs == 1) return `<strong>${identidad.nombre}</strong> comentó a tu grupo <strong>${link.grupo.nombre}</strong>: <strong>${link.extracto}</strong>`;
    if(comentarios.totalDocs > 1) return `<strong>${identidad.nombre}</strong> y alguien más comentaron a tu grupo <strong>${link.grupo.nombre}</strong>: <strong>${link.extracto}</strong>`;
    return `<strong>${identidad.nombre}</strong> y ${comentarios.totalDocs - 1} más comentaron a tu grupo <strong>${link.grupo.nombre}</strong>: <strong>${link.extracto}</strong>`;
}

function MensajeUsuario({identidad, link, comentarios}){
    if(comentarios.totalDocs == 1) return `<strong>${identidad.nombre}</strong> comentó <strong>${link.extracto}</strong>`;
    if(comentarios.totalDocs > 1) return `<strong>${identidad.nombre}</strong> y alguien más comentaron <strong>${link.extracto}</strong>`;
    return `<strong>${identidad.nombre}</strong> y ${comentarios.totalDocs - 1} más comentaron <strong>${link.extracto}</strong>`;
}

/************************************************************
Notificacion cuando un GRUPO COMENTA UNA ENTRADA GRUPAL
**************************************************************/ 
export class ComentarioGrupalEntradaGrupalHandler extends BaseNotificationHandler{
    async enrichContext(baseContext) {
        // Chequeamos si ya existen aprecios a este evento
        baseContext.comentarios = await BuscarComentarios(baseContext.link.id);
        this.requiresAggregation = baseContext.comentarios.totalDocs > 0;
        return baseContext;
    }

    createCategory() { return 'comentario'; }

    async getRecipients({ link, identidad }) {
        let integrantes = link.grupo.integrantes;
        if(typeof integrantes[0] == 'object'){
          integrantes = integrantes.map((integrante) => integrante.id);
        }
        return integrantes.filter((integrante) => integrante != identidad.id);
    }

    createIdentidad({ identidad }) {
        return { value: identidad.id, relationTo: 'grupos' };
    }

    createMessage = MensajeGrupo;

    createLink({ link }) {
        return { value: link.id, relationTo: 'entradas' };
    }
}
/************************************************************
Notificacion cuando un USUARIO COMENTA UNA ENTRADA GRUPAL
**************************************************************/ 
export class ComentarioUsuarioEntradaGrupalHandler extends BaseNotificationHandler{
    async enrichContext(baseContext) {
        // Chequeamos si ya existen aprecios a este evento
        baseContext.comentarios = await BuscarComentarios(baseContext.link.id);
        this.requiresAggregation = baseContext.comentarios.totalDocs > 0;
        return baseContext;
    }

    createCategory() { return 'comentario'; }

    async getRecipients({ link, identidad }) {
        let integrantes = link.grupo.integrantes;
        if(typeof integrantes[0] == 'object'){
          integrantes = integrantes.map((integrante) => integrante.id);
        }
        return integrantes.filter((integrante) => integrante != identidad.id);
    }

    createIdentidad({ identidad }) {
        return { value: identidad.id, relationTo: 'users' };
    }

    createMessage = MensajeGrupo;
    
    createLink({ link }) {
        return { value: link.id, relationTo: 'entradas' };
    }
}
/************************************************************
Notificacion cuando un GRUPO COMENTA UNA ENTRADA USUARIO
**************************************************************/
export class ComentarioGrupalEntradaUsuarioHandler extends BaseNotificationHandler{
    async enrichContext(baseContext) {
        // Chequeamos si ya existen aprecios a este evento
        baseContext.comentarios = await BuscarComentarios(baseContext.link.id);
        this.requiresAggregation = baseContext.comentarios.totalDocs > 0;
        return baseContext;
    }

    createCategory() { return 'comentario'; }

    async getRecipients({ link }) {
        return [link.autor.id];
    }

    createIdentidad({ identidad }) {
        return { value: identidad.id, relationTo: 'grupos' };
    }

    createMessage = MensajeUsuario;
    
    createLink({ link }) {
        return { value: link.id, relationTo: 'entradas' };
    }
}

/************************************************************
Notificacion cuando un USUARIO COMENTA UNA ENTRADA USUARIO
**************************************************************/
export class ComentarioUsuarioEntradaUsuarioHandler extends BaseNotificationHandler{
    async enrichContext(baseContext) {
        // Chequeamos si ya existen aprecios a este evento
        baseContext.comentarios = await BuscarComentarios(baseContext.link.id);
        this.requiresAggregation = baseContext.comentarios.totalDocs > 0;
        return baseContext;
    }

    createCategory() { return 'comentario'; }

    async getRecipients({ link }) {
        return [link.autor.id];
    }

    createIdentidad({ identidad }) {
        return { value: identidad.id, relationTo: 'users' };
    }

    createMessage = MensajeUsuario;
    
    createLink({ link }) {
        return { value: link.id, relationTo: 'entradas' };
    }
}