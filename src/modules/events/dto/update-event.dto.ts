import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { EventStatus } from '../entities/event.entity';

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  event_name?: string;

  @IsOptional()
  @IsDateString()
  event_date?: string;

  @IsOptional()
  @IsString()
  venue_name?: string;

  @IsOptional()
  @IsString()
  venue_address?: string;

  @IsOptional()
  @IsString()
  maps_url?: string;

  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;
}
