import {
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { EventStatus } from '../entities/event.entity';

export class CreateEventDto {
  @IsString()
  event_name: string;

  @IsDateString()
  event_date: string;

  @IsString()
  venue_name: string;

  @IsOptional()
  @IsString()
  venue_address?: string;

  @IsOptional()
  @IsString()
  maps_url?: string;

  @IsOptional()
  @IsUUID()
  template_id?: string;
}
