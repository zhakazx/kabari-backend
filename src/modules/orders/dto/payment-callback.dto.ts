import { IsString, IsOptional } from 'class-validator';

export class PaymentCallbackDto {
  @IsString()
  invoice_id: string;

  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  paid_at?: string;

  @IsOptional()
  @IsString()
  reference_no?: string;

  @IsOptional()
  @IsString()
  signature?: string;
}
