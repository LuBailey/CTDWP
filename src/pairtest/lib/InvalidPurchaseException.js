export default class InvalidPurchaseException extends Error {

    constructor(message, details = {}, errorCode = 'INVALID_PURCHASE') {
      
      super(message);
      this.name = this.constructor.name;

      this.details = details;
  
      this.errorCode = errorCode;
  
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, this.constructor);
      }
    }
  
    toString() {
      return `${this.name}: ${this.message} (Code: ${this.errorCode})${Object.keys(this.details).length ? ` | Details: ${JSON.stringify(this.details)}` : ''}`;
    }
  }
  