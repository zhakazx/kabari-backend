import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RsvpService } from './rsvp.service';
import {
  RsvpConfirmation,
  RsvpConfirmationStatus,
} from './entities/rsvp-confirmation.entity';
import {
  Invitation,
  RsvpStatus,
} from '../invitations/entities/invitation.entity';
import { CreateRsvpDto } from './dto/create-rsvp.dto';
import { NotFoundException } from '@nestjs/common';
import { DashboardGateway } from '../../gateways/dashboard.gateway';
import { NotificationsService } from '../notifications/notifications.service';

const mockRsvpRepository = () => ({
  create: jest.fn((dto) => dto),
  save: jest.fn(),
  find: jest.fn(),
});

const mockInvitationRepository = () => ({
  findOne: jest.fn(),
  save: jest.fn(),
});

const mockDashboardGateway = () => ({
  broadcastStats: jest.fn(),
});

const mockNotificationsService = () => ({
  sendRsvpNotification: jest.fn(),
});

describe('RsvpService', () => {
  let service: RsvpService;
  let rsvpRepository: jest.Mocked<Repository<RsvpConfirmation>>;
  let invitationRepository: jest.Mocked<Repository<Invitation>>;
  let dashboardGateway: jest.Mocked<DashboardGateway>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RsvpService,
        {
          provide: getRepositoryToken(RsvpConfirmation),
          useFactory: mockRsvpRepository,
        },
        {
          provide: getRepositoryToken(Invitation),
          useFactory: mockInvitationRepository,
        },
        {
          provide: DashboardGateway,
          useFactory: mockDashboardGateway,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService(),
        },
      ],
    }).compile();

    service = module.get<RsvpService>(RsvpService);
    rsvpRepository = module.get(getRepositoryToken(RsvpConfirmation));
    invitationRepository = module.get(getRepositoryToken(Invitation));
    dashboardGateway = module.get(DashboardGateway);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create RSVP and update invitation status', async () => {
      const qrToken = 'token-123';
      const createDto: CreateRsvpDto = {
        rsvp_status: RsvpConfirmationStatus.HADIR,
        jumlah_hadir: 2,
        message: 'See you there!',
      };

      const invitation = {
        id: 'inv-123',
        qr_code_token: qrToken,
        tamu_name: 'John Doe',
        event_id: 'event-123',
        rsvp_status: RsvpStatus.PENDING,
      } as Invitation;

      invitationRepository.findOne.mockResolvedValue(invitation);
      invitationRepository.save.mockResolvedValue({
        ...invitation,
        rsvp_status: RsvpStatus.HADIR,
        jumlah_hadir: 2,
      });
      rsvpRepository.save.mockResolvedValue({
        id: 'rsvp-1',
        invitation_id: invitation.id,
        ...createDto,
      } as RsvpConfirmation);

      const result = await service.create(qrToken, createDto);

      expect(invitationRepository.findOne).toHaveBeenCalledWith({
        where: { qr_code_token: qrToken },
        relations: ['event'],
      });
      expect(invitationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          rsvp_status: RsvpStatus.HADIR,
          jumlah_hadir: 2,
        }),
      );
      expect(rsvpRepository.save).toHaveBeenCalled();
      expect(dashboardGateway.broadcastStats).toHaveBeenCalledWith(
        'event-123',
        expect.objectContaining({ type: 'rsvp' }),
      );
      expect(result.rsvp_status).toBe(RsvpConfirmationStatus.HADIR);
    });

    it('should throw NotFoundException if invitation not found', async () => {
      invitationRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create('invalid-token', {
          rsvp_status: RsvpConfirmationStatus.HADIR,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
