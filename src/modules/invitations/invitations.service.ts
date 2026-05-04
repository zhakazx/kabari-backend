import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invitation, InvitationCategory, RsvpStatus } from './entities/invitation.entity';
import { CreateGuestDto } from './dto/create-invitation.dto';
import { UpdateRsvpDto } from './dto/update-rsvp.dto';
import { Event, EventStatus } from '../events/entities/event.entity';
import { v4 as uuidv4 } from 'uuid';
import * as QRCode from 'qrcode';

@Injectable()
export class InvitationsService {
  constructor(
    @InjectRepository(Invitation)
    private readonly invitationRepository: Repository<Invitation>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
  ) {}

  async createBatch(
    eventId: string,
    guests: CreateGuestDto[],
  ): Promise<Invitation[]> {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
    });
    if (!event) {
      throw new NotFoundException(`Event with ID "${eventId}" not found`);
    }

    const invitations: Invitation[] = [];

    for (const guest of guests) {
      const qrToken = uuidv4();
      const invitation = this.invitationRepository.create({
        ...guest,
        event_id: eventId,
        qr_code_token: qrToken,
        category: guest.category || InvitationCategory.DIGITAL,
        rsvp_status: RsvpStatus.PENDING,
      });
      invitations.push(invitation);
    }

    return this.invitationRepository.save(invitations);
  }

  async findByEvent(eventId: string): Promise<Invitation[]> {
    return this.invitationRepository.find({
      where: { event_id: eventId },
      order: { created_at: 'DESC' },
    });
  }

  async findByQrToken(qrToken: string): Promise<Invitation> {
    const invitation = await this.invitationRepository.findOne({
      where: { qr_code_token: qrToken },
      relations: ['event'],
    });
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }
    return invitation;
  }

  async updateRsvp(qrToken: string, updateRsvpDto: UpdateRsvpDto): Promise<Invitation> {
    const invitation = await this.findByQrToken(qrToken);
    
    invitation.rsvp_status = updateRsvpDto.rsvp_status;
    if (updateRsvpDto.jumlah_hadir) {
      invitation.jumlah_hadir = updateRsvpDto.jumlah_hadir;
    }

    return this.invitationRepository.save(invitation);
  }

  async generateQrCodeDataUrl(qrToken: string): Promise<string> {
    return QRCode.toDataURL(qrToken, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
  }

  async remove(id: string): Promise<void> {
    const invitation = await this.invitationRepository.findOne({
      where: { id },
    });
    if (!invitation) {
      throw new NotFoundException(`Invitation with ID "${id}" not found`);
    }
    await this.invitationRepository.remove(invitation);
  }
}
