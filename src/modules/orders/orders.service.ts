import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { TemplateSale } from './entities/template-sale.entity';
import { Event, EventStatus } from '../events/entities/event.entity';
import { Template } from '../templates/entities/template.entity';
import { OrderQueryDto } from './dto/order-query.dto';
import { RoyaltyQueryDto } from './dto/royalty-query.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { MockPaymentGateway } from './gateways/mock-payment.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { ORDER_PACKAGES } from './orders.constants';

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

  async createOrder(
    createOrderDto: CreateOrderDto,
    pelangganId: string,
  ): Promise<Order> {
    const order = this.orderRepository.create({
      ...createOrderDto,
      pelanggan_id: pelangganId,
      status: OrderStatus.PENDING,
    });
    return this.orderRepository.save(order);
  }

  getPackages() {
    return ORDER_PACKAGES;
  }

  async findAllByPelanggan(pelangganId: string, query: OrderQueryDto = { page: 1, limit: 20 }) {
    const { page, limit } = query;
    const skip = (page! - 1) * limit!;

    const [data, total] = await this.orderRepository.findAndCount({
      where: { pelanggan_id: pelangganId },
      relations: ['event', 'payments'],
      skip,
      take: limit,
      order: { created_at: 'DESC' },
    });

    const [pendingCount, paidCount, failedCount, cancelledCount] =
      await Promise.all([
        this.orderRepository.count({
          where: { pelanggan_id: pelangganId, status: OrderStatus.PENDING },
        }),
        this.orderRepository.count({
          where: { pelanggan_id: pelangganId, status: OrderStatus.PAID },
        }),
        this.orderRepository.count({
          where: { pelanggan_id: pelangganId, status: OrderStatus.FAILED },
        }),
        this.orderRepository.count({
          where: { pelanggan_id: pelangganId, status: OrderStatus.CANCELLED },
        }),
      ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit!),
      },
      counts: {
        pending: pendingCount,
        paid: paidCount,
        failed: failedCount,
        cancelled: cancelledCount,
      },
    };
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

    // Auto verify payment for testing/simulation purposes (5 seconds delay)
    setTimeout(() => {
      const secret = process.env.PAYMENT_WEBHOOK_SECRET || 'default-secret';
      const referenceNo = `mock_ref_${Date.now()}`;
      const payload = `${invoiceNumber}:paid:${referenceNo}`;
      const signature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      this.handlePaymentCallback({
        invoice_id: invoiceNumber,
        status: 'paid',
        paid_at: new Date().toISOString(),
        reference_no: referenceNo,
        signature: signature,
      }).catch(console.error);
    }, 5000);

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
      throw new UnauthorizedException('Invalid webhook signature');
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
      payment.paid_at = callbackData.paid_at
        ? new Date(callbackData.paid_at)
        : new Date();
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

  async getRoyaltyForCreator(creatorId: string, query: RoyaltyQueryDto = { page: 1, limit: 20 }) {
    const { page, limit } = query;
    const skip = (page! - 1) * limit!;

    const [data, total] = await this.templateSaleRepository.findAndCount({
      where: { template: { creator_id: creatorId } },
      relations: ['template', 'order'],
      skip,
      take: limit,
      order: { created_at: 'DESC' },
    });

    // Compute full totals from all records, not just current page
    const allSales = await this.templateSaleRepository.find({
      where: { template: { creator_id: creatorId } },
      select: ['royalty_amount', 'paid_to_creator_at'],
    });

    const totalRoyalty = allSales.reduce(
      (acc, s) => acc + Number(s.royalty_amount), 0,
    );
    const paidAmount = allSales
      .filter((s) => s.paid_to_creator_at)
      .reduce((acc, s) => acc + Number(s.royalty_amount), 0);
    const pendingAmount = allSales
      .filter((s) => !s.paid_to_creator_at)
      .reduce((acc, s) => acc + Number(s.royalty_amount), 0);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit!),
      },
      totals: {
        total_royalty: totalRoyalty,
        paid_amount: paidAmount,
        pending_amount: pendingAmount,
        paid_count: allSales.filter((s) => s.paid_to_creator_at).length,
        pending_count: allSales.filter((s) => !s.paid_to_creator_at).length,
      },
    };
  }
}
