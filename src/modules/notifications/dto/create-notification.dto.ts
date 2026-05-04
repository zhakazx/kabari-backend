import { IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { NotificationChannel } from '../entities/notification.entity';

export class CreateNotificationDto {
  @IsString()
  subject: string;

  @IsString()
  message: string;

  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  @IsUUID()
  user_id: string;

  @IsOptional()
  @IsUUID()
  invitation_id?: string;
}
