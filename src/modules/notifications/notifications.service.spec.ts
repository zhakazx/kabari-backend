import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from './notifications.service';
import { Notification, NotificationStatus } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { getQueueToken } from '@nestjs/bull';

const mockNotificationRepository = () => ({
  create: jest.fn((dto) => dto),
  save: jest.fn(),
  find: jest.fn(),
  update: jest.fn(),
});

const mockQueue = () => ({
  add: jest.fn(),
});

describe('NotificationsService', () => {
  let service: NotificationsService;
  let repository: jest.Mocked<Repository<Notification>>;
  let queue: jest.Mocked<any>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(Notification),
          useFactory: mockNotificationRepository,
        },
        {
          provide: getQueueToken('notifications'),
          useFactory: mockQueue,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    repository = module.get(getRepositoryToken(Notification));
    queue = module.get(getQueueToken('notifications'));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create notification and add to queue', async () => {
      const createDto: CreateNotificationDto = {
        subject: 'Test Subject',
        message: 'Test Message',
        channel: 'whatsapp' as any,
        user_id: 'user-123',
      };

      const expectedNotification = {
        id: 'notif-123',
        ...createDto,
        status: NotificationStatus.QUEUED,
      };

      repository.save.mockResolvedValue(expectedNotification as any);

      const result = await service.create(createDto);

      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(repository.save).toHaveBeenCalled();
      expect(queue.add).toHaveBeenCalledWith('send', expect.objectContaining({
        notificationId: expectedNotification.id,
        channel: createDto.channel,
        subject: createDto.subject,
        message: createDto.message,
        userId: createDto.user_id,
      }));
      expect(result).toEqual(expectedNotification);
    });
  });

  describe('findByUser', () => {
    it('should return notifications for user', async () => {
      const userId = 'user-123';
      const notifications = [
        { id: '1', user_id: userId, subject: 'Test' },
      ] as Notification[];

      repository.find.mockResolvedValue(notifications);

      const result = await service.findByUser(userId);

      expect(repository.find).toHaveBeenCalledWith({
        where: { user_id: userId },
        order: { created_at: 'DESC' },
      });
      expect(result).toEqual(notifications);
    });
  });

  describe('markAsSent', () => {
    it('should update status to sent', async () => {
      const id = 'notif-123';

      await service.markAsSent(id);

      expect(repository.update).toHaveBeenCalledWith(id, {
        status: NotificationStatus.SENT,
        sent_at: expect.any(Date),
      });
    });
  });

  describe('sendPaymentConfirmation', () => {
    it('should create payment confirmation notification', async () => {
      const userId = 'user-123';
      const eventName = 'Wedding Party';

      repository.save.mockResolvedValue({
        id: 'notif-123',
        user_id: userId,
        subject: 'Pembayaran Berhasil',
        message: expect.stringContaining(eventName),
      } as any);

      await service.sendPaymentConfirmation(userId, eventName);

      expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({
        user_id: userId,
        subject: 'Pembayaran Berhasil',
        channel: 'whatsapp',
      }));
      expect(queue.add).toHaveBeenCalled();
    });
  });
});
