import { IsEnum, IsString, IsUUID } from 'class-validator';
import { PaymentMethod } from '../entities/payment.entity';

export class CreatePaymentDto {
  @IsUUID()
  order_id: string;

  @IsEnum(PaymentMethod)
  payment_method: PaymentMethod;
}
