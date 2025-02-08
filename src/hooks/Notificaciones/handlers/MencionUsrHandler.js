const BaseNotificationHandler = require('./BaseNotificationHandler');

class GroupPostCommentHandler extends BaseNotificationHandler {
    getIdentidadType() { return 'group'; }
    getLinkType() { return 'comment'; }
  
    async getRecipients({ group }) {
      return group.members;
    }
  
    createMessage({ actor }) {
      return `${actor.name} commented on a group post`;
    }
  
    createLink({ comment }) {
      return `/comments/${comment.id}`;
    }
  }