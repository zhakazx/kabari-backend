import { IsEnum, IsOptional, IsInt, Min, IsString } from 'class-validator';
import { RsvpStatus } from '../entities/invitation.entity';

export class UpdateRsvpDto {
  @IsEnum(RsvpStatus)
  rsvp_status: RsvpStatus;

  @IsOptional()
  @IsInt()
  @Min(1)
  jumlah_hadir?: number;

  @IsOptional()
  @IsString()
  message?: string;
}
