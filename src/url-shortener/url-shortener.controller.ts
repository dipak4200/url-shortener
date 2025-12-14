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
  Patch,
  UseGuards,
} from '@nestjs/common';
import { UrlShortenerService } from './url-shortener.service';
import { CreateShortUrlDto } from './dto/create-short-url.dto';
import { UpdateShortUrlDto } from './dto/update-short-url.dto';
import type { Response } from 'express';
import { RolesGuard } from '../common/guards/roles.guard';

import { Roles } from '../common/decorators/roles.decorator';
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
  async deleteUrl(@Param('code') code: string) {
    return this.urlShortenerService.deleteShortUrl(code);
  }

  @Patch('edit/:code')
  @UseGuards(RolesGuard)
  @Roles('admin', 'manager') // <--- Only Admin OR Manager can access this
  async updateUrl(
    @Param('code') code: string,
    @Body() updateDto: UpdateShortUrlDto
  ) {
    return this.urlShortenerService.updateShortUrl(code, updateDto);
  }

  @Get('check/:code')
  async checkAvailability(@Param('code') code: string) {
    return this.urlShortenerService.checkAvailability(code);
  }
}