import { IsString, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateOrderDto {
  @IsUUID()
  event_id: string;

  @IsString()
  package_type: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  total_amount?: number;
}
