class BaseNotificationHandler {
    constructor() {
      if (this.constructor === BaseNotificationHandler) {
        throw new Error("Abstract class can't be instantiated");
      }
    }
  
    // Must implement these methods in subclasses
    getIdentidadType() { throw new Error('Not implemented'); }
    getLinkType() { throw new Error('Not implemented'); }
    
    async getRecipients(context) { 
      // Default: Notify the direct target
      return [context.target]; 
    }
  
    createMessage(context) {
      throw new Error('Not implemented');
    }
  
    createLink(context) {
      throw new Error('Not implemented');
    }
  }