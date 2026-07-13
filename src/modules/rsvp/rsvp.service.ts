import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RsvpConfirmation } from './entities/rsvp-confirmation.entity';
import {
  Invitation,
  RsvpStatus,
} from '../invitations/entities/invitation.entity';
import { CreateRsvpDto } from './dto/create-rsvp.dto';
import { DashboardGateway } from '../../gateways/dashboard.gateway';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class RsvpService {
  constructor(
    @InjectRepository(RsvpConfirmation)
    private readonly rsvpRepository: Repository<RsvpConfirmation>,
    @InjectRepository(Invitation)
    private readonly invitationRepository: Repository<Invitation>,
    private readonly dashboardGateway: DashboardGateway,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(
    qrToken: string,
    createRsvpDto: CreateRsvpDto,
  ): Promise<RsvpConfirmation> {
    const invitation = await this.invitationRepository.findOne({
      where: { qr_code_token: qrToken },
      relations: ['event'],
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    // Update invitation RSVP status
    invitation.rsvp_status =
      createRsvpDto.rsvp_status === 'hadir'
        ? RsvpStatus.HADIR
        : RsvpStatus.TIDAK_HADIR;
    if (createRsvpDto.jumlah_hadir) {
      invitation.jumlah_hadir = createRsvpDto.jumlah_hadir;
    }
    await this.invitationRepository.save(invitation);

    const rsvp = this.rsvpRepository.create({
      invitation_id: invitation.id,
      rsvp_status: createRsvpDto.rsvp_status,
      jumlah_hadir: createRsvpDto.jumlah_hadir || 1,
      message: createRsvpDto.message,
      is_proxy: createRsvpDto.is_proxy || false,
      proxy_by_user_id: createRsvpDto.proxy_by_user_id,
    });

    const saved = await this.rsvpRepository.save(rsvp);

    // Broadcast real-time update
    this.dashboardGateway.broadcastStats(invitation.event_id, {
      type: 'rsvp',
      rsvp_status: invitation.rsvp_status,
      tamu_name: invitation.tamu_name,
      timestamp: new Date().toISOString(),
    });

    // Send RSVP notification to event owner
    const event = invitation.event;
    if (event) {
      await this.notificationsService.sendRsvpNotification(
        event.pelanggan_id,
        invitation.tamu_name,
        event.event_name,
      );
    }

    return saved;
  }

  async findByInvitation(invitationId: string): Promise<RsvpConfirmation[]> {
    return this.rsvpRepository.find({
      where: { invitation_id: invitationId },
      relations: ['invitation', 'proxy_by_user'],
      order: { confirmed_at: 'DESC' },
    });
  }
}
