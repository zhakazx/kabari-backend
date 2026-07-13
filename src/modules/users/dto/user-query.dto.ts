import { IsOptional, IsString, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole } from '../entities/user.entity';

export class UserQueryDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
