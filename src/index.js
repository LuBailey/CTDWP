import TicketService from './pairtest/TicketService.js';
import TicketTypeRequest from './pairtest/lib/TicketTypeRequest.js';

const ticketService = new TicketService();

//sandbox for the ticketService interface - alter ticket requests here 
const adultTicketRequest = new TicketTypeRequest('ADULT', 2);
const childTicketRequest = new TicketTypeRequest('CHILD', 0);
const infantTicketRequest = new TicketTypeRequest('INFANT', 1);

try {
    const result = ticketService.purchaseTickets(1, adultTicketRequest, childTicketRequest, infantTicketRequest);
    console.log(result);
} catch (error) {
    console.log('Error:', error.message);
}
