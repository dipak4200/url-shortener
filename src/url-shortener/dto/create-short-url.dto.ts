import { IsOptional, IsString, IsUrl, IsDateString } from 'class-validator';

export class CreateShortUrlDto {
  @IsUrl()
  longUrl: string;

  @IsOptional()
  @IsString()
  uriName?: string;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @IsOptional()
  @IsString()
  userName?: string;

  @IsOptional()
  @IsString()
  email?: string;
}
