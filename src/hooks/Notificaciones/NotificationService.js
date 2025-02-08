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
    const recipients = await handler.getRecipients(fullContext);
    if(recipients.length === 0) {
      console.error('Notification Service: Recipient se espera que sea un array de al menos 1 elemento');
    }
    const autor = handler.createAutor(fullContext); // A quien va dirijida la notificacion
    const identidad = handler.createIdentidad(fullContext); // Quien la envia o qué avatar poner
    const mensaje = handler.createMessage(fullContext);
    const link = handler.createLink(fullContext);

    console.log("**", identidad)

    // 5. Persist to database
      await this.saveNotifications(recipients, {
        autor,
        mensaje,
        identidad,
        link,
        cantidad: fullContext.cantidad || 0,
      });
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

  async saveNotifications(recipients, notification) {
    recipients.forEach(async recipient => {
      const data = {
        ...notification,
        leido: false,
      }
      console.log("Creando notificacion", data)
      await payload.create({
        collection: 'notificaciones',
        data
      })
    })
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