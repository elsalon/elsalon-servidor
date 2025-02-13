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
    async getRecipients(context) { 
      throw new Error('Base Notification Handler: Didnt implement getRecipients');
    }
    requiresAggregation = false;
    createIdentidad(context) {
      throw new Error('Base Notification Handler: Didnt implement createIdentidad');
    }
    createMessage(context) {
      throw new Error('Base Notification Handler: Didnt implement createMessage');
    }
    createCategory() { 
      throw new Error('Base Notification Handler: Didnt implement createCategory');
    }
    createLink(context) {
      throw new Error('Base Notification Handler: Didnt implement createLink');
    }
  }