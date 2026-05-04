import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { NotificationsService } from '../modules/notifications/notifications.service';

@Processor('notifications')
export class NotificationProcessor {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Process('send')
  async handleSend(job: Job) {
    const { notificationId, channel, subject, message, userId } = job.data;

    try {
      console.log(`[Notification] Sending ${channel} notification to user ${userId}: ${subject}`);

      // Simulate sending based on channel
      switch (channel) {
        case 'whatsapp':
          // In production, integrate with WhatsApp API (e.g., Twilio, Waboxapp)
          console.log(`[WhatsApp] To ${userId}: ${message}`);
          break;
        case 'email':
          // In production, integrate with Email service (e.g., SendGrid, AWS SES)
          console.log(`[Email] To ${userId}: ${subject} - ${message}`);
          break;
        case 'in_app':
          // In-app notifications are just stored in DB
          console.log(`[In-App] To ${userId}: ${subject}`);
          break;
        default:
          console.log(`[Unknown Channel] ${channel}: ${message}`);
      }

      // Mark as sent
      await this.notificationsService.markAsSent(notificationId);

      return { success: true, notificationId };
    } catch (error) {
      console.error(`[Notification] Failed to send notification ${notificationId}:`, error);
      await this.notificationsService.markAsFailed(notificationId);
      throw error;
    }
  }
}
