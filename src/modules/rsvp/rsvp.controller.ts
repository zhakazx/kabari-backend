import { Controller, Post, Param, Body, Get } from '@nestjs/common';
import { RsvpService } from './rsvp.service';
import { CreateRsvpDto } from './dto/create-rsvp.dto';

@Controller('rsvp')
export class RsvpController {
  constructor(private readonly rsvpService: RsvpService) {}

  @Post(':token')
  create(
    @Param('token') token: string,
    @Body() createRsvpDto: CreateRsvpDto,
  ) {
    return this.rsvpService.create(token, createRsvpDto);
  }

  @Get('invitation/:invitationId')
  findByInvitation(@Param('invitationId') invitationId: string) {
    return this.rsvpService.findByInvitation(invitationId);
  }
}
