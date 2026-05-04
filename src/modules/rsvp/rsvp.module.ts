import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RsvpService } from './rsvp.service';
import { RsvpController } from './rsvp.controller';
import { RsvpConfirmation } from './entities/rsvp-confirmation.entity';
import { Invitation } from '../invitations/entities/invitation.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RsvpConfirmation, Invitation]),
    NotificationsModule,
  ],
  controllers: [RsvpController],
  providers: [RsvpService],
  exports: [RsvpService],
})
export class RsvpModule {}
