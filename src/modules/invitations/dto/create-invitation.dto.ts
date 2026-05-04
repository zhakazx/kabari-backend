import { IsString, IsOptional, IsEnum, IsEmail, IsUUID } from 'class-validator';
import { InvitationCategory } from '../entities/invitation.entity';

export class CreateGuestDto {
  @IsString()
  tamu_name: string;

  @IsOptional()
  @IsString()
  tamu_phone?: string;

  @IsOptional()
  @IsEmail()
  tamu_email?: string;

  @IsOptional()
  @IsEnum(InvitationCategory)
  category?: InvitationCategory;
}

export class BatchCreateInvitationsDto {
  @IsUUID()
  event_id: string;

  guests: CreateGuestDto[];
}
