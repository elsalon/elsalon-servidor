import { BaseNotificationHandler } from '../BaseNotificationHandler'
import payload from 'payload';

async function BuscarAprecios(contenidoid) {
  return await payload.find({
    collection: 'aprecio',
    limit: 2,
    where: {
      contenidoid: {equals: contenidoid},
    }
  });
}

export class AprecioEntradaIndividualHandler extends BaseNotificationHandler {
  async enrichContext(baseContext) {
    // Chequeamos si ya existe una notificacion sobre este evento.
    // En ese caso no generamos una nueva sino que actualizamos la existente
    baseContext.aprecios = BuscarAprecios(baseContext.link.id);
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

