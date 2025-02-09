import { BaseNotificationHandler } from '../BaseNotificationHandler'
import payload from 'payload';

async function BuscarAprecios(contenidoid) {
  return payload.find({
    collection: 'aprecio',
    limit: 2,
    where: {
      contenidoid: {equals: contenidoid},
    }
  });
}
/************************************************************
Notificacion cuando un usuario APRECIA UNA ENTRADA INDIVIDUAL
**************************************************************/ 
export class AprecioEntradaIndividualHandler extends BaseNotificationHandler {
  async enrichContext(baseContext) {
    // Chequeamos si ya existe una notificacion sobre este evento.
    // En ese caso no generamos una nueva sino que actualizamos la existente
    baseContext.aprecios = await BuscarAprecios(baseContext.link.id);
    this.requiresAggregation = baseContext.aprecios.totalDocs > 0;
    return baseContext;
  }

  createCategory() { return 'aprecio'; }

  // Pasos finales para generar la notificacion
  async getRecipients({ link, identidad }) {
    if (link.autor.id == identidad.id) {
      return [];
    }
    return [link.autor.id];
  }

  createIdentidad({ identidad }) {
    return { value: identidad.id, relationTo: 'users' };
  }

  createMessage({ identidad, link, aprecios }) {
    if(aprecios.totalDocs == 0) return `<strong>${identidad.nombre}</strong> aprecia tu entrada <strong>${link.extracto}</strong>`;
    if(aprecios.totalDocs == 1) return `<strong>${identidad.nombre}</strong> y alguien más aprecian tu entrada <strong>${link.extracto}</strong>`;
    return `<strong>${identidad.nombre}</strong> y ${aprecios.totalDocs - 1} más aprecian tu entrada <strong>${link.extracto}</strong>`;
  }

  createLink({ link }) {
    return { value: link.id, relationTo: 'entradas' };
  }
}

/************************************************************
  Notificacion cuando un usuario APRECIA UNA ENTRADA GRUPAL
**************************************************************/
export class AprecioEntradaGrupalHandler extends BaseNotificationHandler{
  async enrichContext(baseContext) {
    // Chequeamos si ya existe una notificacion sobre este evento.
    // En ese caso no generamos una nueva sino que actualizamos la existente
    baseContext.aprecios = await BuscarAprecios(baseContext.link.id);
    // console.log(baseContext.aprecios)
    this.requiresAggregation = baseContext.aprecios.totalDocs > 0;
    return baseContext;
  }

  createCategory() { return 'aprecio'; }

  // Pasos finales para generar la notificacion
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

  createMessage({ identidad, link, aprecios }) {
    if(aprecios.totalDocs == 0) return `<strong>${identidad.nombre}</strong> aprecia tu entrada grupal <strong>${link.grupo.nombre}</strong>: <strong>${link.extracto}</strong>`;
    if(aprecios.totalDocs == 1) return `<strong>${identidad.nombre}</strong> y alguien más aprecian tu entrada grupal <strong>${link.grupo.nombre}</strong>: <strong>${link.extracto}</strong>`;
    return `<strong>${identidad.nombre}</strong> y ${aprecios.totalDocs - 1} más aprecian tu entrada grupal <strong>${link.grupo.nombre}</strong>: <strong>${link.extracto}</strong>`;
  }

  createLink({ link }) {
    return { value: link.id, relationTo: 'entradas' };
  }
}

/************************************************************
Notificacion cuando un usuario APRECIA UN COMENTARIO INDIVIDUAL
**************************************************************/
export class AprecioComentarioIndividualHandler extends BaseNotificationHandler {
  async enrichContext(baseContext) {
    // Chequeamos si ya existe una notificacion sobre este evento.
    // En ese caso no generamos una nueva sino que actualizamos la existente
    baseContext.aprecios = await BuscarAprecios(baseContext.link.id);
    this.requiresAggregation = baseContext.aprecios.totalDocs > 0;
    return baseContext;
  }

  createCategory() { return 'aprecio'; }

  // Pasos finales para generar la notificacion
  async getRecipients({ link, identidad }) {
    if (link.autor.id == identidad.id) {
      return [];
    }
    return [link.autor.id];
  }

  createIdentidad({ identidad }) {
    return { value: identidad.id, relationTo: 'users' };
  }

  createMessage({ identidad, link, aprecios }) {
    if(aprecios.totalDocs == 0) return `<strong>${identidad.nombre}</strong> aprecia tu comentario <strong>${link.extracto}</strong>`;
    if(aprecios.totalDocs == 1) return `<strong>${identidad.nombre}</strong> y alguien más aprecian tu comentario <strong>${link.extracto}</strong>`;
    return `<strong>${identidad.nombre}</strong> y ${aprecios.totalDocs - 1} más aprecian tu comentario <strong>${link.extracto}</strong>`;
  }

  createLink({ link }) {
    const entradaId = typeof link.entrada == 'object' ? link.entrada.id : link.entrada;
    return { value: entradaId, relationTo: 'entradas' };
  }
}
