import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  Logger,
  HttpException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShortUrlDto } from './dto/create-short-url.dto';
import { UpdateShortUrlDto } from './dto/update-short-url.dto';

@Injectable()
export class UrlShortenerService {
  // 1. Added Logger to help you debug errors in the terminal
  private readonly logger = new Logger(UrlShortenerService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Helper to generate unique ID
  private generateShortId(): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const length = Number(process.env.LENGTH) || 8; // Fixed typo: LENGHT -> LENGTH
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;
  }

  async shortenUrl(dto: CreateShortUrlDto) {
    try {
      const { longUrl, uriName, expiryDate, userName, email } = dto;

      // 1. Generate the unique Short ID
      let shortUrlId = this.generateShortId();

      // Check for collision (ensure ID is unique)
      let isUnique = false;
      while (!isUnique) {
        const existing = await this.prisma.shortUrl.findUnique({
          where: { shortUrlId },
        });
        if (!existing) isUnique = true;
        else shortUrlId = this.generateShortId();
      }

      // 2. Construct the full Short URL
      const baseUrl = process.env.BASE_URL || 'http://localhost:3000/url';
      const fullShortUrl = `${baseUrl}/${shortUrlId}`;

      // 3. Save to Database
      return await this.prisma.shortUrl.create({
        data: {
          longUrl,
          shortUrlId,
          shortUrl: fullShortUrl,
          uriName: uriName || null,
          expiryDate: expiryDate ? new Date(expiryDate) : null,
          userName: userName || null,
          email: email || null,
          createdBy: userName || 'system',
        },
      });
    } catch (error) {
      this.handleError(error, 'creating short URL');
    }
  }

  async getLongUrl(shortUrlId: string) {
    try {
      const urlRecord = await this.prisma.shortUrl.findUnique({
        where: { shortUrlId },
      });

      if (!urlRecord) {
        throw new NotFoundException('Short URL not found');
      }

      // Check Expiry (if expiryDate is set)
      if (urlRecord.expiryDate && new Date() > urlRecord.expiryDate) {
        throw new BadRequestException('This Short URL has expired');
      }

      return urlRecord.longUrl;
    } catch (error) {
      this.handleError(error, 'fetching long URL');
    }
  }

  async getUrlDetails(shortUrlId: string) {
    try {
      const urlRecord = await this.prisma.shortUrl.findUnique({
        where: { shortUrlId },
      });

      if (!urlRecord) {
        throw new NotFoundException('Short URL not found');
      }

      return urlRecord;
    } catch (error) {
      this.handleError(error, 'fetching URL details');
    }
  }

  async deleteShortUrl(shortUrlId: string) {
    try {
      // Check if it exists first
      const existing = await this.prisma.shortUrl.findUnique({
        where: { shortUrlId },
      });

      if (!existing) {
        throw new NotFoundException('Short URL not found');
      }

      // Delete the record
      await this.prisma.shortUrl.delete({
        where: { shortUrlId },
      });

      return { message: 'URL deleted successfully', shortUrlId };
    } catch (error) {
      this.handleError(error, 'deleting URL');
    }
  }

  async updateShortUrl(shortUrlId: string, updateDto: UpdateShortUrlDto) {
    try {
      // Check if exists
      const existing = await this.prisma.shortUrl.findUnique({
        where: { shortUrlId },
      });

      if (!existing) {
        throw new NotFoundException('Short URL not found');
      }

      // Update
      return await this.prisma.shortUrl.update({
        where: { shortUrlId },
        data: {
          ...updateDto,
          expiryDate: updateDto.expiryDate
            ? new Date(updateDto.expiryDate)
            : undefined,
          updateOn: new Date(),
        },
      });
    } catch (error) {
      this.handleError(error, 'updating URL');
    }
  }

  async checkAvailability(shortUrlId: string) {
    try {
      const existing = await this.prisma.shortUrl.findUnique({
        where: { shortUrlId },
      });

      return {
        shortUrlId,
        isAvailable: !existing,
      };
    } catch (error) {
      this.handleError(error, 'checking availability');
    }
  }

  // --- PRIVATE HELPER FOR ERROR HANDLING ---
  // This prevents code duplication in every catch block
  private handleError(error: any, context: string) : never {
    // 1. If the error is already a standard NestJS exception (like NotFound), re-throw it
    if (error instanceof HttpException) {
      throw error;
    }

    // 2. Log the actual system error to the console (so you can debug it)
    this.logger.error(`Error during ${context}: ${error.message}`, error.stack);

    // 3. Throw a generic 500 error to the user so the API doesn't crash silently
    throw new InternalServerErrorException(
      `An unexpected error occurred while ${context}`,
    );
  }
}