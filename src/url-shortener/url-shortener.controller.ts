import {
  Controller,
  Post,
  Get,
  Delete,
  Headers,
  Body,
  Param,
  Res,
  HttpStatus,
  ForbiddenException,
  UseGuards,
} from '@nestjs/common';
import { UrlShortenerService } from './url-shortener.service';
import { CreateShortUrlDto } from './dto/create-short-url.dto';
import type { Response } from 'express';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('url')
export class UrlShortenerController {
  constructor(private readonly urlShortenerService: UrlShortenerService) {}

  @Get('health')
  health() {
    return { status: 'OK' };
  }

  @Post('shorten')
  async shortenUrl(@Body() createShortUrlDto: CreateShortUrlDto) {
    return this.urlShortenerService.shortenUrl(createShortUrlDto);
  }

  @Get(':code')
  async redirect(@Param('code') code: string, @Res() res: Response) {
    // Note: We pass the 'code' (which is the shortUrlId) to the service
    const longUrl = await this.urlShortenerService.getLongUrl(code);
    return res.redirect(HttpStatus.FOUND, longUrl);
  }

  @Get('details/:code')
  async getUrlDetails(@Param('code') code: string) {
    return this.urlShortenerService.getUrlDetails(code);
  }

  @Delete('delete/:code')
  @UseGuards(RolesGuard)
  async deleteUrl(
    @Param('code') code: string) {

    // 2. Call Service to Delete
    return this.urlShortenerService.deleteShortUrl(code);
  }
}