import {BaseNotificationHandler} from '../BaseNotificationHandler'
import payload from 'payload';

export class AprecioEntradaIndividualHandler extends BaseNotificationHandler {

  // async enrichContext(baseContext) {
  //   // const entrada = payload.findByID({collection: 'entradas', id: baseContext.entrada})
  //   // let where = {
  //     //                 and: [
  //     //                     {tipoNotificacion: {equals: tipoNotificacion}},
  //     //                     {'sourceDocument.value': {equals: sourceDocumentId}},
  //     //                     {autor: {equals: autor}},
  //     //                 ]
  //     //             };
  //     //             existente = await payload.find({
  //     //                 collection: "notificaciones",
  //     //                 where: where,
  //     //             });
  // }
  
  getIdentidadType() { return 'user'; }
  getLinkType() { return 'entrada'; }

  // Pasos finales para generar la notificacion
  async getRecipients({ link, identidad }) {
    if(link.autor.id == identidad.id){
      return [];
    }
    return [link.autor.id];
  }

  createIdentidad({ identidad }) {
    return {value: identidad.id, relationTo: 'users'};
  }

  createMessage({ identidad, link }) {
    return `<strong>${identidad.nombre}</strong> aprecia tu entrada <strong>${link.extracto}</strong>`;
  }

  createLink({ link }) {
    return {value: link.id, relationTo: 'entradas'};
  }
}