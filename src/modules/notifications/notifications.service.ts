import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationStatus } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectQueue('notifications')
    private readonly notificationsQueue: Queue,
  ) {}

  async create(createDto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create(createDto);
    const saved = await this.notificationRepository.save(notification);

    // Add to queue for async processing
    await this.notificationsQueue.add('send', {
      notificationId: saved.id,
      channel: saved.channel,
      subject: saved.subject,
      message: saved.message,
      userId: saved.user_id,
    });

    return saved;
  }

  async findByUser(userId: string): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
    });
  }

  async markAsSent(id: string): Promise<void> {
    await this.notificationRepository.update(id, {
      status: NotificationStatus.SENT,
      sent_at: new Date(),
    });
  }

  async markAsFailed(id: string): Promise<void> {
    await this.notificationRepository.update(id, {
      status: NotificationStatus.FAILED,
    });
  }

  // Helper methods for other services to trigger notifications
  async sendPaymentConfirmation(userId: string, eventName: string): Promise<Notification> {
    return this.create({
      user_id: userId,
      subject: 'Pembayaran Berhasil',
      message: `Pembayaran untuk acara "${eventName}" telah berhasil. Acara Anda sekarang aktif!`,
      channel: 'whatsapp' as any,
    });
  }

  async sendRsvpNotification(userId: string, tamuName: string, eventName: string): Promise<Notification> {
    return this.create({
      user_id: userId,
      subject: 'RSVP Diterima',
      message: `Tamu "${tamuName}" telah mengkonfirmasi kehadiran untuk acara "${eventName}".`,
      channel: 'in_app' as any,
    });
  }

  async sendEventReminder(userId: string, eventName: string, eventDate: string): Promise<Notification> {
    return this.create({
      user_id: userId,
      subject: 'Pengingat Acara',
      message: `Acara "${eventName}" akan dilaksanakan pada ${eventDate}. Jangan lupa untuk mempersiapkan segala sesuatunya!`,
      channel: 'email' as any,
    });
  }
}
