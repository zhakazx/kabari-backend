import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { User } from '../users/entities/user.entity';
import { Event } from '../events/entities/event.entity';
import { Template } from '../templates/entities/template.entity';
import { Order } from '../orders/entities/order.entity';
import { Invitation } from '../invitations/entities/invitation.entity';
import { TemplateSale } from '../orders/entities/template-sale.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Event,
      Template,
      Order,
      Invitation,
      TemplateSale,
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
