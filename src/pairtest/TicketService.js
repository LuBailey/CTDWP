import TicketPaymentService from '../thirdparty/paymentgateway/TicketPaymentService.js';
import SeatReservationService from '../thirdparty/seatbooking/SeatReservationService.js';
import InvalidPurchaseException from './lib/InvalidPurchaseException.js';

export default class TicketService {
    
    //advisory business rule - use MAX_SEATS as a limit, as 25 adults could book 25 seats, but only 12 adults and 12 infants can book 12 seats.
    static MAX_TICKETS = 25;

    constructor() {
        this.paymentService = new TicketPaymentService();
        this.reservationService = new SeatReservationService();
    }

    /** 
    *   @param {Integer} accountid - integer of greater than zero
    *   @param {Object} ticketTypeRequests - accepts unlimited number of ticket request objects and merges into one object.
    */
    purchaseTickets(accountId, ...ticketTypeRequests) {
        if (accountId <= 0) {
            try {
                throw new InvalidPurchaseException('Invalid account ID', { accountId }, 'INVALID_ACCOUNT_ID');
            } catch (error) {
                console.log(error);
            }
          }
        let totalTickets = 0;
        let totalSeatsToReserve = 0;
        let totalAmount = 0;
        let adultTickets = 0;
        let childTickets = 0;
        let infantTickets = 0;

        // Validate each ticket request
        ticketTypeRequests.forEach(request => {
            const ticketType = request.getTicketType();
            const noOfTickets = request.getNoOfTickets();

            switch (ticketType) {
                case 'ADULT':
                    adultTickets += noOfTickets;
                    totalAmount += noOfTickets * 25; 
                    totalSeatsToReserve += noOfTickets;
                    break;
                case 'CHILD':
                    childTickets += noOfTickets;
                    totalAmount += noOfTickets * 15; 
                    totalSeatsToReserve += noOfTickets; 
                    break;
                case 'INFANT':
                    infantTickets += noOfTickets;
                    
                    break;
                default:
                    try {
                        throw new InvalidPurchaseException('Unknown ticket type', { ticketType }, 'INVALID_TICKET_TYPE');
                    } catch (error) {
                        console.log(error);
                    }
            }

            totalTickets += noOfTickets;
        });

        // Business rules
        if (totalTickets > TicketService.MAX_TICKETS) {
            try {
                throw new InvalidPurchaseException('Cannot exceed more than 25 tickets at once', { totalTickets }, 'EXCEED_TICKET_LIMIT');
            } catch (error) {
                console.log(error);
            }
        }
        if (childTickets > 0 || infantTickets > 0) {
            if (adultTickets <= 0) {
                try {
                    throw new InvalidPurchaseException('Child or infant tickets should have atleast one accompanying adult ticket', { infantTickets, childTickets, adultTickets }, 'NO_ADULT_PRESENT_WITH_INFANT_OR_CHILD');
                } catch (error) {
                    console.log(error);
                }
            }
        }
        
        //advisory business rule - ensure number of infants do not exceed number of adults to prevent 24 infants and 1 adult scenario. 
        /*
        if (infantTickets > adultTickets){
            try {
                    throw new InvalidPurchaseException('Infants should not exceed number of adults in the booking', { infantTickets, adultTickets }, 'INFANTS_EXCEED_NUMBER_OF_ADULTS');
                } catch (error) {
                    console.log(error);
                }
        }
        */
        

        // Make the payment
        //advisory business rule - only process payments > £0 
        if(totalAmount > 0){
            try {
                this.paymentService.makePayment(accountId, totalAmount);
            } catch (error){
                throw new InvalidPurchaseException('Third party payment service unavailable', { accountId, totalAmount }, '3RD_PARTY_PAYMENT_SERVICE_UNAVAILABLE');
            }
        
        } 

        // Reserve the seats (Infants do not get seats)
        ////advisory business rule - only process seat reservation for totalSeatsToReserve > 0 
        if(totalSeatsToReserve > 0){
            try {
                this.reservationService.reserveSeat(accountId, totalSeatsToReserve);
            } catch (error){
                console.log(error)
                throw new InvalidPurchaseException('Third party seat reservation service unavailable', { accountId, totalSeatsToReserve }, '3RD_PARTY_SEAT_RESERVATION_SERVICE_UNAVAILABLE');
            }
        }
        return {
            totalAmount,
            totalSeatsToReserve,
        };
    }
}

