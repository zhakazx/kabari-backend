import { Controller, Get, Query, UseGuards, Param } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('platform-kpi')
  @Roles(UserRole.ADMIN)
  getPlatformKpi() {
    return this.analyticsService.getPlatformKpi();
  }

  @Get('events/:eventId')
  @Roles(UserRole.ADMIN, UserRole.PELANGGAN)
  getEventAnalytics(@Param('eventId') eventId: string) {
    return this.analyticsService.getEventAnalytics(eventId);
  }

  @Get('creators')
  @Roles(UserRole.ADMIN)
  getCreatorAnalytics() {
    return this.analyticsService.getCreatorAnalytics();
  }

  @Get('revenue-trend')
  @Roles(UserRole.ADMIN)
  getRevenueTrend(@Query('days') days?: string) {
    return this.analyticsService.getRevenueTrend(
      days ? parseInt(days, 10) : 30,
    );
  }
}
