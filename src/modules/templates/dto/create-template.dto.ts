import { IsString, IsNumber, IsEnum, IsOptional, MinLength, IsDecimal, Min } from 'class-validator';
import { TemplateStatus } from '../entities/template.entity';

export class CreateTemplateDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  @MinLength(1)
  category: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(0)
  price: number;
}
