// notifications/NotificationService.js
import { getHandler } from './NotificationRegistry.js';

class NotificationService {
  async triggerNotification(type, rawContext) {
    // 1. Get the appropriate handler
    const handler = getHandler(type);
    
    // 2. Enrich context with needed data
    const context = await this.buildContext(rawContext);
    
    // 3. Validate identidad type matches handler expectation
    this.validateContext(handler, context);

    // 4. Execute notification flow
    const recipients = await handler.getRecipients(context);
    const message = handler.createMessage(context);
    const link = handler.createLink(context);

    // 5. Persist to database
    await this.saveNotifications(recipients, {
      type,
      message,
      link,
      actor: context.actor.id
    });
  }

  async buildContext(raw) {
    // Example: Fetch needed entities from DB
    return {
      actor: await User.findById(raw.actorId),
      target: await IdentidadService.resolve(raw.targetId), // User/Group resolver
      entry: raw.entryId ? await Entry.findById(raw.entryId) : null,
      comment: raw.commentId ? await Comment.findById(raw.commentId) : null,
      group: raw.groupId ? await Group.findById(raw.groupId) : null,
      newMember: raw.newMemberId ? await User.findById(raw.newMemberId) : null
    };
  }

  validateContext(handler, context) {
    const expected = handler.getIdentidadType();
    if (context.target.type !== expected) {
      throw Error(`Handler expects ${expected} but got ${context.target.type}`);
    }
  }

  async saveNotifications(recipients, notification) {
    // Your DB logic here
    await NotificationModel.insertMany(
      recipients.map(recipient => ({
        ...notification,
        recipient: recipient.id,
        read: false,
        createdAt: new Date()
      }))
    );
  }
}