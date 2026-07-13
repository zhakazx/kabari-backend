import {
  IsEnum,
  IsOptional,
  IsInt,
  Min,
  IsString,
  IsBoolean,
  IsUUID,
} from 'class-validator';
import { RsvpConfirmationStatus } from '../entities/rsvp-confirmation.entity';

export class CreateRsvpDto {
  @IsEnum(RsvpConfirmationStatus)
  rsvp_status: RsvpConfirmationStatus;

  @IsOptional()
  @IsInt()
  @Min(1)
  jumlah_hadir?: number;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsBoolean()
  is_proxy?: boolean;

  @IsOptional()
  @IsUUID()
  proxy_by_user_id?: string;
}
