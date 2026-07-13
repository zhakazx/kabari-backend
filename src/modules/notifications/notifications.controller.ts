import { Controller, Get, Post, Body, Query, UseGuards, Param } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  create(@Body() createDto: CreateNotificationDto) {
    return this.notificationsService.create(createDto);
  }

  @Get()
  findByUser(
    @CurrentUser() user: { user_id: string },
    @Query() query: NotificationQueryDto,
  ) {
    return this.notificationsService.findByUser(user.user_id, query);
  }
}
