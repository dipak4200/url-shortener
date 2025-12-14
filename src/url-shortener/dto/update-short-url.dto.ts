import { IsOptional, IsString, IsDateString, IsUrl } from 'class-validator';

export class UpdateShortUrlDto {
  @IsOptional()
  @IsUrl()
  longUrl?: string;

  @IsOptional()
  @IsString()
  uriName?: string;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;
}