import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/entities/user.entity';
import { Event, EventStatus } from '../events/entities/event.entity';
import { Template, TemplateStatus } from '../templates/entities/template.entity';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { Invitation, RsvpStatus, CheckInStatus } from '../invitations/entities/invitation.entity';
import { TemplateSale } from '../orders/entities/template-sale.entity';

export interface PlatformKpi {
  total_users: number;
  users_by_role: Record<string, number>;
  total_events: number;
  events_by_status: Record<string, number>;
  total_templates: number;
  templates_by_status: Record<string, number>;
  total_revenue: number;
  orders_by_status: Record<string, number>;
}

export interface EventAnalytics {
  total_invitations: number;
  rsvp_breakdown: Record<string, number>;
  check_in_breakdown: Record<string, number>;
  attendance_rate: number;
}

export interface CreatorAnalytics {
  creator_id: string;
  creator_name: string;
  total_templates: number;
  total_sales: number;
  total_royalty: number;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(Template)
    private readonly templateRepository: Repository<Template>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Invitation)
    private readonly invitationRepository: Repository<Invitation>,
    @InjectRepository(TemplateSale)
    private readonly templateSaleRepository: Repository<TemplateSale>,
  ) {}

  async getPlatformKpi(): Promise<PlatformKpi> {
    const totalUsers = await this.userRepository.count();
    const usersByRole = await this.userRepository
      .createQueryBuilder('user')
      .select('user.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .groupBy('user.role')
      .getRawMany();

    const totalEvents = await this.eventRepository.count();
    const eventsByStatus = await this.eventRepository
      .createQueryBuilder('event')
      .select('event.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('event.status')
      .getRawMany();

    const totalTemplates = await this.templateRepository.count();
    const templatesByStatus = await this.templateRepository
      .createQueryBuilder('template')
      .select('template.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('template.status')
      .getRawMany();

    const revenueResult = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.total_amount)', 'total')
      .where('order.status = :status', { status: OrderStatus.PAID })
      .getRawOne();

    const ordersByStatus = await this.orderRepository
      .createQueryBuilder('order')
      .select('order.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('order.status')
      .getRawMany();

    return {
      total_users: Number(totalUsers),
      users_by_role: this.arrayToObject(usersByRole, 'role', 'count'),
      total_events: Number(totalEvents),
      events_by_status: this.arrayToObject(eventsByStatus, 'status', 'count'),
      total_templates: Number(totalTemplates),
      templates_by_status: this.arrayToObject(templatesByStatus, 'status', 'count'),
      total_revenue: Number(revenueResult?.total || 0),
      orders_by_status: this.arrayToObject(ordersByStatus, 'status', 'count'),
    };
  }

  async getEventAnalytics(eventId: string): Promise<EventAnalytics> {
    const totalInvitations = await this.invitationRepository.count({
      where: { event_id: eventId },
    });

    const rsvpBreakdown = await this.invitationRepository
      .createQueryBuilder('invitation')
      .select('invitation.rsvp_status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('invitation.event_id = :eventId', { eventId })
      .groupBy('invitation.rsvp_status')
      .getRawMany();

    const checkInBreakdown = await this.invitationRepository
      .createQueryBuilder('invitation')
      .select('invitation.check_in_status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('invitation.event_id = :eventId', { eventId })
      .groupBy('invitation.check_in_status')
      .getRawMany();

    const checkedInCount = await this.invitationRepository.count({
      where: { event_id: eventId, check_in_status: CheckInStatus.SUDAH_CHECK_IN },
    });

    const hadirCount = await this.invitationRepository.count({
      where: { event_id: eventId, rsvp_status: RsvpStatus.HADIR },
    });

    const attendanceRate = hadirCount > 0 ? (checkedInCount / hadirCount) * 100 : 0;

    return {
      total_invitations: Number(totalInvitations),
      rsvp_breakdown: this.arrayToObject(rsvpBreakdown, 'status', 'count'),
      check_in_breakdown: this.arrayToObject(checkInBreakdown, 'status', 'count'),
      attendance_rate: Math.round(attendanceRate * 100) / 100,
    };
  }

  async getCreatorAnalytics(): Promise<CreatorAnalytics[]> {
    const results = await this.templateSaleRepository
      .createQueryBuilder('sale')
      .leftJoin('sale.template', 'template')
      .leftJoin('template.creator', 'creator')
      .select('creator.id', 'creator_id')
      .addSelect('creator.full_name', 'creator_name')
      .addSelect('COUNT(DISTINCT template.id)', 'total_templates')
      .addSelect('COUNT(sale.id)', 'total_sales')
      .addSelect('SUM(sale.royalty_amount)', 'total_royalty')
      .groupBy('creator.id')
      .addGroupBy('creator.full_name')
      .orderBy('total_royalty', 'DESC')
      .getRawMany();

    return results.map((result) => ({
      creator_id: result.creator_id,
      creator_name: result.creator_name,
      total_templates: Number(result.total_templates),
      total_sales: Number(result.total_sales),
      total_royalty: Number(result.total_royalty || 0),
    }));
  }

  async getRevenueTrend(days: number = 30): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.orderRepository
      .createQueryBuilder('order')
      .select("DATE_TRUNC('day', order.created_at)", 'date')
      .addSelect('SUM(order.total_amount)', 'revenue')
      .addSelect('COUNT(*)', 'orders')
      .where('order.status = :status', { status: OrderStatus.PAID })
      .andWhere('order.created_at >= :startDate', { startDate })
      .groupBy("DATE_TRUNC('day', order.created_at)")
      .orderBy('date', 'ASC')
      .getRawMany();
  }

  private arrayToObject(
    arr: any[],
    keyField: string,
    valueField: string,
  ): Record<string, number> {
    return arr.reduce((acc, curr) => {
      acc[curr[keyField]] = Number(curr[valueField]);
      return acc;
    }, {});
  }
}
