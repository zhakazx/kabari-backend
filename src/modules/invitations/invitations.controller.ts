import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import { CreateGuestDto } from './dto/create-invitation.dto';
import { UpdateRsvpDto } from './dto/update-rsvp.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post('batch')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PELANGGAN)
  createBatch(
    @Body('event_id') eventId: string,
    @Body('guests') guests: CreateGuestDto[],
    @CurrentUser() user: { user_id: string },
  ) {
    return this.invitationsService.createBatch(eventId, guests, user.user_id);
  }

  @Get('event/:eventId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PELANGGAN)
  findByEvent(@Param('eventId') eventId: string) {
    return this.invitationsService.findByEvent(eventId);
  }

  @Get(':token')
  findByToken(@Param('token') token: string) {
    return this.invitationsService.findByQrToken(token);
  }

  @Patch(':token/rsvp')
  updateRsvp(
    @Param('token') token: string,
    @Body() updateRsvpDto: UpdateRsvpDto,
  ) {
    return this.invitationsService.updateRsvp(token, updateRsvpDto);
  }

  @Get(':token/qr-code')
  async generateQrCode(@Param('token') token: string) {
    const dataUrl = await this.invitationsService.generateQrCodeDataUrl(token);
    return { qr_code_data_url: dataUrl };
  }
}
