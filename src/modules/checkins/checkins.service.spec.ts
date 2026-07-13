import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CheckinsService, CheckInResult } from './checkins.service';
import { CheckIn } from './entities/check-in.entity';
import {
  Invitation,
  CheckInStatus,
  RsvpStatus,
} from '../invitations/entities/invitation.entity';
import { Event } from '../events/entities/event.entity';
import { CreateCheckInDto } from './dto/create-check-in.dto';
import { DashboardGateway } from '../../gateways/dashboard.gateway';

const mockCheckInRepository = () => ({
  create: jest.fn((dto) => dto),
  save: jest.fn(),
  find: jest.fn(),
});

const mockInvitationRepository = () => ({
  findOne: jest.fn(),
  save: jest.fn(),
});

const mockDashboardGateway = () => ({
  broadcastCheckIn: jest.fn(),
});

describe('CheckinsService', () => {
  let service: CheckinsService;
  let checkInRepository: jest.Mocked<Repository<CheckIn>>;
  let invitationRepository: jest.Mocked<Repository<Invitation>>;
  let dashboardGateway: jest.Mocked<DashboardGateway>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckinsService,
        {
          provide: getRepositoryToken(CheckIn),
          useFactory: mockCheckInRepository,
        },
        {
          provide: getRepositoryToken(Invitation),
          useFactory: mockInvitationRepository,
        },
        {
          provide: DashboardGateway,
          useFactory: mockDashboardGateway,
        },
      ],
    }).compile();

    service = module.get<CheckinsService>(CheckinsService);
    checkInRepository = module.get(getRepositoryToken(CheckIn));
    invitationRepository = module.get(getRepositoryToken(Invitation));
    dashboardGateway = module.get(DashboardGateway);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should successfully check in a guest', async () => {
      const createDto: CreateCheckInDto = { qr_code_token: 'token-123' };
      const checkedInBy = 'user-123';

      const invitation = {
        id: 'inv-123',
        qr_code_token: 'token-123',
        tamu_name: 'John Doe',
        rsvp_status: RsvpStatus.HADIR,
        check_in_status: CheckInStatus.BELUM_CHECK_IN,
        event_id: 'event-123',
        event: { id: 'event-123', event_name: 'Pernikahan Andi' } as Event,
      } as Invitation;

      invitationRepository.findOne.mockResolvedValue(invitation);
      invitationRepository.save.mockResolvedValue({
        ...invitation,
        check_in_status: CheckInStatus.SUDAH_CHECK_IN,
      });
      checkInRepository.save.mockResolvedValue({
        id: 'checkin-1',
        invitation_id: invitation.id,
        checked_in_by: checkedInBy,
      } as CheckIn);

      const result = await service.create(createDto, checkedInBy);

      expect(result.check_in_status).toBe('sukses');
      expect(result.tamu_name).toBe('John Doe');
      expect(result.event_id).toBe('event-123');
      expect(result.event_name).toBe('Pernikahan Andi');
      expect(invitationRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          check_in_status: CheckInStatus.SUDAH_CHECK_IN,
        }),
      );
      expect(checkInRepository.save).toHaveBeenCalled();
      expect(dashboardGateway.broadcastCheckIn).toHaveBeenCalledWith(
        'event-123',
        expect.objectContaining({ type: 'check_in' }),
      );
    });

    it('should return tidak_terdaftar for invalid QR token', async () => {
      invitationRepository.findOne.mockResolvedValue(null);

      const result = await service.create(
        { qr_code_token: 'invalid' },
        'user-123',
      );

      expect(result.check_in_status).toBe('tidak_terdaftar');
      expect(result.event_id).toBe('');
      expect(result.event_name).toBe('');
      expect(checkInRepository.save).not.toHaveBeenCalled();
    });

    it('should return gagal if already checked in', async () => {
      const invitation = {
        id: 'inv-123',
        qr_code_token: 'token-123',
        tamu_name: 'John Doe',
        rsvp_status: RsvpStatus.HADIR,
        check_in_status: CheckInStatus.SUDAH_CHECK_IN,
        event_id: 'event-123',
        event: { id: 'event-123', event_name: 'Pernikahan Andi' } as Event,
      } as Invitation;

      invitationRepository.findOne.mockResolvedValue(invitation);

      const result = await service.create(
        { qr_code_token: 'token-123' },
        'user-123',
      );

      expect(result.check_in_status).toBe('gagal');
      expect(result.event_id).toBe('event-123');
      expect(result.event_name).toBe('Pernikahan Andi');
      expect(checkInRepository.save).not.toHaveBeenCalled();
    });
  });
});
