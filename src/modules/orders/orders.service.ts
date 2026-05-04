import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { TemplateSale } from './entities/template-sale.entity';
import { Event, EventStatus } from '../events/entities/event.entity';
import { Template } from '../templates/entities/template.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { MockPaymentGateway } from './gateways/mock-payment.gateway';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class OrdersService {
  private readonly paymentGateway = new MockPaymentGateway();

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(TemplateSale)
    private readonly templateSaleRepository: Repository<TemplateSale>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(Template)
    private readonly templateRepository: Repository<Template>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createOrder(createOrderDto: CreateOrderDto, pelangganId: string): Promise<Order> {
    const order = this.orderRepository.create({
      ...createOrderDto,
      pelanggan_id: pelangganId,
      status: OrderStatus.PENDING,
    });
    return this.orderRepository.save(order);
  }

  async findAllByPelanggan(pelangganId: string): Promise<Order[]> {
    return this.orderRepository.find({
      where: { pelanggan_id: pelangganId },
      relations: ['event', 'payments'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['event', 'payments', 'pelanggan'],
    });
    if (!order) {
      throw new NotFoundException(`Order with ID "${id}" not found`);
    }
    return order;
  }

  async createPayment(createPaymentDto: CreatePaymentDto): Promise<any> {
    const order = await this.findOne(createPaymentDto.order_id);

    if (order.status !== OrderStatus.PENDING) {
      throw new Error('Order is not in pending status');
    }

    const invoiceNumber = `INV-${Date.now()}`;

    const payment = this.paymentRepository.create({
      order_id: order.id,
      invoice_number: invoiceNumber,
      payment_method: createPaymentDto.payment_method,
      amount: order.total_amount,
      provider: 'MockGateway',
      status: PaymentStatus.PENDING,
    });

    const savedPayment = await this.paymentRepository.save(payment);

    const gatewayResponse = await this.paymentGateway.createPayment({
      orderId: order.id,
      amount: Number(order.total_amount),
      paymentMethod: createPaymentDto.payment_method,
    });

    savedPayment.external_ref = gatewayResponse.paymentId;
    await this.paymentRepository.save(savedPayment);

    return {
      payment_id: savedPayment.id,
      invoice_number: savedPayment.invoice_number,
      virtual_account: gatewayResponse.virtualAccount,
      qr_string: gatewayResponse.qrString,
      amount: savedPayment.amount,
      expired_at: gatewayResponse.expiredAt,
    };
  }

  async handlePaymentCallback(callbackData: any): Promise<any> {
    const secret = process.env.PAYMENT_WEBHOOK_SECRET || 'default-secret';
    
    const isValid = this.paymentGateway.validateCallback(
      {
        invoiceId: callbackData.invoice_id,
        status: callbackData.status,
        paidAt: callbackData.paid_at,
        referenceNo: callbackData.reference_no,
        signature: callbackData.signature,
      },
      secret,
    );

    if (!isValid) {
      throw new Error('Invalid webhook signature');
    }

    const payment = await this.paymentRepository.findOne({
      where: { invoice_number: callbackData.invoice_id },
      relations: ['order'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (callbackData.status === 'paid') {
      payment.status = PaymentStatus.PAID;
      payment.paid_at = callbackData.paid_at ? new Date(callbackData.paid_at) : new Date();
      await this.paymentRepository.save(payment);

      // Update order status
      const order = payment.order;
      order.status = OrderStatus.PAID;
      await this.orderRepository.save(order);

      // Activate event
      if (order.event_id) {
        const event = await this.eventRepository.findOne({
          where: { id: order.event_id },
        });
        if (event) {
          event.status = EventStatus.ACTIVE;
          await this.eventRepository.save(event);
        }
      }

      // Record royalty if template was used
      await this.recordRoyalty(order);

      // Send payment confirmation notification
      const event = await this.eventRepository.findOne({
        where: { id: order.event_id },
      });
      if (event) {
        await this.notificationsService.sendPaymentConfirmation(
          order.pelanggan_id,
          event.event_name,
        );
      }
    }

    return { message: 'Callback processed' };
  }

  private async recordRoyalty(order: Order): Promise<void> {
    const event = await this.eventRepository.findOne({
      where: { id: order.event_id },
      relations: ['template'],
    });

    if (!event || !event.template_id) {
      return;
    }

    const template = await this.templateRepository.findOne({
      where: { id: event.template_id },
    });

    if (!template || Number(template.price) === 0) {
      return;
    }

    const royaltyPercent = 20; // 20% royalty
    const royaltyAmount = (Number(template.price) * royaltyPercent) / 100;

    const templateSale = this.templateSaleRepository.create({
      template_id: template.id,
      order_id: order.id,
      royalty_amount: royaltyAmount,
      royalty_percent: royaltyPercent,
    });

    await this.templateSaleRepository.save(templateSale);
  }

  async getRoyaltyForCreator(creatorId: string): Promise<TemplateSale[]> {
    return this.templateSaleRepository.find({
      where: { template: { creator_id: creatorId } },
      relations: ['template', 'order'],
      order: { created_at: 'DESC' },
    });
  }
}
