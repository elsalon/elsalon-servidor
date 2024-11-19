class MailQueueProcessor {
    constructor(payload) {
      this.payload = payload;
      this.isProcessing = false;
    }
  
    // Start continuous processing
    start() {
      if (!this.isProcessing) {
        this.isProcessing = true;
        this.processQueue();
      }
    }
  
    // Stop processing
    stop() {
      this.isProcessing = false;
    }
  
    async processQueue() {
      if (!this.isProcessing) return;
  
      try {
        // console.log('Checking mail queue...')
        // Find oldest unsent mail in queue
        const queueItem = await this.payload.find({
            collection: 'mailQueue',
          where: {
            status: { equals: 'pending' }
          },
          limit: 1,
          sort: 'createdAt'
        });
  
        if (queueItem.docs.length > 0) {
          const mail = queueItem.docs[0];
          
          try {
            // Send email using Payload's native method
            // Use the configured from email from Payload config
            await this.payload.sendEmail({
              to: mail.to,
              subject: mail.subject,
              html: mail.body
              // Note: from is omitted to use Payload's configured email
            });
            console.log('Mail sent:', mail.id)
            // Update mail status
            await this.payload.update({
              collection: 'mailQueue',
              id: mail.id,
              data: { 
                status: 'sent', 
                sentAt: new Date() 
              }
            });
          } catch (sendError) {
            // Handle send failure
            await this.payload.update({
              collection: 'mailQueue',
              id: mail.id,
              data: { 
                status: 'failed', 
                errorMessage: sendError.message,
                retryCount: (mail.retryCount || 0) + 1
              }
            });
          }
        }
      } catch (error) {
        console.error('Mail queue processing error:', error);
      } finally {
        // Schedule next check with a delay
        if (this.isProcessing) {
          setTimeout(() => this.processQueue(), 5000); // Check every 5 seconds
        }
      }
    }
  }

  // Initialization function
function initializeMailQueue(payload) {
    const mailQueue = new MailQueueProcessor(payload);
  
    // Start processing
    mailQueue.start();
  
    return mailQueue;
}

// Optional: Add a cleanup method for failed emails
async function cleanupFailedEmails(payload, maxRetries = 3) {
    try {
      const failedEmails = await payload.find({
        collection: 'mailQueue',
        where: {
          status: { equals: 'failed' },
          retryCount: { less_than: maxRetries }
        }
      });
  
      for (const email of failedEmails.docs) {
        await payload.update({
          collection: 'mailQueue',
          id: email.id,
          data: {
            status: 'pending',
            retryCount: (email.retryCount || 0) + 1
          }
        });
      }
    } catch (error) {
      console.error('Failed emails cleanup error:', error);
    }
  }
  
// Rest of the code remains the same as in the previous example
module.exports = {
    MailQueueProcessor,
    initializeMailQueue,
    cleanupFailedEmails,
};
//   ```
  
//   Key change:
//   - Removed the `from` parameter when calling `sendEmail()`
//   - This will use the email configured in your Payload configuration (typically in your `payload.config.js`)
  
//   For context, in your Payload configuration, you would typically have something like:
  
//   ```javascript
//   module.exports = {
//     email: {
//       fromName: 'Your Company Name',
//       fromAddress: 'noreply@yourcompany.com'
//     },
//     // other configurations...
//   }
//   ```
  
//   This approach ensures that:
//   1. All emails are sent from a consistent, configured email address
//   2. You don't need to specify the `from` parameter for each email
//   3. It's easier to manage and update the sender email globally
  
//   The mail queue collection schema and usage remain the same as in the previous example. Would you like me to explain anything further?