import { Controller, Post, Body, UseGuards, Get, Param } from '@nestjs/common';
import { CheckinsService } from './checkins.service';
import { CreateCheckInDto } from './dto/create-check-in.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('check-ins')
export class CheckinsController {
  constructor(private readonly checkinsService: CheckinsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PENERIMA_TAMU)
  create(
    @Body() createCheckInDto: CreateCheckInDto,
    @CurrentUser() user: { user_id: string },
  ) {
    return this.checkinsService.create(createCheckInDto, user.user_id);
  }

  @Get('event/:eventId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PELANGGAN, UserRole.PENERIMA_TAMU)
  findByEvent(@Param('eventId') eventId: string) {
    return this.checkinsService.findByEvent(eventId);
  }
}
