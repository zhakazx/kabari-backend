import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventsService } from './events.service';
import { Event, EventStatus } from './entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

const mockEventRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  query: jest.fn(),
});

describe('EventsService', () => {
  let service: EventsService;
  let repository: jest.Mocked<Repository<Event>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: getRepositoryToken(Event),
          useFactory: mockEventRepository,
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    repository = module.get(getRepositoryToken(Event));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an event with draft status', async () => {
      const createDto: CreateEventDto = {
        event_name: 'Wedding Party',
        event_date: '2025-12-25T18:00:00Z',
        venue_name: 'Grand Ballroom',
        venue_address: '123 Main St',
        maps_url: 'https://maps.google.com/...',
      };
      const pelangganId = 'user-123';

      const expectedEvent = {
        id: 'event-123',
        ...createDto,
        pelanggan_id: pelangganId,
        status: EventStatus.DRAFT,
      };

      repository.create.mockReturnValue(expectedEvent as any);
      repository.save.mockResolvedValue(expectedEvent as any);

      const result = await service.create(createDto, pelangganId);

      expect(repository.create).toHaveBeenCalledWith({
        ...createDto,
        pelanggan_id: pelangganId,
        status: EventStatus.DRAFT,
      });
      expect(result.status).toBe(EventStatus.DRAFT);
    });
  });

  describe('findOne', () => {
    it('should return an event by id', async () => {
      const event = { id: '1', event_name: 'Test Event' } as Event;
      repository.findOne.mockResolvedValue(event);

      const result = await service.findOne('1');
      expect(result).toEqual(event);
    });

    it('should throw NotFoundException if event not found', async () => {
      repository.findOne.mockResolvedValue(null);
      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update event if owner', async () => {
      const event = {
        id: '1',
        event_name: 'Old Name',
        pelanggan_id: 'user-123',
      } as Event;

      const updateDto: UpdateEventDto = { event_name: 'New Name' };

      repository.findOne.mockResolvedValue(event);
      repository.save.mockResolvedValue({ ...event, ...updateDto } as Event);

      const result = await service.update('1', updateDto, 'user-123');
      expect(result.event_name).toBe('New Name');
    });

    it('should throw ForbiddenException if not owner', async () => {
      const event = {
        id: '1',
        pelanggan_id: 'user-123',
      } as Event;

      repository.findOne.mockResolvedValue(event);

      await expect(
        service.update('1', { event_name: 'New' }, 'other-user'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getDashboardStats', () => {
    it('should return dashboard statistics', async () => {
      const event = {
        id: '1',
        pelanggan_id: 'user-123',
      } as Event;

      repository.findOne.mockResolvedValue(event);
      repository.query.mockResolvedValue([
        {
          total_tamu: '100',
          hadir: '80',
          tidak_hadir: '10',
          belum_rsvp: '10',
          sudah_check_in: '75',
        },
      ]);

      const result = await service.getDashboardStats('1', 'user-123');

      expect(result).toEqual({
        total_tamu: '100',
        hadir: '80',
        tidak_hadir: '10',
        belum_rsvp: '10',
        sudah_check_in: '75',
      });
    });
  });
});
