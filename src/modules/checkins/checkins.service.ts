import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CheckIn, CheckInMethod } from './entities/check-in.entity';
import { CheckInQueryDto } from './dto/checkin-query.dto';
import {
  Invitation,
  CheckInStatus,
} from '../invitations/entities/invitation.entity';
import { CreateCheckInDto } from './dto/create-check-in.dto';
import { DashboardGateway } from '../../gateways/dashboard.gateway';

export interface CheckInResult {
  tamu_name: string;
  rsvp_status: string;
  check_in_status: 'sukses' | 'gagal' | 'tidak_terdaftar';
  message: string;
  event_id: string;
  event_name: string;
}

@Injectable()
export class CheckinsService {
  constructor(
    @InjectRepository(CheckIn)
    private readonly checkInRepository: Repository<CheckIn>,
    @InjectRepository(Invitation)
    private readonly invitationRepository: Repository<Invitation>,
    private readonly dashboardGateway: DashboardGateway,
  ) {}

  async create(
    createCheckInDto: CreateCheckInDto,
    checkedInBy: string,
  ): Promise<CheckInResult> {
    const invitation = await this.invitationRepository.findOne({
      where: { qr_code_token: createCheckInDto.qr_code_token },
      relations: ['event'],
    });

    if (!invitation) {
      return {
        tamu_name: '',
        rsvp_status: '',
        check_in_status: 'tidak_terdaftar',
        message: 'QR code tidak terdaftar dalam sistem',
        event_id: '',
        event_name: '',
      };
    }

    if (invitation.check_in_status === CheckInStatus.SUDAH_CHECK_IN) {
      return {
        tamu_name: invitation.tamu_name,
        rsvp_status: invitation.rsvp_status,
        check_in_status: 'gagal',
        message: 'Tamu sudah melakukan check-in sebelumnya',
        event_id: invitation.event_id,
        event_name: invitation.event?.event_name ?? '',
      };
    }

    // Update invitation check-in status
    invitation.check_in_status = CheckInStatus.SUDAH_CHECK_IN;
    await this.invitationRepository.save(invitation);

    // Create check-in record
    const checkIn = this.checkInRepository.create({
      invitation_id: invitation.id,
      checked_in_by: checkedInBy,
      method: CheckInMethod.QR_SCAN,
    });
    await this.checkInRepository.save(checkIn);

    // Broadcast real-time update
    this.dashboardGateway.broadcastCheckIn(invitation.event_id, {
      type: 'check_in',
      tamu_name: invitation.tamu_name,
      rsvp_status: invitation.rsvp_status,
      checked_in_at: new Date().toISOString(),
    });

    return {
      tamu_name: invitation.tamu_name,
      rsvp_status: invitation.rsvp_status,
      check_in_status: 'sukses',
      message: 'Check-in berhasil',
      event_id: invitation.event_id,
      event_name: invitation.event?.event_name ?? '',
    };
  }

  async findByEvent(eventId: string, query: CheckInQueryDto = { page: 1, limit: 50 }) {
    const { page, limit } = query;
    const skip = (page! - 1) * limit!;

    const [data, total] = await this.checkInRepository.findAndCount({
      where: { invitation: { event_id: eventId } },
      relations: ['invitation', 'checked_in_by_user'],
      skip,
      take: limit,
      order: { checked_in_at: 'DESC' },
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit!),
      },
    };
  }
}
