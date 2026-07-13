import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get(':eventId/guests/xlsx')
  @Roles(UserRole.PELANGGAN)
  async downloadGuestReportXLSX(
    @Param('eventId') eventId: string,
    @Res() res: Response,
    @CurrentUser() user: { user_id: string },
  ) {
    const buffer = await this.reportsService.generateGuestReportXLSX(
      eventId,
      user.user_id,
    );

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=buku-tamu-${eventId}.xlsx`,
    );
    res.send(buffer);
  }
}
