import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invitation } from '../invitations/entities/invitation.entity';
import { Event } from '../events/entities/event.entity';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Invitation)
    private readonly invitationRepository: Repository<Invitation>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
  ) {}

  async generateGuestReportXLSX(eventId: string, ownerId: string): Promise<Buffer> {
    const event = await this.eventRepository.findOne({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }
    if (event.pelanggan_id !== ownerId) {
      throw new ForbiddenException('You do not have access to this report');
    }

    const invitations = await this.invitationRepository.find({
      where: { event_id: eventId },
      order: { created_at: 'DESC' },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Buku Tamu');

    // Title
    worksheet.mergeCells('A1:F1');
    worksheet.getCell('A1').value = `Buku Tamu - ${event.event_name}`;
    worksheet.getCell('A1').font = { size: 16, bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    // Headers
    worksheet.getRow(3).values = ['No', 'Nama Tamu', 'No. HP', 'Email', 'RSVP', 'Check-in'];
    worksheet.getRow(3).font = { bold: true };

    // Data
    invitations.forEach((invitation, index) => {
      worksheet.addRow([
        index + 1,
        invitation.tamu_name,
        invitation.tamu_phone || '-',
        invitation.tamu_email || '-',
        invitation.rsvp_status,
        invitation.check_in_status === 'sudah_check_in' ? 'Sudah' : 'Belum',
      ]);
    });

    // Auto width
    worksheet.columns.forEach((column) => {
      column.width = 20;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
