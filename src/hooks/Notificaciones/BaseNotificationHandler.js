export class BaseNotificationHandler {
    constructor() {
      if (this.constructor === BaseNotificationHandler) {
        throw new Error("Abstract class can't be instantiated");
      }
    }
  
    // Optional: Default implementation returns the base context unchanged
    async enrichContext(baseContext) {
      return baseContext;
    }
    
    // Must implement these methods in subclasses
    getIdentidadType() { throw new Error('Not implemented'); }
    getLinkType() { throw new Error('Not implemented'); }
    
    async getRecipients(context) { 
      // Default: Notify the direct target
      return [context.identidad]; 
    }
  
    createAutor(context) {
      throw new Error('Not implemented');
    }
    createIdentidad(context) {
      throw new Error('Not implemented');
    }
    createMessage(context) {
      throw new Error('Not implemented');
    }
  
    createLink(context) {
      throw new Error('Not implemented');
    }
  }