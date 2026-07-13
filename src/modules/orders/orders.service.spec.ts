import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrdersService } from './orders.service';
import { Order, OrderStatus } from './entities/order.entity';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { TemplateSale } from './entities/template-sale.entity';
import { Event, EventStatus } from '../events/entities/event.entity';
import { Template } from '../templates/entities/template.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { NotFoundException } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';

const mockRepository = () => ({
  create: jest.fn((dto) => dto),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
});

const mockNotificationsService = () => ({
  sendPaymentConfirmation: jest.fn(),
});

describe('OrdersService', () => {
  let service: OrdersService;
  let orderRepository: jest.Mocked<Repository<Order>>;
  let paymentRepository: jest.Mocked<Repository<Payment>>;
  let templateSaleRepository: jest.Mocked<Repository<TemplateSale>>;
  let eventRepository: jest.Mocked<Repository<Event>>;
  let templateRepository: jest.Mocked<Repository<Template>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: getRepositoryToken(Order),
          useFactory: mockRepository,
        },
        {
          provide: getRepositoryToken(Payment),
          useFactory: mockRepository,
        },
        {
          provide: getRepositoryToken(TemplateSale),
          useFactory: mockRepository,
        },
        {
          provide: getRepositoryToken(Event),
          useFactory: mockRepository,
        },
        {
          provide: getRepositoryToken(Template),
          useFactory: mockRepository,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService(),
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    orderRepository = module.get(getRepositoryToken(Order));
    paymentRepository = module.get(getRepositoryToken(Payment));
    templateSaleRepository = module.get(getRepositoryToken(TemplateSale));
    eventRepository = module.get(getRepositoryToken(Event));
    templateRepository = module.get(getRepositoryToken(Template));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createOrder', () => {
    it('should create an order with pending status', async () => {
      const createDto: CreateOrderDto = {
        event_id: 'event-123',
        package_type: 'premium',
        total_amount: 150000,
      };
      const pelangganId = 'user-123';

      const expectedOrder = {
        id: 'order-123',
        ...createDto,
        pelanggan_id: pelangganId,
        status: OrderStatus.PENDING,
      };

      orderRepository.create.mockReturnValue(expectedOrder as any);
      orderRepository.save.mockResolvedValue(expectedOrder as any);

      const result = await service.createOrder(createDto, pelangganId);

      expect(orderRepository.create).toHaveBeenCalledWith({
        ...createDto,
        pelanggan_id: pelangganId,
        status: OrderStatus.PENDING,
      });
      expect(result.status).toBe(OrderStatus.PENDING);
    });
  });

  describe('findOne', () => {
    it('should return an order by id', async () => {
      const order = { id: '1', status: OrderStatus.PENDING } as Order;
      orderRepository.findOne.mockResolvedValue(order);

      const result = await service.findOne('1');
      expect(result).toEqual(order);
    });

    it('should throw NotFoundException if order not found', async () => {
      orderRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createPayment', () => {
    it('should create a payment for pending order', async () => {
      const createDto: CreatePaymentDto = {
        order_id: 'order-123',
        payment_method: 'va' as any,
      };

      const order = {
        id: 'order-123',
        status: OrderStatus.PENDING,
        total_amount: 150000,
      } as Order;

      orderRepository.findOne.mockResolvedValue(order);
      paymentRepository.save.mockImplementation((payment: any) =>
        Promise.resolve({ ...payment, id: 'payment-123' } as Payment),
      );

      const result = await service.createPayment(createDto);

      expect(result.payment_id).toBeDefined();
      expect(result.invoice_number).toBeDefined();
      expect(result.amount).toBe(150000);
    });
  });

  describe('handlePaymentCallback', () => {
    it('should process successful payment and activate event', async () => {
      const order = {
        id: 'order-123',
        event_id: 'event-123',
        status: OrderStatus.PENDING,
        total_amount: 150000,
      } as Order;

      const payment = {
        id: 'payment-123',
        invoice_number: 'INV-123',
        order_id: 'order-123',
        order: order,
        status: PaymentStatus.PENDING,
      } as Payment;

      const event = {
        id: 'event-123',
        status: EventStatus.DRAFT,
        template_id: null,
      } as Event;

      paymentRepository.findOne.mockResolvedValue(payment);
      paymentRepository.save.mockResolvedValue({
        ...payment,
        status: PaymentStatus.PAID,
      });
      orderRepository.save.mockResolvedValue({
        ...order,
        status: OrderStatus.PAID,
      });
      eventRepository.findOne.mockResolvedValue(event);
      eventRepository.save.mockResolvedValue({
        ...event,
        status: EventStatus.ACTIVE,
      });

      // Mock the callback with a valid signature by using the same logic
      const callbackData = {
        invoice_id: 'INV-123',
        status: 'paid',
        paid_at: new Date().toISOString(),
        reference_no: 'REF-123',
        signature: 'mock-valid-signature',
      };

      // Mock the gateway's validateCallback to always return true for testing
      jest
        .spyOn((service as any).paymentGateway, 'validateCallback')
        .mockReturnValue(true);

      const result = await service.handlePaymentCallback(callbackData);

      expect(result.message).toBe('Callback processed');
      expect(eventRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: EventStatus.ACTIVE }),
      );
    });
  });
});
