export default class InvalidPurchaseException extends Error {
    /**
     * Constructs a new InvalidPurchaseException.
     * @param {string} message - The error message describing why the purchase is invalid.
     * @param {object} [details] - Optional details about the invalid purchase (e.g., invalid input data).
     * @param {string} [errorCode] - Optional error code for categorizing the specific type of invalid purchase.
     */
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
  