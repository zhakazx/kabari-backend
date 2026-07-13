import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InvitationsService } from './invitations.service';
import {
  Invitation,
  InvitationCategory,
  RsvpStatus,
} from './entities/invitation.entity';
import { Event } from '../events/entities/event.entity';
import { CreateGuestDto } from './dto/create-invitation.dto';
import { UpdateRsvpDto } from './dto/update-rsvp.dto';
import { NotFoundException } from '@nestjs/common';

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid'),
}));

jest.mock('qrcode', () => ({
  toDataURL: jest.fn(() => Promise.resolve('data:image/png;base64,mocked')),
}));

const mockInvitationRepository = () => ({
  create: jest.fn((dto) => dto),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
});

const mockEventRepository = () => ({
  findOne: jest.fn(),
});

describe('InvitationsService', () => {
  let service: InvitationsService;
  let invitationRepository: jest.Mocked<Repository<Invitation>>;
  let eventRepository: jest.Mocked<Repository<Event>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvitationsService,
        {
          provide: getRepositoryToken(Invitation),
          useFactory: mockInvitationRepository,
        },
        {
          provide: getRepositoryToken(Event),
          useFactory: mockEventRepository,
        },
      ],
    }).compile();

    service = module.get<InvitationsService>(InvitationsService);
    invitationRepository = module.get(getRepositoryToken(Invitation));
    eventRepository = module.get(getRepositoryToken(Event));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createBatch', () => {
    it('should create invitations with QR tokens for each guest', async () => {
      const eventId = 'event-123';
      const ownerId = 'user-123';
      const guests: CreateGuestDto[] = [
        {
          tamu_name: 'John Doe',
          tamu_phone: '08123456789',
          category: InvitationCategory.DIGITAL,
        },
        { tamu_name: 'Jane Doe', tamu_email: 'jane@example.com' },
      ];

      eventRepository.findOne.mockResolvedValue({
        id: eventId,
        pelanggan_id: ownerId,
      } as Event);
      invitationRepository.save.mockImplementation((invitations: any) =>
        Promise.resolve(
          Array.isArray(invitations)
            ? invitations.map((inv: any, i: number) => ({
                ...inv,
                id: `inv-${i}`,
              }))
            : [{ ...invitations, id: 'inv-0' }],
        ),
      );

      const result = await service.createBatch(eventId, guests, ownerId);

      expect(eventRepository.findOne).toHaveBeenCalledWith({
        where: { id: eventId },
      });
      expect(invitationRepository.save).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0].qr_code_token).toBeDefined();
      expect(result[1].qr_code_token).toBeDefined();
    });

    it('should throw NotFoundException if event does not exist', async () => {
      eventRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createBatch(
          'non-existent',
          [{ tamu_name: 'Test' }],
          'user-123',
        ),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByQrToken', () => {
    it('should return invitation by QR token', async () => {
      const invitation = {
        id: '1',
        qr_code_token: 'token-123',
        tamu_name: 'John',
        event: { status: 'active' },
      } as Invitation;

      invitationRepository.findOne.mockResolvedValue(invitation);

      const result = await service.findByQrToken('token-123');
      expect(result).toEqual(invitation);
    });

    it('should throw NotFoundException if token not found', async () => {
      invitationRepository.findOne.mockResolvedValue(null);

      await expect(service.findByQrToken('invalid')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateRsvp', () => {
    it('should update RSVP status', async () => {
      const invitation = {
        id: '1',
        qr_code_token: 'token-123',
        rsvp_status: RsvpStatus.PENDING,
        event: { status: 'active' },
      } as Invitation;

      const updateDto: UpdateRsvpDto = {
        rsvp_status: RsvpStatus.HADIR,
        jumlah_hadir: 2,
      };

      invitationRepository.findOne.mockResolvedValue(invitation);
      invitationRepository.save.mockResolvedValue({
        ...invitation,
        ...updateDto,
      });

      const result = await service.updateRsvp('token-123', updateDto);

      expect(result.rsvp_status).toBe(RsvpStatus.HADIR);
      expect(result.jumlah_hadir).toBe(2);
    });
  });
});
