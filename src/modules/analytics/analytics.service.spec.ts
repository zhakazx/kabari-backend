import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsService } from './analytics.service';
import { User } from '../users/entities/user.entity';
import { Event } from '../events/entities/event.entity';
import { Template } from '../templates/entities/template.entity';
import { Order } from '../orders/entities/order.entity';
import { Invitation } from '../invitations/entities/invitation.entity';
import { TemplateSale } from '../orders/entities/template-sale.entity';

const createMockQueryBuilder = (mockResult: any) => {
  return jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    getRawMany: jest.fn().mockResolvedValue(mockResult),
    getRawOne: jest.fn().mockResolvedValue(mockResult),
  }));
};

const mockRepository = () => ({
  count: jest.fn(),
  createQueryBuilder: createMockQueryBuilder([]),
});

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: getRepositoryToken(User), useFactory: mockRepository },
        { provide: getRepositoryToken(Event), useFactory: mockRepository },
        { provide: getRepositoryToken(Template), useFactory: mockRepository },
        { provide: getRepositoryToken(Order), useFactory: mockRepository },
        { provide: getRepositoryToken(Invitation), useFactory: mockRepository },
        { provide: getRepositoryToken(TemplateSale), useFactory: mockRepository },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPlatformKpi', () => {
    it('should return platform KPI data', async () => {
      // Override mock repositories with specific return values
      (service as any).userRepository.count = jest.fn().mockResolvedValue(100);
      (service as any).userRepository.createQueryBuilder = createMockQueryBuilder([
        { role: 'pelanggan', count: '80' },
        { role: 'kreator', count: '20' },
      ]);

      (service as any).eventRepository.count = jest.fn().mockResolvedValue(50);
      (service as any).eventRepository.createQueryBuilder = createMockQueryBuilder([
        { status: 'active', count: '30' },
        { status: 'draft', count: '20' },
      ]);

      (service as any).templateRepository.count = jest.fn().mockResolvedValue(25);
      (service as any).templateRepository.createQueryBuilder = createMockQueryBuilder([
        { status: 'published', count: '20' },
        { status: 'pending_review', count: '5' },
      ]);

      (service as any).orderRepository.createQueryBuilder = createMockQueryBuilder([
        { status: 'paid', count: '10' },
        { status: 'pending', count: '5' },
      ]);
      // Override getRawOne specifically for revenue
      const mockQb = (service as any).orderRepository.createQueryBuilder();
      mockQb.getRawOne = jest.fn().mockResolvedValue({ total: '1500000' });
      (service as any).orderRepository.createQueryBuilder = jest.fn(() => mockQb);

      const result = await service.getPlatformKpi();

      expect(result.total_users).toBe(100);
      expect(result.users_by_role).toEqual({
        pelanggan: 80,
        kreator: 20,
      });
      expect(result.total_events).toBe(50);
      expect(result.total_templates).toBe(25);
      expect(result.total_revenue).toBe(1500000);
    });
  });

  describe('getEventAnalytics', () => {
    it('should return event analytics', async () => {
      (service as any).invitationRepository.count = jest.fn().mockResolvedValue(100);
      (service as any).invitationRepository.createQueryBuilder = createMockQueryBuilder([
        { status: 'hadir', count: '80' },
        { status: 'tidak_hadir', count: '20' },
      ]);

      const result = await service.getEventAnalytics('event-123');

      expect(result.total_invitations).toBe(100);
      expect(result.rsvp_breakdown).toEqual({
        hadir: 80,
        tidak_hadir: 20,
      });
    });
  });

  describe('getCreatorAnalytics', () => {
    it('should return creator analytics', async () => {
      (service as any).templateSaleRepository.createQueryBuilder = createMockQueryBuilder([
        {
          creator_id: 'user-1',
          creator_name: 'Creator One',
          total_templates: '5',
          total_sales: '10',
          total_royalty: '500000',
        },
      ]);

      const result = await service.getCreatorAnalytics();

      expect(result).toHaveLength(1);
      expect(result[0].creator_id).toBe('user-1');
      expect(result[0].total_royalty).toBe(500000);
    });
  });
});
