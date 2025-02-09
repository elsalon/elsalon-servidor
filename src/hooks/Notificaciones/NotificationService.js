// notifications/NotificationService.js
import payload from "payload"
import { getHandler } from './NotificationRegistry.js';

export class NotificationService {
  async triggerNotification(type, rawContext) {
    try{
    // 1. Get the appropriate handler
    const handler = getHandler(type);
    
    // 2. Enrich context with needed data
    const baseContext  = await this.buildContext(rawContext);
    
    // 3. Let handler add type-specific data
    const fullContext = await handler.enrichContext(baseContext);
    
    // 4. Execute notification flow
    const identidad = handler.createIdentidad(fullContext); // Quien la envia o qué avatar poner
    const mensaje = handler.createMessage(fullContext);
    const link = handler.createLink(fullContext);
    const categoria = handler.createCategory();
    const recipients = await handler.getRecipients(fullContext);
    if(recipients.length === 0) {
      console.warn(`Se saltea notificación, no hay destinatarios en ${type}`);
      return;
    }

    const notificationData = {
      mensaje,
      identidad,
      link,
      categoria,
    }

    console.log({recipients})

    // 5. Persist to database
    await Promise.all(
      recipients.map(recipient => 
        this.handleRecipientNotification(recipient, handler, notificationData)
      )
    );
    }catch(e){
      console.error("Error en triggerNotification", e)
    }
  }

  async buildContext(raw) {
    // Example: Fetch needed entities from DB
    // Por ejemplo aca chequear si tengo el objeto entero o solo el ID
    return {
      identidad: typeof raw.identidad == 'object' ? raw.identidad : await this.resolveIdentidad(raw.identidad, raw.identidadCollection), // User/Group resolver
      link: typeof raw.link == 'object' ? raw.link : await this.resolveLink(raw.link, raw.linkCollection), // User/Group resolver
    };
  }

  async resolveIdentidad(id, collection = 'users') {
    const identidad = await payload.findByID({collection, id})
    if(identidad.id){
      return usr
    }
    console.error(`resolveIdentidad: Identidad not found for ${id}`);
  }

  async resolveLink(id, collection = 'entradas') {
    const link = await payload.findByID({collection, id})
    if(link.id){
      return link
    }
    console.error(`resolveLink: Link not found for ${id}`);
  }

  async handleRecipientNotification(recipient, handler, notificationData) {
    if(!handler.requiresAggregation){
      // POST nueva notificacion
      console.log("No requiere agregación. Creando notificacion")
      return this.CreateNotification(recipient, notificationData)
    }

    // Tengo que modificar notificacion existente
    console.log("Requiere agregación. Buscando notificacion existente")
    const notificacionExistente = await payload.find({
      collection: 'notificaciones',
      where: {
        autor: recipient,
        categoria: notificationData.categoria,
        'link.id': notificationData.link.value
      }
    })
    if(notificacionExistente.totalDocs === 0){
      // POST nueva notificacion
      console.warn(`No se encontró notificación existente para ${notificationData.categoria} - ${notificationData.link.value}`);
    }
    console.log("Modificando notificacion existente", notificacionExistente.docs[0].id)
    return this.UpdateNotification(notificacionExistente.docs[0].id, recipient, notificationData)
  }
  
  async CreateNotification(recipient, notificationData) {
    try{
      console.log("Creando notificacion", {recipient}, notificationData)
      const res = await payload.create({
        collection: 'notificaciones',
        data: {
          ...notificationData,
          autor: recipient,
          leido: false
        }
      })
      console.log("Notificacion creada", res.id)
    }catch(e){
      console.error("Error en CreateNotification", e)
    }
  }

  async UpdateNotification(id, recipient, notificationData) {
    try{
      await payload.update({
        collection: 'notificaciones',
        id,
        data: {
          ...notificationData,
          autor: recipient,
          leido: false
        }
      })
    }catch(e){
      console.error("Error en UpdateNotification", e)
    }
  }

}




// // EJEMPLO DE USO EN OTRO SCRIPTS
// // When someone mentions a user in an entry
// const notificationService = new NotificationService();

// await notificationService.triggerNotification('mencion-usuario-entrada', {
//   actorId: 'user_123',       // Who mentioned
//   targetId: 'user_456',      // Who was mentioned
//   entryId: 'entry_789'       // Which entry
// });

// // When a new member joins a group
// await notificationService.triggerNotification('grupo-integrante-nuevo', {
//   actorId: 'user_123',       // Who joined
//   groupId: 'group_789',      // Target group
//   newMemberId: 'user_123'    // Same as actor
// });