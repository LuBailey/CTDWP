import TicketService from '../src/pairtest/TicketService';
import TicketTypeRequest from '../src/pairtest/lib/TicketTypeRequest';
import TicketPaymentService from '../src/thirdparty/paymentgateway/TicketPaymentService';
import SeatReservationService from '../src/thirdparty/seatbooking/SeatReservationService';
import InvalidPurchaseException from '../src/pairtest/lib/InvalidPurchaseException';

//mock third party services provided
jest.mock('../src/thirdparty/paymentgateway/TicketPaymentService');
jest.mock('../src/thirdparty/seatbooking/SeatReservationService');

describe('TicketService', () => {
  let ticketService;

  beforeEach(() => {
    TicketPaymentService.mockClear();
    SeatReservationService.mockClear();
    ticketService = new TicketService();
  });

  test('should throw InvalidPurchaseException for invalid account ID', () => {
    const adultTicketRequest = new TicketTypeRequest('ADULT', 1);

    try {
      ticketService.purchaseTickets(0, adultTicketRequest);
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidPurchaseException);
      expect(error.message).toBe('Invalid account ID');
      expect(error.details).toEqual({ accountId: 0 });
      expect(error.errorCode).toBe('INVALID_ACCOUNT_ID');
    }
  });

  test('should throw InvalidPurchaseException for more than 25 tickets', () => {
    const adultTicketRequest = new TicketTypeRequest('ADULT', 26);

    try {
      ticketService.purchaseTickets(1, adultTicketRequest);
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidPurchaseException);
      expect(error.message).toBe('Cannot exceed more than 25 tickets at once');
      expect(error.details).toEqual({ totalTickets: 26 });
      expect(error.errorCode).toBe('EXCEED_TICKET_LIMIT');
    }
  });

  test('should throw InvalidPurchaseException if child tickets are purchased without an adult', () => {
    const childTicketRequest = new TicketTypeRequest('CHILD', 2);

    try {
      ticketService.purchaseTickets(1, childTicketRequest);
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidPurchaseException);
      expect(error.message).toBe('Child or infant tickets should have at least one accompanying adult ticket');
      expect(error.details).toEqual({ infantTickets: 0, childTickets: 2, adultTickets: 0 });
      expect(error.errorCode).toBe('NO_ADULT_PRESENT_WITH_INFANT_OR_CHILD');
    }
  });

  test('should throw InvalidPurchaseException if infant tickets are purchased without an adult', () => {
    const infantTicketRequest = new TicketTypeRequest('INFANT', 1);

    try {
      ticketService.purchaseTickets(1, infantTicketRequest);
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidPurchaseException);
      expect(error.message).toBe('Child or infant tickets should have at least one accompanying adult ticket');
      expect(error.details).toEqual({ infantTickets: 1, childTickets: 0, adultTickets: 0 });
      expect(error.errorCode).toBe('NO_ADULT_PRESENT_WITH_INFANT_OR_CHILD');
    }
  });

  //potential test for incorporating the no_of_infants > no_of_adults business rule commented on TicketService.js
  /*
  test('should throw InvalidPurchaseException if infants exceed the number of adults', () => {
    const adultTicketRequest = new TicketTypeRequest('ADULT', 1);
    const infantTicketRequest = new TicketTypeRequest('INFANT', 2);

    try {
      ticketService.purchaseTickets(1, adultTicketRequest, infantTicketRequest);
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidPurchaseException);
      expect(error.message).toBe('Infants should not exceed number of adults in the booking');
      expect(error.details).toEqual({ infantTickets: 2, adultTickets: 1 });
      expect(error.errorCode).toBe('INFANTS_EXCEED_NUMBER_OF_ADULTS');
    }
  });
  */
  

  test('should calculate the correct total amount and seats for adult and child tickets', () => {
    const adultTicketRequest = new TicketTypeRequest('ADULT', 2);
    const childTicketRequest = new TicketTypeRequest('CHILD', 1);

    const paymentService = TicketPaymentService.mock.instances[0];
    const reservationService = SeatReservationService.mock.instances[0];

    const result = ticketService.purchaseTickets(1, adultTicketRequest, childTicketRequest);

    expect(result.totalAmount).toBe(65); 
    expect(result.totalSeatsToReserve).toBe(3); 
    expect(paymentService.makePayment).toHaveBeenCalledWith(1, 65);
    expect(reservationService.reserveSeat).toHaveBeenCalledWith(1, 3);
  });

  test('should calculate the correct total amount and seats for adult, child, and infant tickets', () => {
    const adultTicketRequest = new TicketTypeRequest('ADULT', 1);
    const childTicketRequest = new TicketTypeRequest('CHILD', 1);
    const infantTicketRequest = new TicketTypeRequest('INFANT', 1);

    const paymentService = TicketPaymentService.mock.instances[0];
    const reservationService = SeatReservationService.mock.instances[0];

    const result = ticketService.purchaseTickets(1, adultTicketRequest, childTicketRequest, infantTicketRequest);

    expect(result.totalAmount).toBe(40); // (1 * 25) + (1 * 15)
    expect(result.totalSeatsToReserve).toBe(2); // 1 adult + 1 child
    expect(paymentService.makePayment).toHaveBeenCalledWith(1, 40);
    expect(reservationService.reserveSeat).toHaveBeenCalledWith(1, 2);
  });

  test('should not process payment if totalAmount is 0', () => {
    const infantTicketRequest = new TicketTypeRequest('INFANT', 1);

    ticketService.purchaseTickets(1, infantTicketRequest);

    const paymentService = TicketPaymentService.mock.instances[0];
    expect(paymentService.makePayment).not.toHaveBeenCalled();
  });

  test('should not reserve seats if totalSeatsToReserve is 0', () => {
    const infantTicketRequest = new TicketTypeRequest('INFANT', 1);

    ticketService.purchaseTickets(1, infantTicketRequest);

    const reservationService = SeatReservationService.mock.instances[0];
    expect(reservationService.reserveSeat).not.toHaveBeenCalled();
  });

  test('should handle maximum valid tickets (25 tickets)', () => {
    const adultTicketRequest = new TicketTypeRequest('ADULT', 13);
    const childTicketRequest = new TicketTypeRequest('CHILD', 12);

    const paymentService = TicketPaymentService.mock.instances[0];
    const reservationService = SeatReservationService.mock.instances[0];

    const result = ticketService.purchaseTickets(1, adultTicketRequest, childTicketRequest);

    expect(result.totalAmount).toBe(505); 
    expect(result.totalSeatsToReserve).toBe(25); 
    expect(paymentService.makePayment).toHaveBeenCalledWith(1, 505);
    expect(reservationService.reserveSeat).toHaveBeenCalledWith(1, 25);
  });

  test('should throw InvalidPurchaseException for unknown ticket type', () => {
    const invalidTicketRequest = { getTicketType: () => 'UNKNOWN', getNoOfTickets: () => 1 };

    try {
      ticketService.purchaseTickets(1, invalidTicketRequest);
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidPurchaseException);
      expect(error.message).toBe('Unknown ticket type');
      expect(error.details).toEqual({ ticketType: 'UNKNOWN' });
      expect(error.errorCode).toBe('INVALID_TICKET_TYPE');
    }
  });
});
