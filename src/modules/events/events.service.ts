import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event, EventStatus } from './entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
  ) {}

  async create(createEventDto: CreateEventDto, pelangganId: string): Promise<Event> {
    const event = this.eventRepository.create({
      ...createEventDto,
      pelanggan_id: pelangganId,
      status: EventStatus.DRAFT,
    });
    return this.eventRepository.save(event);
  }

  async findAllByPelanggan(pelangganId: string): Promise<Event[]> {
    return this.eventRepository.find({
      where: { pelanggan_id: pelangganId },
      relations: ['template'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Event> {
    const event = await this.eventRepository.findOne({
      where: { id },
      relations: ['template', 'pelanggan'],
    });
    if (!event) {
      throw new NotFoundException(`Event with ID "${id}" not found`);
    }
    return event;
  }

  async update(id: string, updateEventDto: UpdateEventDto, pelangganId: string): Promise<Event> {
    const event = await this.findOne(id);
    if (event.pelanggan_id !== pelangganId) {
      throw new ForbiddenException('You can only update your own events');
    }
    Object.assign(event, updateEventDto);
    return this.eventRepository.save(event);
  }

  async remove(id: string, pelangganId: string): Promise<void> {
    const event = await this.findOne(id);
    if (event.pelanggan_id !== pelangganId) {
      throw new ForbiddenException('You can only delete your own events');
    }
    await this.eventRepository.remove(event);
  }

  async getDashboardStats(eventId: string, pelangganId: string) {
    const event = await this.findOne(eventId);
    if (event.pelanggan_id !== pelangganId) {
      throw new ForbiddenException('You can only view your own event dashboard');
    }

    const result = await this.eventRepository.query(
      `
      SELECT 
        COUNT(*) as total_tamu,
        COUNT(CASE WHEN rsvp_status = 'hadir' THEN 1 END) as hadir,
        COUNT(CASE WHEN rsvp_status = 'tidak_hadir' THEN 1 END) as tidak_hadir,
        COUNT(CASE WHEN rsvp_status = 'pending' THEN 1 END) as belum_rsvp,
        COUNT(CASE WHEN check_in_status = 'sudah_check_in' THEN 1 END) as sudah_check_in
      FROM invitations
      WHERE event_id = $1
      `,
      [eventId],
    );

    return result[0];
  }
}
