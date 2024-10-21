export default class TicketTypeRequest {
    static INFANT = 'INFANT';
    static CHILD = 'CHILD';
    static ADULT = 'ADULT';

    constructor(type, quantity) {
        //normalizes input case issues
        const typeToUpper = type.toUpperCase();

        if (![TicketTypeRequest.INFANT, TicketTypeRequest.CHILD, TicketTypeRequest.ADULT].includes(typeToUpper)) {
            throw new TypeError('Invalid ticket type');
        }
        //catch non-integers here instead of at the third-party level. 
        if (!Number.isInteger(quantity)) {
            throw new TypeError('Ticket quantity must be an integer');
        }
        if (quantity < 0) {
            throw new Error('Quantity cannot be negative');
        }
        this.type = typeToUpper;
        this.quantity = quantity;
        Object.freeze(this); // Make the object immutable
    }

    getTicketType() {
        return this.type;
    }

    getNoOfTickets() {
        return this.quantity;
    }
}


