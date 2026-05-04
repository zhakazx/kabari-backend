import { IsString, IsEnum } from 'class-validator';

export class CreateCheckInDto {
  @IsString()
  qr_code_token: string;
}
