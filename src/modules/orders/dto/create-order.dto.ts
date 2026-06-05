import { IsString, IsNumber, IsOptional, IsUUID, Min, IsEnum } from 'class-validator';
import { PaymentMethod } from '../entities/payment.entity';

export class CreateOrderDto {
  @IsUUID()
  event_id: string;

  @IsString()
  package_type: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  total_amount?: number;

  @IsOptional()
  @IsEnum(PaymentMethod)
  preferred_payment_method?: PaymentMethod;
}
