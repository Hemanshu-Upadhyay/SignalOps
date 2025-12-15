import { IsISO8601, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateEventDto {
  @IsString()
  @MaxLength(120)
  type!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  source?: string;

  @IsOptional()
  @IsISO8601()
  occurredAt?: string;

  @IsObject()
  payload!: Record<string, any>;
}

