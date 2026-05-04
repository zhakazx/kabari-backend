import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TemplateStatus } from '../entities/template.entity';

export class UpdateTemplateStatusDto {
  @IsEnum(TemplateStatus)
  status: TemplateStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
